import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateAIMatchesForUser } from '../../../lib/generateAIMatches'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const session = event.data.object as Stripe.Checkout.Session

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(session)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.updated':
        // Handle trial ended through subscription updates
        const subscription = event.data.object as Stripe.Subscription
        if (subscription.status === 'active' && subscription.trial_end && subscription.trial_end < Date.now() / 1000) {
          await handleTrialEnded(subscription)
        }
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, planId, billingCycle, exports, imports, hasTrial } = session.metadata!

  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Check if this is a trial subscription
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    const isTrial = subscription.status === 'trialing' || hasTrial === 'true'
    
    // Update user plan in Supabase
    const { error } = await supabase
      .from('user_preferences')
      .update({
        subscription_plan: planId,
        subscription_status: isTrial ? 'trialing' : 'active',
        stripe_subscription_id: session.subscription as string,
        trial_start_date: isTrial ? new Date().toISOString() : null,
        trial_end_date: isTrial ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null, // 7 days from now
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error(`Error updating user ${userId} subscription:`, error)
    } else {
      console.log(`User ${userId} started ${isTrial ? 'trial' : 'subscription'} for ${planId} plan and completed onboarding`)
      
      // 🎯 Generate AI matches now that onboarding is complete
      try {
        console.log(`🔄 Generating AI matches for user ${userId}...`)
        await generateAIMatchesForUser(userId, supabase);
      } catch (matchError) {
        console.error(`❌ Error generating AI matches for user ${userId}:`, matchError);
      }
    }
  } catch (error) {
    console.error(`Exception updating user ${userId} subscription:`, error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { userId, planId } = subscription.metadata

  const supabase = createRouteHandlerClient({ cookies })

  try {
    console.log(`Processing subscription update for user ${userId}, plan ${planId}, status ${subscription.status}`)

    // Handle different subscription statuses
    if (subscription.status === 'active') {
      // Subscription is active - update user plan
      const { error } = await supabase
        .from('user_preferences')
        .update({
          subscription_plan: planId,
          subscription_status: 'active',
          stripe_subscription_id: subscription.id,
          trial_start_date: null, // Clear trial dates when becoming active
          trial_end_date: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error(`Error updating user ${userId} subscription to active:`, error)
      } else {
        console.log(`User ${userId} subscription updated to active ${planId} plan`)
      }
    } else if (subscription.status === 'trialing') {
      // Subscription is in trial - update accordingly
      const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
      
      const { error } = await supabase
        .from('user_preferences')
        .update({
          subscription_plan: planId,
          subscription_status: 'trialing',
          stripe_subscription_id: subscription.id,
          trial_start_date: new Date().toISOString(),
          trial_end_date: trialEnd?.toISOString() || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error(`Error updating user ${userId} subscription to trialing:`, error)
      } else {
        console.log(`User ${userId} subscription updated to trialing ${planId} plan`)
      }
    } else if (subscription.status === 'past_due') {
      // Subscription is past due - update status but keep plan
      const { error } = await supabase
        .from('user_preferences')
        .update({
          subscription_status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error(`Error updating user ${userId} subscription to past_due:`, error)
      } else {
        console.log(`User ${userId} subscription marked as past_due`)
      }
    } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
      // Subscription is canceled - downgrade to free
      const { error } = await supabase
        .from('user_preferences')
        .update({
          subscription_plan: 'free',
          subscription_status: 'cancelled',
          stripe_subscription_id: null,
          trial_start_date: null,
          trial_end_date: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error(`Error downgrading user ${userId} subscription:`, error)
      } else {
        console.log(`User ${userId} subscription canceled, downgraded to free plan`)
      }
    }
  } catch (error) {
    console.error(`Exception handling subscription update for user ${userId}:`, error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { userId } = subscription.metadata

  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Downgrade user to free plan (unpaid)
    const { error } = await supabase
      .from('user_preferences')
      .update({
        subscription_plan: 'free',
        subscription_status: 'cancelled',
        stripe_subscription_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error(`Error downgrading user ${userId} subscription:`, error)
    } else {
      console.log(`User ${userId} subscription cancelled, downgraded to free plan`)
    }
  } catch (error) {
    console.error(`Exception downgrading user ${userId} subscription:`, error)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // For invoice.payment_succeeded events, we need to get the subscription from the invoice
  // The subscription ID is available in the invoice object
  const subscriptionId = (invoice as any).subscription

  if (!subscriptionId) {
    console.log('No subscription found in invoice')
    return
  }

  try {
    // Fetch the subscription to get metadata
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const { userId } = subscription.metadata

    const supabase = createRouteHandlerClient({ cookies })

    // Reset usage counters for new billing period
    await supabase
      .from('user_preferences')
      .update({
        monthly_creator_searches: 0,
        monthly_ai_chats: 0,
        monthly_lists_created: 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    console.log(`Payment succeeded for user ${userId}, reset usage counters`)
  } catch (error) {
    console.error('Error processing payment succeeded webhook:', error)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // For invoice.payment_failed events, we need to get the subscription from the invoice
  const subscriptionId = (invoice as any).subscription

  if (!subscriptionId) {
    console.log('No subscription found in invoice')
    return
  }

  try {
    // Fetch the subscription to get metadata
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const { userId } = subscription.metadata

    console.log(`Payment failed for user ${userId}`)
    // You might want to send an email notification here
  } catch (error) {
    console.error('Error processing payment failed webhook:', error)
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const { userId } = subscription.metadata

  const supabase = createRouteHandlerClient({ cookies })

  try {
    console.log(`Trial will end soon for user ${userId}`)
    // You might want to send an email notification here about trial ending
    // For now, we'll just log it
  } catch (error) {
    console.error('Error processing trial will end webhook:', error)
  }
}

async function handleTrialEnded(subscription: Stripe.Subscription) {
  const { userId } = subscription.metadata

  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Check if the subscription is still active after trial
    if (subscription.status === 'active') {
      // Trial ended but payment succeeded - update to active subscription
      await supabase
        .from('user_preferences')
        .update({
          subscription_status: 'active',
          trial_start_date: null,
          trial_end_date: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
      
      console.log(`User ${userId} trial ended, subscription now active`)
    } else {
      // Trial ended and no payment - downgrade to free
      await supabase
        .from('user_preferences')
        .update({
          subscription_plan: 'free',
          subscription_status: 'cancelled',
          stripe_subscription_id: null,
          trial_start_date: null,
          trial_end_date: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
      
      console.log(`User ${userId} trial ended, downgraded to free plan`)
    }
  } catch (error) {
    console.error('Error processing trial ended webhook:', error)
  }
}
