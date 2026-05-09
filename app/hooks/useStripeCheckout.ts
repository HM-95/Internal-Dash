import React from 'react'
import { useUserPreferences } from './useUserPreferences'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface PlanConfig {
  id: string
  name: string
  monthlyPrice: number
  annualPrice: number
  exports: number
  imports: number
  features: string[]
  popular?: boolean
}

// Production Payment links from Stripe
const PAYMENT_LINKS = {
  starter: {
    monthly: 'https://buy.stripe.com/28E5kE4HLf5o4Ww5co1Jm05',
    annual: 'https://buy.stripe.com/9B68wQb695uO74E9sE1Jm02'
  },
  pro: {
    monthly: 'https://buy.stripe.com/7sYaEYeil6yS74EeMY1Jm04', 
    annual: 'https://buy.stripe.com/bJe14ob69g9s3Ss8oA1Jm01'
  },
  agency: {
    monthly: 'https://buy.stripe.com/bJeaEY3DH9L4bkUfR21Jm03',
    annual: 'https://buy.stripe.com/5kQbJ25LP2iC1KkawI1Jm00'
  }
}

export const plans: PlanConfig[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 149,
    annualPrice: 134,
    exports: 50,
    imports: 100,
    features: [
      'Search over 80k influencers',
      'Import & track 100 profiles',
      'Export up to 50 profiles',
      'Limited AI searches',
      'Weekly data refresh'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 199,
    annualPrice: 179,
    exports: 500,
    imports: 2000,
    features: [
      'Search over 80k influencers',
      'Import & track 2,000 profiles',
      'Export up to 500 profiles',
      'Unlimited AI Searches',
      'Weekly data refresh'
    ],
    popular: true
  },
  {
    id: 'agency',
    name: 'Agency',
    monthlyPrice: 599,
    annualPrice: 539,
    exports: 2000,
    imports: 7500,
    features: [
      'Search over 80k influencers',
      'Import & track 7,500 profiles',
      'Export up to 2,000 profiles',
      'Unlimited AI Searches',
      'Data refresh every 72 hours'
    ]
  }
]

export function useStripeCheckout() {
  const { preferences } = useUserPreferences()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const supabase = createClientComponentClient()

  const handlePlanPurchase = async (planId: string, billingCycle: 'monthly' | 'annual', skipConfirmation: boolean = false) => {
    setLoading(true)
    setError(null)

    try {
      console.log(`Processing plan change: ${planId}, billing: ${billingCycle}`)
      
      // Check if user has existing subscription to determine the right approach
      const currentPlan = getCurrentPlan()
      const hasExistingSubscription = preferences?.stripe_subscription_id && 
                                     (preferences?.subscription_status === 'active' || preferences?.subscription_status === 'trialing')
      
      console.log('Current subscription state:', {
        currentPlan,
        hasExistingSubscription,
        subscriptionId: preferences?.stripe_subscription_id,
        status: preferences?.subscription_status
      })

      // If user has existing subscription and we haven't confirmed yet, get details first
      if (hasExistingSubscription && !skipConfirmation) {
        // Get subscription change details without actually making the change
        const previewResponse = await fetch('/api/stripe/modify-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId,
            billingCycle,
            preview_only: true
          }),
        })

        if (previewResponse.ok) {
          const previewData = await previewResponse.json()
          setLoading(false)
          
          // Return preview data for confirmation dialog
          return {
            requiresConfirmation: true,
            previewData
          }
        }
      }

      // Use the new subscription modification API that handles both upgrades and new subscriptions
      const response = await fetch('/api/stripe/modify-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          billingCycle
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Subscription modification API error response:', errorData)
        
        let errorMessage = 'Failed to process subscription change'
        
        if (errorData.error) {
          errorMessage = errorData.error
        }
        
        // Log additional details if available
        if (errorData.details) {
          console.error('Error details:', errorData.details)
        }
        
        throw new Error(errorMessage)
      }

      const responseData = await response.json()
      console.log('Subscription modification response:', responseData)
      
      if (responseData.success && !responseData.url) {
        // Subscription was modified directly (no checkout needed)
        console.log('Subscription updated successfully without checkout')
        setLoading(false)
        
        // Return success data instead of reloading immediately
        return {
          success: true,
          message: responseData.message,
          changeType: responseData.change_type,
          effectiveImmediately: responseData.effective_immediately
        }
      }
      
      if (responseData.url) {
        // Need to redirect to checkout for new subscription or payment method update
        console.log('Redirecting to Stripe checkout:', responseData.url)
        window.location.href = responseData.url
        return
      }
      
      throw new Error('Unexpected response from subscription modification API')
      
    } catch (err) {
      console.error('Subscription modification error:', err)
      setError(err instanceof Error ? err.message : 'Failed to process subscription change')
      setLoading(false)
      throw err
    }
  }

  const getPlanById = (planId: string) => {
    return plans.find(plan => plan.id === planId)
  }

  const getCurrentPlan = () => {
    // Don't default to free - only return actual purchased plans
    const plan = preferences?.subscription_plan;
    if (!plan || plan === 'free') {
      return null; // User has no paid plan
    }
    return plan;
  }

  const isCurrentPlan = (planId: string) => {
    const currentPlan = getCurrentPlan();
    if (!currentPlan) return false; // No current plan if user hasn't purchased
    return currentPlan === planId && preferences?.subscription_status === 'active';
  }

  const getUpgradePlan = (currentPlanId: string) => {
    const currentIndex = plans.findIndex(plan => plan.id === currentPlanId)
    if (currentIndex < plans.length - 1) {
      return plans[currentIndex + 1]
    }
    return null
  }

  return {
    plans,
    loading,
    error,
    handlePlanPurchase,
    getPlanById,
    getCurrentPlan,
    isCurrentPlan,
    getUpgradePlan,
    clearError: () => setError(null)
  }
}
