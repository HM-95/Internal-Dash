import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Get user from Supabase
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ 
        error: 'User not authenticated' 
      }, { status: 401 })
    }

    // Get user preferences to find Stripe customer ID
    const { data: userPreferences, error: prefsError } = await supabase
      .from('user_preferences')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (prefsError || !userPreferences?.stripe_customer_id) {
      return NextResponse.json({ 
        error: 'No Stripe customer found for this user' 
      }, { status: 404 })
    }

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: userPreferences.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    })

    return NextResponse.json({ 
      url: session.url 
    })
  } catch (error) {
    console.error('Stripe customer portal error:', error)
    return NextResponse.json({ 
      error: 'Failed to create customer portal session' 
    }, { status: 500 })
  }
}
