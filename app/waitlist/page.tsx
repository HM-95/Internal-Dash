'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { VideoBackground } from "../components/VideoBackground";
import { MobileVideoBackground } from "../components/MobileVideoBackground";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { supabase } from '../lib/supabaseClient';

export default function Waitlist(): React.ReactElement | null {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    companyName: '',
    websiteUrl: '',
    position: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Basic validation
    if (!formData.email || !formData.companyName || !formData.websiteUrl || !formData.position) {
      setError('Please fill in all fields.');
      return;
    }
    // Submit to Supabase
    const { error: supabaseError } = await supabase.from('waitlist').insert([
      {
        email: formData.email,
        company_name: formData.companyName,
        website_url: formData.websiteUrl,
        position: formData.position,
      },
    ]);
    if (supabaseError) {
      if (supabaseError.code === '23505') {
        setError('This email is already on the waitlist.');
      } else {
        setError('Failed to join waitlist. Please try again.');
      }
      return;
    }
    // Send confirmation email via Resend
    await fetch('/api/send-waitlist-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        companyName: formData.companyName,
      }),
    });
    setIsSubmitted(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBackToLogin = () => {
    router.push('/');
  };

  if (isSubmitted) {
    router.push('/waitlist-success');
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-white">
      {/* Mobile Layout - Video Background with Content Overlay */}
      <div className="lg:hidden h-screen w-full relative overflow-hidden bg-black">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full">
          <MobileVideoBackground />
        </div>
        
        {/* Content Overlay */}
        <div className="absolute inset-0 h-full flex flex-col justify-center items-center p-6" style={{ zIndex: 10 }}>
          {/* Content Box */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/30 w-full max-w-sm">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-lg bg-cover bg-center bg-no-repeat shadow-sm flex-shrink-0"
                  style={{
                    backgroundImage: `url(/haven-influence-icon.svg)`
                  }}
                />
                <img
                  className="w-[80px] h-4 object-contain"
                  src="/haven-influence-vertical-logo.svg"
                  alt="Haven Influence"
                />
              </div>
            </div>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Join the Waitlist</h2>
              <p className="text-gray-600 text-sm">Be among the first to experience Haven Influence</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="h-11 text-sm"
                />
              </div>
              
              <div>
                <Input
                  type="text"
                  placeholder="Company Name"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="h-11 text-sm"
                />
              </div>
              
              <div>
                <Input
                  type="url"
                  placeholder="Website URL"
                  value={formData.websiteUrl}
                  onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                  className="h-11 text-sm"
                />
              </div>
              
              <div>
                <Input
                  type="text"
                  placeholder="Position"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  className="h-11 text-sm"
                />
              </div>
              
              {error && (
                <div className="text-red-500 text-xs text-center">{error}</div>
              )}
              
              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold"
              >
                Join Waitlist
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <button
                onClick={handleBackToLogin}
                className="text-gray-500 text-xs hover:text-gray-700"
              >
                Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Desktop Layout - Split Screen */}
      <div className="hidden lg:flex h-screen w-full">
        {/* Left Side - Video Background */}
        <div className="w-1/2 h-full relative overflow-hidden bg-black">
          <VideoBackground />
          
          {/* Content Overlay */}
          <div className="absolute inset-0 h-full flex flex-col justify-center items-center p-12" style={{ zIndex: 10 }}>
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl bg-cover bg-center bg-no-repeat shadow-lg flex-shrink-0"
                  style={{
                    backgroundImage: `url(/BuzzberryIcon.png)`
                  }}
                />
                <img
                  className="w-[120px] h-6 object-contain"
                  src="/buzzberry-black-logo-4--1.png"
                  alt="BuzzBerry"
                />
              </div>
            </div>
            
            {/* Tagline */}
            <div className="text-center text-white mb-8">
              <h1 className="text-4xl font-bold mb-4">Join the Waitlist</h1>
              <p className="text-xl text-white/80">Be among the first to experience the future of social networking</p>
            </div>
            
            {/* Features */}
            <div className="text-center text-white/70 space-y-2">
              <p>🎯 Early access to new features</p>
              <p>🚀 Priority support and updates</p>
              <p>💎 Exclusive beta testing opportunities</p>
            </div>
          </div>
        </div>
        
        {/* Right Side - Waitlist Form */}
        <div className="w-1/2 h-full flex items-center justify-center p-12 bg-white">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Join the Waitlist</h2>
              <p className="text-gray-600">Be among the first to experience BuzzBerry</p>
            </div>
            
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  
                  <div>
                    <Input
                      type="text"
                      placeholder="Company Name"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  
                  <div>
                    <Input
                      type="url"
                      placeholder="Website URL"
                      value={formData.websiteUrl}
                      onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  
                  <div>
                    <Input
                      type="text"
                      placeholder="Position"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  
                  {error && (
                    <div className="text-red-500 text-sm text-center">{error}</div>
                  )}
                  
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold"
                  >
                    Join Waitlist
                  </Button>
                </form>
                
                <div className="mt-6 text-center">
                  <button
                    onClick={handleBackToLogin}
                    className="text-gray-500 text-sm hover:text-gray-700"
                  >
                    Back to login
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 