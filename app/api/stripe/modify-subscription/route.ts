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
    console.log('🔄 Subscription modification API called at:', new Date().toISOString())
    
    const body = await request.json()
    const { planId, billingCycle, preview_only } = body
    
    console.log('📊 Request data:', { planId, billingCycle })

    if (!planId || !billingCycle) {
      console.log('❌ Missing required fields:', { planId, billingCycle })
      return NextResponse.json({ 
        error: 'Plan ID and billing cycle are required' 
      }, { status: 400 })
    }

    // Get user from Supabase
    console.log('🔍 Getting user authentication...')
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ Authentication error:', authError)
      return NextResponse.json({ 
        error: 'User not authenticated' 
      }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // Get user preferences to check for existing subscription
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

    // Define plan configurations
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

    // Check if user has an existing active subscription
    const existingSubscriptionId = userPreferences?.stripe_subscription_id
    
    console.log('🔍 Subscription check:', {
      existingSubscriptionId,
      subscription_status: userPreferences?.subscription_status,
      subscription_plan: userPreferences?.subscription_plan,
      preview_only
    })
    
    if (existingSubscriptionId) {
      console.log('🔄 User has existing subscription, modifying:', existingSubscriptionId)
      
      try {
        // Retrieve the existing subscription
        const existingSubscription = await stripe.subscriptions.retrieve(existingSubscriptionId)
        
        // Type assertion for subscription properties
        const subscription = existingSubscription as any
        
        if (existingSubscription.status === 'active' || existingSubscription.status === 'trialing') {
          console.log('✅ Existing subscription is active, proceeding with modification')
          
          // Determine current plan and pricing to check if this is an upgrade or downgrade
          const currentPlan = userPreferences?.subscription_plan
          const currentPlanConfig = currentPlan ? plans[currentPlan as keyof typeof plans]?.[billingCycle as keyof typeof plan] : null
          const currentPrice = currentPlanConfig?.price || 0
          const newPrice = planConfig.price
          
          const isUpgrade = newPrice > currentPrice
          const isDowngrade = newPrice < currentPrice
          const isTrialing = subscription.status === 'trialing'
          const isSamePrice = newPrice === currentPrice
          
          console.log('📊 Plan change analysis:', {
            currentPlan,
            newPlan: planId,
            currentPrice,
            newPrice,
            isUpgrade,
            isDowngrade,
            isSamePrice,
            isTrialing,
            trialEnd: isTrialing && subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
          })

          // If this is a preview request, return the analysis without making changes
          if (preview_only) {
            let previewMessage = ''
            let immediateCharge = 0
            
            if (isTrialing) {
              const trialEndDate = subscription.trial_end ? new Date(subscription.trial_end * 1000).toLocaleDateString() : 'end of trial'
              previewMessage = `Your plan will be updated to ${planId.charAt(0).toUpperCase() + planId.slice(1)}. You'll be charged $${newPrice}/${billingCycle === 'monthly' ? 'month' : 'year'} when your trial ends on ${trialEndDate}.`
            } else if (isUpgrade) {
              const dailyDifference = (newPrice - currentPrice) / (billingCycle === 'monthly' ? 30 : 365)
              const remainingDays = subscription.current_period_end ? Math.ceil((subscription.current_period_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24)) : 30
              immediateCharge = Math.round(dailyDifference * remainingDays * 100) / 100
              previewMessage = `You'll be charged $${immediateCharge} immediately for the remaining ${remainingDays} days of this billing cycle and get instant access to all ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan features.`
            } else if (isDowngrade) {
              const nextBillingDate = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toLocaleDateString() : 'next billing cycle'
              previewMessage = `You'll keep your current ${currentPlan?.charAt(0).toUpperCase() + currentPlan?.slice(1)} plan features until ${nextBillingDate}. Starting ${nextBillingDate}, you'll be moved to the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan and charged $${newPrice}/${billingCycle === 'monthly' ? 'month' : 'year'}.`
            } else if (isSamePrice) {
              previewMessage = `Your billing cycle will be changed to ${billingCycle}.`
            }

            return NextResponse.json({
              preview: true,
              change_type: isUpgrade ? 'upgrade' : isDowngrade ? 'downgrade' : isTrialing ? 'trial_modification' : 'modification',
              current_plan: currentPlan,
              new_plan: planId,
              current_price: currentPrice,
              new_price: newPrice,
              immediate_charge: immediateCharge,
              is_trialing: isTrialing,
              effective_immediately: isUpgrade || isTrialing || isSamePrice,
              preview_message: previewMessage,
              requires_confirmation: true
            })
          }

          // Create a new price object for the new plan
          const stripePrice = await stripe.prices.create({
            unit_amount: planConfig.price * 100,
            currency: 'usd',
            recurring: {
              interval: billingCycle === 'monthly' ? 'month' : 'year',
            },
            product_data: {
              name: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
              metadata: {
                plan_id: planId,
                billing_cycle: billingCycle,
                exports: planConfig.exports.toString(),
                imports: planConfig.imports.toString(),
              },
            },
          })

          let updatedSubscription: any = existingSubscription
          let responseMessage = ''
          let changeType = ''
          let requiresConfirmation = true

          if (isTrialing) {
            // USER IS IN TRIAL: Just update the plan, they'll be charged the new amount when trial ends
            console.log('🆓 User is in trial - updating plan for post-trial billing')
            console.log('🔍 Trial modification details:', { planId, billingCycle, newPrice, currentPrice })
            try {
              updatedSubscription = await stripe.subscriptions.update(existingSubscriptionId, {
                items: [{
                  id: existingSubscription.items.data[0].id,
                  price: stripePrice.id,
                }],
                proration_behavior: 'none', // No charges during trial
                metadata: {
                  userId: user.id,
                  planId,
                  billingCycle,
                  exports: planConfig.exports.toString(),
                  imports: planConfig.imports.toString(),
                  trial_plan_change: new Date().toISOString(),
                  change_type: 'trial_modification'
                }
              })
              console.log('✅ Stripe subscription updated successfully for trial user')
            } catch (trialUpdateError) {
              console.error('❌ Error updating trial subscription:', trialUpdateError)
              throw trialUpdateError
            }
            
            const trialEndDate = subscription.trial_end ? new Date(subscription.trial_end * 1000).toLocaleDateString() : 'end of trial'
            responseMessage = `Your plan has been updated! You'll be charged $${newPrice}/${billingCycle === 'monthly' ? 'month' : 'year'} for the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan when your trial ends on ${trialEndDate}.`
            changeType = 'trial_modification'
            
          } else if (isUpgrade) {
            // UPGRADE: Charge immediately with prorations
            console.log('⬆️ Processing upgrade - charging immediately')
            updatedSubscription = await stripe.subscriptions.update(existingSubscriptionId, {
              items: [{
                id: existingSubscription.items.data[0].id,
                price: stripePrice.id,
              }],
              proration_behavior: 'always_invoice', // Charge immediately for upgrades
              metadata: {
                userId: user.id,
                planId,
                billingCycle,
                exports: planConfig.exports.toString(),
                imports: planConfig.imports.toString(),
                upgraded_at: new Date().toISOString(),
                change_type: 'upgrade'
              }
            })
            
            const dailyDifference = (newPrice - currentPrice) / (billingCycle === 'monthly' ? 30 : 365)
            const remainingDays = subscription.current_period_end ? Math.ceil((subscription.current_period_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24)) : 30
            const proratedAmount = Math.round(dailyDifference * remainingDays * 100) / 100
            
            responseMessage = `Upgrade successful! You've been charged $${proratedAmount} for the remaining ${remainingDays} days of this billing cycle. You now have immediate access to all ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan features.`
            changeType = 'upgrade'
            
          } else if (isDowngrade) {
            // DOWNGRADE: Schedule change for next billing period (no immediate refund)
            console.log('⬇️ Processing downgrade - scheduling for next billing period')
            
            // Use schedule to change the subscription at the end of the current period
            await stripe.subscriptionSchedules.create({
              from_subscription: existingSubscriptionId,
              phases: [
                {
                  // Current phase - keep existing plan until period end
                  items: [{
                    price: existingSubscription.items.data[0].price.id,
                    quantity: 1,
                  }],
                  end_date: subscription.current_period_end || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // Default to 30 days from now
                },
                {
                  // Next phase - new plan starts at next billing cycle
                  items: [{
                    price: stripePrice.id,
                    quantity: 1,
                  }],
                }
              ],
              metadata: {
                userId: user.id,
                planId,
                billingCycle,
                change_type: 'scheduled_downgrade',
                original_plan: currentPlan
              }
            })
            
            // Don't update the subscription directly for downgrades
            updatedSubscription = existingSubscription
            
            const nextBillingDate = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toLocaleDateString() : 'next billing cycle'
            responseMessage = `Downgrade scheduled successfully! You'll continue to have access to all your current ${currentPlan?.charAt(0).toUpperCase() + currentPlan?.slice(1)} plan features until ${nextBillingDate}. Starting ${nextBillingDate}, you'll be moved to the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan and charged $${newPrice}/${billingCycle === 'monthly' ? 'month' : 'year'}.`
            changeType = 'downgrade'
            
          } else if (isSamePrice) {
            // SAME PRICE: Just update (e.g., changing billing cycle)
            console.log('🔄 Processing plan change - same price')
            updatedSubscription = await stripe.subscriptions.update(existingSubscriptionId, {
              items: [{
                id: existingSubscription.items.data[0].id,
                price: stripePrice.id,
              }],
              proration_behavior: 'create_prorations', // Standard prorations for same-price changes
              metadata: {
                userId: user.id,
                planId,
                billingCycle,
                exports: planConfig.exports.toString(),
                imports: planConfig.imports.toString(),
                modified_at: new Date().toISOString(),
                change_type: 'modification'
              }
            })
            responseMessage = `Plan updated successfully! Your billing cycle has been changed to ${billingCycle}.`
            changeType = 'modification'
          }

          console.log('✅ Subscription updated successfully:', updatedSubscription.id)

          // Update user preferences in database
          // For downgrades, we might want to track the pending change
          const updateData: any = {
            subscription_status: subscription.status === 'trialing' ? 'trialing' : 'active',
            updated_at: new Date().toISOString()
          }

          if (isUpgrade || isTrialing || isSamePrice) {
            // For upgrades, trial changes, and same-price changes, update the plan immediately
            updateData.subscription_plan = planId
          } else if (isDowngrade) {
            // For downgrades, keep current plan but track the pending change
            updateData.pending_plan_change = planId
            updateData.pending_change_date = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null
          }

          console.log('💾 Updating user preferences in database:', updateData)
          
          try {
            const { error: updateError } = await supabase
              .from('user_preferences')
              .update(updateData)
              .eq('user_id', user.id)

            if (updateError) {
              console.error('❌ Error updating user preferences:', updateError)
              // Don't fail the request since Stripe update succeeded - just log the error
              console.log('⚠️ Continuing despite database update error since Stripe operation succeeded')
            } else {
              console.log('✅ User preferences updated successfully in database')
            }
          } catch (dbError) {
            console.error('❌ Database update exception:', dbError)
            // Don't fail the request since Stripe update succeeded
            console.log('⚠️ Continuing despite database exception since Stripe operation succeeded')
          }

          return NextResponse.json({ 
            success: true,
            message: responseMessage,
            subscription_id: updatedSubscription.id,
            new_plan: planId,
            billing_cycle: billingCycle,
            change_type: changeType,
            effective_immediately: isUpgrade || isTrialing || isSamePrice,
            next_billing_date: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
            current_plan: currentPlan,
            is_trialing: isTrialing,
            requires_confirmation: requiresConfirmation,
            pricing_details: {
              current_price: currentPrice,
              new_price: newPrice,
              is_upgrade: isUpgrade,
              is_downgrade: isDowngrade,
              immediate_charge: isUpgrade && !isTrialing
            }
          })
        } else {
          console.log('⚠️ Existing subscription is not active, creating new subscription')
          // Fall through to create new subscription
        }
      } catch (stripeError) {
        console.error('❌ Error in subscription modification:', stripeError)
        
        // Only fall through to new subscription if it's a Stripe retrieval error
        // If it's an error after successful Stripe operations, return the error instead
        if (stripeError instanceof Error && stripeError.message.includes('No such subscription')) {
          console.log('⚠️ Subscription not found in Stripe, will create new subscription')
          // Fall through to create new subscription
        } else {
          console.error('❌ Subscription modification failed after Stripe operation')
          return NextResponse.json({ 
            error: 'Subscription modification failed: ' + (stripeError instanceof Error ? stripeError.message : 'Unknown error'),
            details: process.env.NODE_ENV === 'development' ? stripeError : undefined
          }, { status: 500 })
        }
      }
    }

    // If no existing subscription or existing subscription is invalid, create new one
    console.log('🆕 Creating new subscription for user')
    
    // Create or get Stripe customer
    let customerId = userPreferences?.stripe_customer_id

    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId)
        console.log('✅ Existing Stripe customer found:', customerId)
      } catch (customerError) {
        console.warn('⚠️ Stored customer ID invalid, creating new customer:', customerError)
        customerId = null
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
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          subscription_plan: userPreferences?.subscription_plan || 'free',
          subscription_status: userPreferences?.subscription_status || 'active',
          updated_at: new Date().toISOString()
        })
      console.log('✅ Updated user preferences with customer ID')
    }

    // Determine if this user should get a trial (only for truly new customers)
    const shouldGetTrial = !userPreferences?.stripe_subscription_id && 
                          userPreferences?.subscription_plan === 'free'

    // Create checkout session for new subscription
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
            unit_amount: planConfig.price * 100,
            recurring: billingCycle === 'monthly' ? { interval: 'month' } : { interval: 'year' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: shouldGetTrial ? {
        trial_period_days: 7,
        metadata: {
          userId: user.id,
          planId,
          billingCycle
        }
      } : {
        metadata: {
          userId: user.id,
          planId,
          billingCycle
        }
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment_success=true&plan=${planId}&${shouldGetTrial ? 'trial=true' : 'upgraded=true'}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
      metadata: {
        userId: user.id,
        planId,
        billingCycle,
        exports: planConfig.exports.toString(),
        imports: planConfig.imports.toString(),
        hasTrial: shouldGetTrial ? 'true' : 'false',
        isUpgrade: existingSubscriptionId ? 'true' : 'false'
      }
    })

    console.log('✅ Created checkout session:', session.id)

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url,
      isNewSubscription: true,
      hasTrial: shouldGetTrial
    })

  } catch (error) {
    console.error('❌ Subscription modification error:', error)
    
    let errorMessage = 'Failed to modify subscription'
    let errorDetails = null
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5)
      }
    }
    
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
