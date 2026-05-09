'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { NewOnboardingFlow } from '../components/NewOnboardingFlow';

export default function OnboardingPage() {
  const [userHasCompletedOnboarding, setUserHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/');
          return;
        }

        let preferences: any = null;
        let prefError: any = null;
        
        try {
          // Try to get user preferences with better error handling
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (error) {
            console.error('Error fetching user preferences:', error);
            prefError = error;
          } else {
            preferences = data;
          }
        } catch (err) {
          console.error('Exception during user preferences query:', err);
          prefError = err;
        }
        
        if (prefError) {
          console.error('Error details:', {
            message: prefError.message,
            details: prefError.details,
            hint: prefError.hint,
            code: prefError.code
          });
          // If there's an error, assume onboarding is not complete
          setUserHasCompletedOnboarding(false);
        } else {
          // User has completed onboarding if they have both completed the flow AND have a paid subscription OR are in trial
          const hasCompletedOnboarding = preferences?.onboarding_completed && 
            preferences?.subscription_plan !== 'free' && 
            (preferences?.subscription_status === 'active' || preferences?.subscription_status === 'trialing');
            
          setUserHasCompletedOnboarding(hasCompletedOnboarding || false);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setUserHasCompletedOnboarding(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [supabase, router]);

  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-[#1a1f2e] to-[#0a0d1a] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return <NewOnboardingFlow userHasCompletedOnboarding={userHasCompletedOnboarding} />;
} 