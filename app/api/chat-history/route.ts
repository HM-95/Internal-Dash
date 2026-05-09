import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user from the server-side session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('No authenticated user found in chat history API')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    console.log('Loading chat history for user:', user.id)
    
    // Fetch chat sessions for the authenticated user
    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select(`
        id,
        title,
        subtitle,
        updated_at,
        chat_messages (
          id,
          content,
          role,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      // Ensure nested messages are ordered chronologically so we can reliably pick the latest assistant reply
      .order('created_at', { foreignTable: 'chat_messages', ascending: true })
    
    if (error) {
      console.error('Error loading chat history:', error)
      return NextResponse.json({ error: 'Failed to load chat history' }, { status: 500 })
    }
    
    // Helpers to format text without sidebar overflow
    const sanitizeText = (text: string): string => {
      return (text || '')
        .replace(/\s+/g, ' ')
        .replace(/\n|\r/g, ' ')
        .trim()
    }
    const truncateWords = (text: string, maxWords: number): string => {
      if (!text) return ''
      const words = sanitizeText(text).split(/\s+/)
      if (words.length <= maxWords) return text.trim()
      return words.slice(0, maxWords).join(' ') + '…'
    }
    const truncateChars = (text: string, maxChars: number): string => {
      const t = sanitizeText(text)
      if (!t) return ''
      if (t.length <= maxChars) return t
      return t.slice(0, maxChars).trimEnd() + '…'
    }

    // Format the chat history
    const formattedHistory = (sessions || []).map((session: any) => {
      const messages = ((session.chat_messages || []) as Array<{ id: string; content: string; role: string; created_at: string }>)
        .slice()
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      // Prefer the latest assistant message that is NOT a creator-results marker
      const assistantMessages = messages.filter(m => m.role === 'assistant' && !m.content?.startsWith('CREATOR_RESULTS:'))
      const latestAssistant = assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1] : null
      // Fallback to latest non-marker message if no assistant message found
      const nonMarkerMessages = messages.filter(m => !m.content?.startsWith('CREATOR_RESULTS:'))
      const latestNonMarker = nonMarkerMessages.length > 0 ? nonMarkerMessages[nonMarkerMessages.length - 1] : null
      
      const rawSubtitle = latestAssistant?.content || latestNonMarker?.content || ''
      // Apply word and char limits for robustness
      const formattedSubtitle = truncateChars(truncateWords(rawSubtitle, 20), 110)
      // Stricter limits to guarantee no horizontal overflow
      const formattedTitle = truncateChars(truncateWords(session.title || 'Untitled chat', 7), 45)
      
      return {
        id: session.id,
        title: formattedTitle,
        lastMessage: formattedSubtitle,
        lastUpdated: session.updated_at,
        messageCount: messages.length
      }
    })
    
    console.log('Chat history loaded successfully:', formattedHistory.length, 'sessions')
    
    return NextResponse.json({ 
      chatHistory: formattedHistory,
      userId: user.id 
    })
    
  } catch (error) {
    console.error('Error in chat history API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 