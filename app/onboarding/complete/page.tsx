'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CheckCircle, Loader2 } from 'lucide-react';

// Component that uses useSearchParams - needs to be wrapped in Suspense
function OnboardingCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeOnboarding = async () => {
      try {
        const success = searchParams.get('success');
        const plan = searchParams.get('plan');
        
        if (success !== 'true') {
          setError('Payment was not successful');
          setStatus('error');
          return;
        }

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setError('User not authenticated');
          setStatus('error');
          return;
        }

        // Mark onboarding as completed
        const { error: updateError } = await supabase
          .from('user_preferences')
          .update({
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error completing onboarding:', updateError);
          setError('Failed to complete onboarding setup');
          setStatus('error');
          return;
        }

        // 🎯 Generate AI matches now that onboarding is complete
        try {
          console.log('🔄 Generating AI matches after onboarding completion...');
          
          const aiMatchResponse = await fetch('/api/ai-matches', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (aiMatchResponse.ok) {
            const matchData = await aiMatchResponse.json();
            console.log('✅ AI matches generated:', matchData.matches_generated);
          } else {
            console.error('❌ Failed to generate AI matches:', await aiMatchResponse.text());
          }
        } catch (matchError) {
          console.error('❌ Error generating AI matches:', matchError);
          // Don't fail the entire onboarding for AI match errors
        }

        setStatus('success');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);

      } catch (error) {
        console.error('Error in onboarding completion:', error);
        setError('An unexpected error occurred');
        setStatus('error');
      }
    };

    completeOnboarding();
  }, [searchParams, router, supabase]);

  const handleRetry = () => {
    router.push('/onboarding');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#1a1f2e] to-[#0a0d1a] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-[#1a1f2e] rounded-2xl p-8 border border-[#374151] shadow-xl text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Completing Your Setup...
              </h1>
              <p className="text-gray-300 mb-6">
                We're finalizing your Haven Influence account and setting up your subscription.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Welcome to Haven Influence! 🎉
              </h1>
              <p className="text-gray-300 mb-6">
                Your subscription is active and your account is ready. Redirecting you to the dashboard...
              </p>
              <div className="flex justify-center">
                <button
                  onClick={handleGoToDashboard}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all duration-200 font-semibold"
                >
                  Go to Dashboard
                </button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Setup Error
              </h1>
              <p className="text-gray-300 mb-6">
                {error || 'There was an issue completing your setup. Please try again.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all duration-200 font-semibold"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.open('mailto:hey@haveninfluence.io', '_blank')}
                  className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700 transition-all duration-200 font-semibold"
                >
                  Contact Support
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="h-screen bg-gradient-to-br from-[#1a1f2e] to-[#0a0d1a] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-[#1a1f2e] rounded-2xl p-8 border border-[#374151] shadow-xl text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-blue-500/20 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Loading...
          </h1>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function OnboardingCompletePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OnboardingCompleteContent />
    </Suspense>
  );
}
