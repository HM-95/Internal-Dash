'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

function FrameContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Check internal authentication status and redirect accordingly
  useEffect(() => {
    const checkInternalAuthAndRedirect = async () => {
      try {
        // Check if user is already authenticated with internal system
        const response = await fetch('/api/internal-auth');
        
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            console.log('User already authenticated, redirecting to dashboard');
            router.push('/dashboard');
            return;
          }
        }
        
        // No authentication - redirect to login
        console.log('No authentication found, redirecting to login');
        router.push('/login');
      } catch (err) {
        console.error('Unexpected error checking internal auth:', err);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkInternalAuthAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center">
      <div className="text-white">
        {isLoading ? 'Loading...' : 'Redirecting...'}
      </div>
    </div>
  );
}

export default function Frame() {
  return <FrameContent />;
}