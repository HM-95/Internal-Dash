import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { chatId } = await request.json()
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user from the server-side session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('No authenticated user found in delete chat API')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 })
    }
    
    console.log('Deleting chat session:', chatId, 'for user:', user.id)
    
    // Mark the chat session as inactive (soft delete)
    const { error } = await supabase
      .from('chat_sessions')
      .update({ is_active: false })
      .eq('id', chatId)
      .eq('user_id', user.id)
    
    if (error) {
      console.error('Error deleting chat session:', error)
      return NextResponse.json({ error: 'Failed to delete chat session' }, { status: 500 })
    }
    
    console.log('Chat session deleted successfully:', chatId)
    
    return NextResponse.json({ 
      success: true,
      message: 'Chat session deleted successfully'
    })
    
  } catch (error) {
    console.error('Error in delete chat API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 