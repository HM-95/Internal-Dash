'use client';

import React from "react";
import { useRouter } from "next/navigation";
import { VideoBackground } from "../components/VideoBackground";
import { MobileVideoBackground } from "../components/MobileVideoBackground";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

export default function WaitlistSuccess(): React.ReactElement | null {
  const router = useRouter();

  const handleBackToLogin = () => {
    router.push('/');
  };

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
                    backgroundImage: `url(/BuzzberryIcon.png)`
                  }}
                />
                <img
                  className="w-[80px] h-4 object-contain"
                  src="/buzzberry-black-logo-4--1.png"
                  alt="BuzzBerry"
                />
              </div>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You're on the list!</h2>
              <p className="text-gray-600 text-sm">We'll notify you when it's your turn to join BuzzBerry</p>
            </div>
            
            <Button
              onClick={handleBackToLogin}
              className="w-full h-11 text-sm font-semibold"
            >
              Back to login
            </Button>
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
              <h1 className="text-4xl font-bold mb-4">Welcome to the family!</h1>
              <p className="text-xl text-white/80">You're now part of the BuzzBerry community</p>
            </div>
            
            {/* Features */}
            <div className="text-center text-white/70 space-y-2">
              <p>🎉 You're officially on the waitlist</p>
              <p>📧 We'll keep you updated on progress</p>
              <p>🚀 Get ready for an amazing experience</p>
            </div>
          </div>
        </div>
        
        {/* Right Side - Success Message */}
        <div className="w-1/2 h-full flex items-center justify-center p-12 bg-white">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">You're on the list!</h2>
              <p className="text-gray-600">We'll notify you when it's your turn to join BuzzBerry</p>
            </div>
            
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <Button
                  onClick={handleBackToLogin}
                  className="w-full h-12 text-base font-semibold"
                >
                  Back to login
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 