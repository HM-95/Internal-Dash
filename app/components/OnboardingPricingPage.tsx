'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, CheckCircle } from 'lucide-react';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface OnboardingPricingPageProps {
  isVisible: boolean;
  onClose?: () => void;
}

export function OnboardingPricingPage({ isVisible, onClose }: OnboardingPricingPageProps) {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [error, setError] = useState<string | null>(null);
  const userPreferences = useUserPreferences();
  
  const { plans, handlePlanPurchase, loading: stripeLoading, error: stripeError } = useStripeCheckout();

  // Handle Stripe errors
  useEffect(() => {
    if (stripeError) {
      setError(stripeError);
    }
  }, [stripeError]);

  // Check if user has completed subscription after successful payment
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (userPreferences.preferences?.subscription_plan && 
          userPreferences.preferences.subscription_plan !== 'free' &&
          userPreferences.preferences.subscription_status === 'active') {
        // User has a paid subscription, redirect to dashboard
        router.push('/dashboard');
      }
    };

    checkSubscriptionStatus();
  }, [userPreferences.preferences, router]);

  // Poll for subscription updates after payment (handles webhook delay)
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    const startPolling = () => {
      console.log('Starting subscription status polling...');
      pollInterval = setInterval(async () => {
        try {
          // Refresh user preferences to check for updates
          await userPreferences.refreshPreferences();
          
          // Check if subscription was updated
          if (userPreferences.preferences?.subscription_plan && 
              userPreferences.preferences.subscription_plan !== 'free' &&
              userPreferences.preferences.subscription_status === 'active') {
            console.log('Subscription detected, redirecting to dashboard');
            clearInterval(pollInterval);
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error polling subscription status:', error);
        }
      }, 2000); // Poll every 2 seconds
      
      // Stop polling after 30 seconds to avoid infinite polling
      setTimeout(() => {
        if (pollInterval) {
          clearInterval(pollInterval);
          console.log('Stopped polling after 30 seconds');
        }
      }, 30000);
    };

    // Start polling when component mounts
    startPolling();

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [userPreferences, router]);

  // Helper function to check if user is on current plan
  // For onboarding, users should have no current plan until they purchase
  const isCurrentPlan = (planName: string) => {
    const currentPlan = userPreferences.preferences?.subscription_plan;
    // Only show as current if user has an active subscription (not free)
    if (!currentPlan || currentPlan === 'free') {
      return false;
    }
    return currentPlan === planName && userPreferences.preferences?.subscription_status === 'active';
  };

  const handleStartFreeTrial = async (planName: 'starter' | 'pro' | 'agency') => {
    setError(null); // Clear any previous errors
    
    // Redirect to Stripe checkout which will handle the subscription creation
    // Success URL in stripe config will redirect back to dashboard
    await handlePlanPurchase(planName, billingCycle);
  };

  const handleContactUs = () => {
    window.open('mailto:hey@buzzberry.io', '_blank');
  };

  // Scroll to top when pricing page becomes visible (especially important for mobile/tablet)
  useEffect(() => {
    if (isVisible) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        // Try to scroll the main window first
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Also try to scroll any parent containers
        const parentContainer = document.querySelector('[data-onboarding-container]');
        if (parentContainer) {
          parentContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="h-full sm:min-h-screen bg-gradient-to-br from-[#1a1f2e] to-[#0a0d1a] flex flex-col justify-start items-center p-3 sm:p-4 lg:p-6 overflow-y-auto relative pb-32 sm:pb-0" style={{WebkitOverflowScrolling: 'touch', minHeight: '100dvh'}}>      
      <div className="max-w-6xl w-full flex flex-col justify-start space-y-3 sm:space-y-4 lg:space-y-5 py-4 sm:py-0 min-h-0 relative z-10">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight px-2">
            Choose Your Plan
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto px-4">
            Select your plan for full tracking and performance insights
          </p>
          

        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl max-w-2xl mx-auto">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <p className="text-red-400 text-sm">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6 w-full">
          {/* Monthly/Annual Toggle */}
          <div className="flex justify-center">
            <div className="bg-[#2a3441] rounded-xl p-1 flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  billingCycle === 'monthly'
                    ? 'bg-white/20 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  billingCycle === 'annual'
                    ? 'bg-white/20 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Annual
              </button>
            </div>
          </div>

          {/* Three Plans - Glassmorphism Design */}
          {/* Either all 3 side-by-side OR all 3 vertically stacked - no mixed layouts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0">
            {/* Starter Plan */}
            <div className={`relative w-full max-w-sm mx-auto md:max-w-none flex flex-col justify-between p-6 sm:p-6 md:p-6 lg:p-10 rounded-[2.5rem] bg-gradient-to-b from-black/50 to-[#292929]/70 shadow-[inset_0_5px_3px_-3px_rgba(255,255,255,0.41),inset_0_4px_20px_-5px_rgb(78,78,78)] backdrop-blur-[15px] hover:backdrop-blur-[20px] transition-all duration-300 min-h-[420px] sm:min-h-[500px] lg:min-h-[540px] flex-shrink-0 ${isCurrentPlan('starter') ? 'border-2 border-purple-500/60' : ''}`}>
              {/* Current Plan Badge */}
              {isCurrentPlan('starter') && (
                <div className="absolute top-4 left-6 font-mono text-purple-400 text-xs font-medium uppercase">
                  CURRENT PLAN
                </div>
              )}
              {/* Header Section */}
              <div className="flex flex-col gap-4">
                {/* Plan Name */}
                <h3 className="text-xl lg:text-2xl font-medium text-white" style={{WebkitTextStrokeWidth: '0.25px'}}>Starter</h3>
                
                <div className="flex flex-col gap-1">
                  {/* Pricing with Gradient Text */}
                  <div className="flex items-baseline gap-1">
                    <span 
                      className="text-3xl lg:text-4xl font-semibold leading-none"
                      style={{
                        background: 'linear-gradient(131deg, rgb(255, 255, 255), rgb(53, 53, 53))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        color: 'rgb(241, 239, 237)'
                      }}
                    >
                      ${billingCycle === 'monthly' ? '149' : '134'}
                    </span>
                    <span className="text-[#666666] text-sm">/month</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <div className="mt-1">
                      <p className="text-xs text-gray-300">billed annually</p>
                      <p className="text-xs text-green-300 font-medium">
                        Save $180/year
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Features Section */}
              <div className="flex flex-col gap-4 flex-1 justify-center">
                <ul className="flex flex-col gap-1.5 list-none pl-0 w-full">
                  <li className="flex items-center py-1 text-gray-300 text-sm leading-relaxed">
                    <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                    <span>Search over 80k influencers</span>
                  </li>
                  <li className="flex items-center py-1 text-gray-300 text-sm leading-relaxed">
                    <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                    <span>Import & track 100 influencers</span>
                  </li>
                  <li className="flex items-center py-1 text-gray-300 text-sm leading-relaxed">
                    <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                    <span>Export up to 50 profiles</span>
                  </li>
                  <li className="flex items-center py-1 text-gray-300 text-sm leading-relaxed">
                    <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                    <span>Limited AI searches</span>
                  </li>
                  <li className="flex items-center py-1 text-gray-300 text-sm leading-relaxed">
                    <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                    <span>Weekly data refresh</span>
                  </li>
                </ul>
              </div>

              {/* Footer Section */}
              <div className="flex flex-col gap-4">
                {/* 7-day free trial with dividers */}
                <div className="flex flex-row justify-center items-center gap-3 w-full">
                  <div className="flex-1 h-px bg-gray-600"></div>
                  <span className="text-gray-400 text-xs">7-day free trial</span>
                  <div className="flex-1 h-px bg-gray-600"></div>
                </div>

                {/* Button with Webflow styling */}
                <button
                  onClick={() => handleStartFreeTrial('starter')}
                  disabled={stripeLoading || isCurrentPlan('starter')}
                  className="relative rounded-[1.125rem] text-white text-base font-medium text-center transition-none shadow-[0_16px_20px_0_rgba(0,0,0,0.4)] active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="relative overflow-hidden py-4 px-6 border border-[#707070] rounded-[1.125rem] bg-transparent shadow-[inset_0_0_7px_0_rgba(255,255,255,0.28)] group-hover:shadow-[inset_0_0_10px_0_rgba(147,51,234,0.3)] group-hover:border-purple-400/60 transition-all duration-200">
                    {stripeLoading ? 'Processing...' : isCurrentPlan('starter') ? 'Current Plan' : 'Start Free Trial'}
                  </div>
                </button>
              </div>
            </div>

            {/* Pro Plan - Most Popular */}
            <div className={`relative w-full max-w-sm mx-auto md:max-w-none flex flex-col justify-between p-6 sm:p-6 md:p-6 lg:p-10 rounded-[2.5rem] bg-gradient-to-b from-black/50 to-[#292929]/70 shadow-[inset_0_5px_3px_-3px_rgba(255,255,255,0.41),inset_0_4px_20px_-5px_rgb(78,78,78)] backdrop-blur-[15px] hover:backdrop-blur-[20px] transition-all duration-300 border border-purple-500/40 min-h-[420px] sm:min-h-[500px] lg:min-h-[540px] flex-shrink-0 ${isCurrentPlan('pro') ? 'border-2 border-purple-500/60' : ''}`}>
              {/* Most Popular Badge - Top Right */}
              <div className="absolute top-4 right-6 font-mono text-[#b6b6b6] text-xs font-medium uppercase">
                MOST POPULAR
              </div>
              {/* Current Plan Badge - Top Left */}
              {isCurrentPlan('pro') && (
                <div className="absolute top-4 left-6 font-mono text-purple-400 text-xs font-medium uppercase">
                  CURRENT PLAN
                </div>
              )}
              
              {/* Header Section */}
              <div className="flex flex-col gap-4 pt-2">
                {/* Plan Name */}
                <h3 className="text-xl lg:text-2xl font-medium text-white" style={{WebkitTextStrokeWidth: '0.25px'}}>Pro</h3>
                
                <div className="flex flex-col gap-1">
                  {/* Pricing with Gradient Text */}
                  <div className="flex items-baseline gap-1">
                    <span 
                      className="text-3xl lg:text-4xl font-semibold leading-none"
                      style={{
                        background: 'linear-gradient(131deg, rgb(255, 255, 255), rgb(53, 53, 53))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        color: 'rgb(241, 239, 237)'
                      }}
                    >
                      ${billingCycle === 'monthly' ? '199' : '179'}
                    </span>
                    <span className="text-[#666666] text-sm">/month</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <div className="mt-1">
                      <p className="text-xs text-gray-300">billed annually</p>
                      <p className="text-xs text-green-300 font-medium">
                        Save $240/year
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Features Section */}
              <div className="flex flex-col gap-4 flex-1 justify-center">
                <ul className="flex flex-col gap-1.5 list-none pl-0 w-full">
                  <li className="flex items-center py-1 text-gray-300 text-sm leading-relaxed">
                    <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                    <span>Search over 80k influencers</span>
                  </li>
                  <li className="flex items-center py-1 text-gray-300 text-sm leading-relaxed">
                    <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                    <span>Import & track 2,000 influencers</span>
                  </li>
                  <li className="flex items-center py-1 text-gray-300 text-sm leading-relaxed">
                    <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                    <span>Export up to 500 profiles</span>
                  </li>
                  <li className="flex items-center py-1 text-gray-300 text-sm leading-relaxed">
                    <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                    <span>Unlimited AI Searches</span>
                  </li>
                  <li className="flex items-center py-1 text-gray-300 text-sm leading-relaxed">
                    <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                    <span>Weekly data refresh</span>
                  </li>
                </ul>
              </div>

              {/* Footer Section */}
              <div className="flex flex-col gap-4">
                {/* 7-day free trial with dividers */}
                <div className="flex flex-row justify-center items-center gap-3 w-full">
                  <div className="flex-1 h-px bg-gray-600"></div>
                  <span className="text-gray-400 text-xs">7-day free trial</span>
                  <div className="flex-1 h-px bg-gray-600"></div>
                </div>

                {/* Button with Webflow styling */}
                <button
                  onClick={() => handleStartFreeTrial('pro')}
                  disabled={stripeLoading || isCurrentPlan('pro')}
                  className="relative rounded-[1.125rem] text-white text-base font-medium text-center transition-none shadow-[0_16px_20px_0_rgba(0,0,0,0.4)] active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="relative overflow-hidden py-4 px-6 border border-[#707070] rounded-[1.125rem] bg-transparent shadow-[inset_0_0_7px_0_rgba(255,255,255,0.28)] group-hover:shadow-[inset_0_0_10px_0_rgba(147,51,234,0.3)] group-hover:border-purple-400/60 transition-all duration-200">
                    {stripeLoading ? 'Processing...' : isCurrentPlan('pro') ? 'Current Plan' : 'Start Free Trial'}
                  </div>
                </button>
              </div>
            </div>

            {/* Agency Plan */}
            <div className={`relative w-full max-w-sm mx-auto md:max-w-none flex flex-col justify-between p-6 sm:p-6 md:p-6 lg:p-10 rounded-[2.5rem] bg-gradient-to-b from-black/50 to-[#292929]/70 shadow-[inset_0_5px_3px_-3px_rgba(255,255,255,0.41),inset_0_4px_20px_-5px_rgb(78,78,78)] backdrop-blur-[15px] hover:backdrop-blur-[20px] transition-all duration-300 min-h-[420px] sm:min-h-[500px] lg:min-h-[540px] flex-shrink-0 ${isCurrentPlan('agency') ? 'border-2 border-purple-500/60' : ''}`}>
              {/* Current Plan Badge */}
              {isCurrentPlan('agency') && (
                <div className="absolute top-4 left-6 font-mono text-purple-400 text-xs font-medium uppercase">
                  CURRENT PLAN
                </div>
              )}
              {/* Header Section */}
              <div className="flex flex-col gap-4">
                {/* Plan Name */}
                <h3 className="text-xl lg:text-2xl font-medium text-white" style={{WebkitTextStrokeWidth: '0.25px'}}>Agency</h3>
                
                <div className="flex flex-col gap-1">
                  {/* Pricing with Gradient Text */}
                  <div className="flex items-baseline gap-1">
                    <span 
                      className="text-3xl lg:text-4xl font-semibold leading-none"
                      style={{
                        background: 'linear-gradient(131deg, rgb(255, 255, 255), rgb(53, 53, 53))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        color: 'rgb(241, 239, 237)'
                      }}
                    >
                      ${billingCycle === 'monthly' ? '599' : '539'}
                    </span>
                    <span className="text-[#666666] text-sm">/month</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <div className="mt-1">
                      <p className="text-xs text-gray-300">billed annually</p>
                      <p className="text-xs text-green-300 font-medium">
                        Save $720/year
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Features Section */}
              <div className="flex flex-col gap-4 flex-1 justify-center">
                <ul className="flex flex-col gap-1.5 list-none pl-0 w-full">
                  <li className="flex items-center py-1 text-gray-300 text-sm leading-relaxed">
                    <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                    <span>Search over 80k influencers</span>
                  </li>
                  <li className="flex items-center py-1 text-gray-300 text-sm leading-relaxed">
                    <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                    <span>Import & track 7,500 influencers</span>
                  </li>
                  <li className="flex items-center py-1 text-gray-300 text-sm leading-relaxed">
                    <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                    <span>Export up to 2,000 profiles</span>
                  </li>
                  <li className="flex items-center py-1 text-gray-300 text-sm leading-relaxed">
                    <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                    <span>Unlimited AI Searches</span>
                  </li>
                  <li className="flex items-center py-1 text-gray-300 text-sm leading-relaxed">
                    <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                    <span>Data refresh every 72 hours</span>
                  </li>
                </ul>
              </div>

              {/* Footer Section */}
              <div className="flex flex-col gap-4">
                {/* 7-day free trial with dividers */}
                <div className="flex flex-row justify-center items-center gap-3 w-full">
                  <div className="flex-1 h-px bg-gray-600"></div>
                  <span className="text-gray-400 text-xs">7-day free trial</span>
                  <div className="flex-1 h-px bg-gray-600"></div>
                </div>

                {/* Button with Webflow styling */}
                <button
                  onClick={() => handleStartFreeTrial('agency')}
                  disabled={stripeLoading || isCurrentPlan('agency')}
                  className="relative rounded-[1.125rem] text-white text-base font-medium text-center transition-none shadow-[0_16px_20px_0_rgba(0,0,0,0.4)] active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="relative overflow-hidden py-4 px-6 border border-[#707070] rounded-[1.125rem] bg-transparent shadow-[inset_0_0_7px_0_rgba(255,255,255,0.28)] group-hover:shadow-[inset_0_0_10px_0_rgba(147,51,234,0.3)] group-hover:border-purple-400/60 transition-all duration-200">
                    {stripeLoading ? 'Processing...' : isCurrentPlan('agency') ? 'Current Plan' : 'Start Free Trial'}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Enterprise Plan - Simple Text */}
          <div className="text-center mt-4 sm:mt-8 mb-8 sm:mb-0">
            <p className="text-[#a9a9a9] font-medium text-base lg:text-lg">
              For added tracking & higher usage limits contact us for the <span className="text-white underline cursor-pointer hover:text-gray-200 transition-colors" onClick={handleContactUs}>Enterprise Plan</span>
            </p>
          </div>

          {/* Mobile Bottom Spacer - Ensures content is visible above browser navigation */}
          <div className="h-20 sm:h-0 flex-shrink-0"></div>

        </div>
      </div>
    </div>
  );
}
