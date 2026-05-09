'use client';

import { login } from './actions';
import { VideoBackground } from "../components/VideoBackground";
import { MobileVideoBackground } from "../components/MobileVideoBackground";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Separator } from "../components/ui/separator";
// import { GoogleSignInButton } from '../components/GoogleSignInButton'; // DISABLED - Internal access only
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [errorDescription, setErrorDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClientComponentClient();

  // Check for internal authentication status on page load
  useEffect(() => {
    const checkInternalAuth = async () => {
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
      } catch (err) {
        console.error('Error checking internal auth:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkInternalAuth();
  }, [router]);

  // Handle internal login
  const handleInternalLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      const response = await fetch('/api/internal-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('Login response status:', response.status);
      console.log('Login response ok:', response.ok);
      
      const data = await response.json();
      console.log('Login response data:', data);

      if (response.ok && data.success) {
        console.log('Login successful, redirecting to dashboard');
        // Add a small delay to ensure cookie is set
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh(); // Force refresh to ensure cookie is recognized
        }, 100);
      } else {
        console.log('Login failed:', data.error);
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check for error parameter in URL
  useEffect(() => {
    const urlError = searchParams.get('error');
    const urlErrorDescription = searchParams.get('description');
    if (urlError) {
      setError(decodeURIComponent(urlError));
      }
    if (urlErrorDescription) {
      setErrorDescription(decodeURIComponent(urlErrorDescription));
      }
  }, [searchParams]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-900">
      {/* Mobile Layout - Video Background with Content Overlay */}
      <div className="lg:hidden h-screen w-full relative overflow-hidden bg-black">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full">
          <MobileVideoBackground />
        </div>
        {/* Content Overlay */}
        <div className="absolute inset-0 h-full flex flex-col justify-center items-center p-6" style={{ zIndex: 10 }}>
          {/* Content Box */}
          <div className="bg-black/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-gray-700/50 w-full max-w-sm">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-0.5">
                <div className="w-8 h-8 rounded-lg bg-cover bg-center bg-no-repeat shadow-sm flex-shrink-0" style={{ backgroundImage: `url(/haven-influence-icon.svg)` }} />
                <img className="w-[140px] h-7 object-contain" alt="Haven Influence Logo" src="/haven-influence-vertical-logo.svg" />
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm text-center">
                  {errorDescription || error}
                </p>
              </div>
            )}

            {/* Main Content */}
            <div className="text-center space-y-3 mb-6">
              <h1 className="text-2xl font-bold text-white leading-tight">Welcome Back</h1>
              <p className="text-gray-300 text-sm leading-relaxed">Sign in to your account</p>
            </div>
            {/* Internal Access Notice */}
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm text-center">
                Internal Access Only
              </p>
            </div>
            {/* Form Fields */}
            <form onSubmit={handleInternalLogin} className="space-y-3 mb-4">
              {/* Username field */}
              <div className="space-y-1">
                <label className="font-medium text-gray-200 text-xs block">Username</label>
                <Input name="username" type="text" placeholder="enter your username" className="h-[42px] px-3 py-2 bg-gray-700 rounded-xl border border-gray-600 font-medium text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 focus:bg-gray-600 transition-all shadow-sm text-white placeholder-gray-400" required />
              </div>
              {/* Password field */}
              <div className="space-y-1">
                <label className="font-medium text-gray-200 text-xs block">Password</label>
                <div className="relative">
                  <Input name="password" type="password" placeholder="enter your password" className="h-[42px] px-3 py-2 pr-10 bg-gray-700 rounded-xl border border-gray-600 font-medium text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 focus:bg-gray-600 transition-all shadow-sm text-white placeholder-gray-400" required />
              </div>
            </div>
            {/* Continue button */}
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-12 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium text-white text-base transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl mb-3 border border-gray-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
            {/* Terms text */}
            <p className="font-medium text-gray-400 text-xs text-center leading-relaxed">By signing in, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>
      </div>
      {/* Desktop Layout - Side by Side */}
      <div className="hidden lg:block h-screen w-full">
        <div className="h-screen w-full flex">
          {/* Login section - takes up remaining space */}
          <div className="flex-1 h-full flex items-center justify-center p-8 bg-black">
            <div className="w-full max-w-md">
              <Card className="w-full bg-black border-none shadow-none">
                <CardContent className="p-0 space-y-8">
                  {/* Logo and headline section */}
                  <div className="text-center space-y-4">
                    {/* Logo - much tighter spacing */}
                    <div className="inline-flex items-center gap-0.5">
                      <div className="w-10 h-10 rounded-lg bg-cover bg-center bg-no-repeat shadow-sm flex-shrink-0" style={{ backgroundImage: `url(/haven-influence-icon.svg)` }} />
                      <img className="w-[160px] h-8 object-contain" alt="Haven Influence Logo" src="/haven-influence-vertical-logo.svg" />
                    </div>
                    {/* Headline */}
                    <div className="space-y-1">
                      <h1 className="font-bold text-white text-3xl xl:text-4xl text-center tracking-tight leading-tight">Welcome Back</h1>
                    </div>
                    {/* Tagline */}
                    <p className="text-gray-300 text-base text-center leading-relaxed">Sign in to your account</p>
                  </div>
                  
                  {/* Error Message */}
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400 text-sm text-center">
                        {errorDescription || error}
                      </p>
                    </div>
                  )}

                  {/* Internal Access Notice */}
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-blue-400 text-sm text-center">
                      Internal Access Only
                    </p>
                  </div>
                    {/* Username field */}
                  <form onSubmit={handleInternalLogin} className="space-y-6">
                    <div className="space-y-2">
                      <label className="font-medium text-gray-200 text-xs block">Username</label>
                      <Input name="username" type="text" placeholder="enter your username" className="h-[50px] px-4 py-3 bg-gray-700 rounded-xl border border-gray-600 font-medium text-base focus:ring-2 focus:ring-gray-500 focus:border-gray-500 focus:bg-gray-600 transition-all shadow-sm text-white placeholder-gray-400" required />
                    </div>
                    {/* Password field */}
                    <div className="space-y-2">
                      <label className="font-medium text-gray-200 text-xs block">Password</label>
                      <div className="relative">
                        <Input name="password" type="password" placeholder="enter your password" className="h-[50px] px-4 py-3 pr-12 bg-gray-700 rounded-xl border border-gray-600 font-medium text-base focus:ring-2 focus:ring-gray-500 focus:border-gray-500 focus:bg-gray-600 transition-all shadow-sm text-white placeholder-gray-400" required />
                      </div>
                    </div>
                    {/* Continue button */}
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full h-[50px] bg-gray-700 hover:bg-gray-600 rounded-xl font-medium text-white text-base transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl border border-gray-600 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                    {/* Terms text */}
                  <p className="font-medium text-gray-400 text-sm text-center leading-relaxed">By signing in, you agree to our Terms of Service and Privacy Policy</p>
                </CardContent>
              </Card>
            </div>
          </div>
          {/* Video panel - takes up more space on larger screens */}
          <div className="flex-[1.2] h-full bg-gradient-to-br from-purple-400 to-indigo-500 relative overflow-hidden">
            <div className="absolute inset-0 w-full h-full">
              <VideoBackground />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
