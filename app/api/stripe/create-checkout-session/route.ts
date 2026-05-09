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
    console.log('🔍 Checkout session API called at:', new Date().toISOString())
    
    const body = await request.json()
    const { planId, billingCycle } = body
    
    console.log('📊 Request data:', { planId, billingCycle })

    if (!planId || !billingCycle) {
      console.log('❌ Missing required fields:', { planId, billingCycle })
      return NextResponse.json({ 
        error: 'Plan ID and billing cycle are required' 
      }, { status: 400 })
    }

    // Check environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY environment variable is missing')
      return NextResponse.json({ 
        error: 'Stripe configuration error' 
      }, { status: 500 })
    }
    
    console.log('✅ Stripe configuration check passed')

    // Get user from Supabase
    console.log('🔍 Getting user authentication...')
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('❌ Authentication error:', authError)
      return NextResponse.json({ 
        error: `Authentication error: ${authError.message}` 
      }, { status: 401 })
    }

    if (!user) {
      console.log('❌ No user found in session')
      return NextResponse.json({ 
        error: 'User not authenticated - no user in session' 
      }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // Get user preferences
    const { data: userPreferences, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (prefsError && prefsError.code !== 'PGRST116') {
      return NextResponse.json({ 
        error: 'Failed to get user preferences' 
      }, { status: 500 })
    }

    // Define plan configurations based on our pricing structure
    const plans = {
      starter: {
        monthly: { price: 149, exports: 50, imports: 100 },
        annual: { price: 134, exports: 50, imports: 100 }
      },
      pro: {
        monthly: { price: 199, exports: 500, imports: 2000 },
        annual: { price: 179, exports: 500, imports: 2000 }
      },
      agency: {
        monthly: { price: 599, exports: 2000, imports: 7500 },
        annual: { price: 539, exports: 2000, imports: 7500 }
      }
    }

    const plan = plans[planId as keyof typeof plans]
    if (!plan) {
      return NextResponse.json({ 
        error: 'Invalid plan ID' 
      }, { status: 400 })
    }

    const planConfig = plan[billingCycle as keyof typeof plan]
    if (!planConfig) {
      return NextResponse.json({ 
        error: 'Invalid billing cycle' 
      }, { status: 400 })
    }

    // Create or get Stripe customer
    let customerId = userPreferences?.stripe_customer_id

    if (customerId) {
      // Verify the customer exists in Stripe
      try {
        await stripe.customers.retrieve(customerId)
        console.log('✅ Existing Stripe customer found:', customerId)
      } catch (customerError) {
        console.warn('⚠️ Stored customer ID invalid, creating new customer:', customerError)
        customerId = null // Force creation of new customer
      }
    }

    if (!customerId) {
      console.log('🔄 Creating new Stripe customer...')
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id
        }
      })
      customerId = customer.id
      console.log('✅ Created new Stripe customer:', customerId)

      // Update user preferences with new Stripe customer ID
      if (userPreferences) {
        await supabase
          .from('user_preferences')
          .update({ 
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
        console.log('✅ Updated user preferences with new customer ID')
      } else {
        // Create user preferences if they don't exist - keep as free until payment succeeds
        await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            stripe_customer_id: customerId,
            subscription_plan: 'free',
            subscription_status: 'free',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        console.log('✅ Created user preferences with new customer ID')
      }
    }

    // Create checkout session (customer already has email, so no need for customer_email)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
              description: `${planConfig.exports} exports, ${planConfig.imports} imports per month`,
            },
            unit_amount: planConfig.price * 100, // Convert to cents
            recurring: billingCycle === 'monthly' ? { interval: 'month' } : { interval: 'year' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      // 7-day free trial for new users from onboarding
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          userId: user.id,
          planId,
          billingCycle
        }
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment_success=true&plan=${planId}&trial=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?canceled=true`,
      metadata: {
        userId: user.id,
        planId,
        billingCycle,
        exports: planConfig.exports.toString(),
        imports: planConfig.imports.toString(),
        hasTrial: 'true'
      }
    })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    
    // Provide more detailed error information
    let errorMessage = 'Failed to create checkout session'
    let errorDetails = null
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5) // First 5 lines of stack trace
      }
    }
    
    // Log detailed error for debugging
    console.error('Detailed error info:', {
      errorMessage,
      errorDetails,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    }, { status: 500 })
  }
}
