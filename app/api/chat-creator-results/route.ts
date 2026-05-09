import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client inside the handler
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { sessionId, promptHash, prompt, creatorsData, totalCount } = await request.json()

    if (!sessionId || !promptHash || !prompt || !creatorsData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert creator results into database
    const { data, error } = await supabase
      .from('chat_creator_results')
      .insert({
        chat_session_id: sessionId,
        prompt_hash: promptHash,
        prompt,
        creators_data: creatorsData,
        total_count: totalCount
      })
      .select()

    if (error) {
      console.error('Error saving creator results:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to save creator results' },
        { status: 500 }
      )
    }

    // Also write a marker message so past conversations can render creator lists inline
    const { error: msgError } = await supabase
      .from('chat_messages')
      .insert({
        chat_session_id: sessionId,
        role: 'assistant',
        content: `CREATOR_RESULTS:${promptHash}`
      })

    if (msgError) {
      console.error('Error inserting creator marker message:', msgError)
      // Do not fail the whole request; the client will still have saved results
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Error in chat-creator-results POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client inside the handler
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Get creator results for the session
    const { data, error } = await supabase
      .from('chat_creator_results')
      .select('*')
      .eq('chat_session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching creator results:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch creator results' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Error in chat-creator-results GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 