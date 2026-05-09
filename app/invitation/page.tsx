// DISABLED - Invitation system disabled for internal access
// This file is preserved for potential future re-enablement

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function InvitationPageDisabled() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login since invitation system is disabled for internal access
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">Redirecting to login...</div>
    </div>
  );
}
