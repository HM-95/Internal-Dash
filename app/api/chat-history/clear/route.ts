import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client inside the handler
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // First, get all session IDs for the user
    const { data: sessions, error: sessionsFetchError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('user_id', userId)

    if (sessionsFetchError) {
      console.error('Error fetching chat sessions:', sessionsFetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch chat sessions' },
        { status: 500 }
      )
    }

    const sessionIds = sessions?.map(s => s.id) || []

    // Delete all chat messages for the user's sessions
    if (sessionIds.length > 0) {
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .in('chat_session_id', sessionIds)

      if (messagesError) {
        console.error('Error deleting chat messages:', messagesError)
      }

      // Also delete all creator results for the user's sessions
      const { error: creatorResultsError } = await supabase
        .from('chat_creator_results')
        .delete()
        .in('chat_session_id', sessionIds)

      if (creatorResultsError) {
        console.error('Error deleting creator results:', creatorResultsError)
      }
    }

    // Delete all chat sessions for the user
    const { error: sessionsError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('user_id', userId)

    if (sessionsError) {
      console.error('Error deleting chat sessions:', sessionsError)
      return NextResponse.json(
        { success: false, error: 'Failed to clear chat history' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error clearing chat history:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 