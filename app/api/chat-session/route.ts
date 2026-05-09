import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json()
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user from the server-side session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('No authenticated user found in chat session API')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }
    
    console.log('Loading chat session:', sessionId, 'for user:', user.id)
    
    // Load the specific chat session and its messages
    const { data: session, error } = await supabase
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
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()
    
    if (error) {
      console.error('Error loading chat session:', error)
      return NextResponse.json({ error: 'Failed to load chat session' }, { status: 500 })
    }
    
    if (!session) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 })
    }
    
    // Convert database messages to UI messages
    const messages = (session.chat_messages || [])
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      role: msg.role as 'user' | 'assistant',
      timestamp: msg.created_at
    }))
    
    console.log('Chat session loaded successfully:', session.id, 'with', messages.length, 'messages')
    
    return NextResponse.json({ 
      session: {
        id: session.id,
        title: session.title,
        subtitle: session.subtitle,
        updatedAt: session.updated_at
      },
      messages
    })
    
  } catch (error) {
    console.error('Error in chat session API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 