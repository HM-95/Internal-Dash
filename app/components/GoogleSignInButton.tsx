'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface GoogleSignInButtonProps {
  buttonText?: string;
}

export function GoogleSignInButton({ buttonText = "Sign In With Google" }: GoogleSignInButtonProps) {
  const supabase = createClientComponentClient();

  const handleClick = async () => {
    console.log('=== GOOGLE BUTTON CLICKED ===');
    console.log('Using official Supabase OAuth method');
    
    try {
      // Use the official Supabase OAuth method
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      console.log('OAuth response:', { data, error });

      if (error) {
        console.error('OAuth error:', error);
        alert('OAuth error: ' + error.message);
        return;
      }

      if (data?.url) {
        console.log('Redirecting to:', data.url);
        window.location.href = data.url;
      } else {
        console.error('No OAuth URL received');
        alert('No OAuth URL received');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('Unexpected error: ' + error);
    }
  };

  console.log('GoogleSignInButton rendered');

  return (
    <button
      type="button"
      className="w-full h-11 flex items-center justify-center gap-3 px-4 py-2 rounded-xl border border-gray-600 hover:bg-gray-600 transition-all duration-200 hover:scale-[1.02] mb-4 bg-gray-700 text-white cursor-pointer"
      onClick={handleClick}
    >
      <img className="w-6 h-6 object-contain" alt="Google icon" src="/Google Icon 2.png" />
      <span className="font-medium text-gray-200 text-base">{buttonText}</span>
    </button>
  );
} 