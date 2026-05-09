import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user from the server-side session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('No authenticated user found in clear all chats API')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    console.log('Clearing all chat sessions for user:', user.id)
    
    // Mark all chat sessions as inactive (soft delete)
    const { error } = await supabase
      .from('chat_sessions')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true)
    
    if (error) {
      console.error('Error clearing all chat sessions:', error)
      return NextResponse.json({ error: 'Failed to clear chat history' }, { status: 500 })
    }
    
    console.log('All chat sessions cleared successfully for user:', user.id)
    
    return NextResponse.json({ 
      success: true,
      message: 'All chat history cleared successfully'
    })
    
  } catch (error) {
    console.error('Error in clear all chats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 