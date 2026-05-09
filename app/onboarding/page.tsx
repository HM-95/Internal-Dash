// DISABLED - Onboarding flow disabled for internal access
// This file is preserved for potential future re-enablement

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OnboardingPageDisabled() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard since onboarding is disabled for internal access
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="h-screen bg-gradient-to-br from-[#1a1f2e] to-[#0a0d1a] flex items-center justify-center">
      <div className="text-white text-xl">Redirecting to dashboard...</div>
    </div>
  );
}
