import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { subject, message, metadata } = await request.json()

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    const referer = request.headers.get('referer') || ''
    let page_path: string | null = null
    try {
      page_path = referer ? new URL(referer).pathname : null
    } catch {
      page_path = null
    }

    const user_agent = request.headers.get('user-agent') || null

    // Resolve user from cookies/session (do not trust client-provided user_id)
    const authClient = createRouteHandlerClient({ cookies })
    const { data: userResult } = await authClient.auth.getUser()
    const resolvedUserId = userResult?.user?.id ?? null

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRoleKey) {
      console.error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const supabase = createClient(url, serviceRoleKey)

    const insertPayload: any = {
      subject,
      message,
      page_path,
      user_agent,
      metadata: metadata ?? {},
    }
    if (resolvedUserId) insertPayload.user_id = resolvedUserId

    const { data, error } = await supabase
      .from('user_feedback')
      .insert(insertPayload)
      .select()

    if (error) {
      console.error('Insert feedback error:', error)
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


