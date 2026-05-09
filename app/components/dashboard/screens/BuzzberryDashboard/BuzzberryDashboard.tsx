'use client'

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChatHistorySection } from "./sections/ChatHistorySection";
import { MainContentSection } from "./sections/MainContentSection";

interface BuzzberryDashboardProps {
  initialPrompt?: string;
}

export const BuzzberryDashboard = ({ initialPrompt }: BuzzberryDashboardProps): JSX.Element => {
  const router = useRouter();
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handlePromptSubmit = (prompt: string) => {
    setIsTransitioning(true);
    const encodedPrompt = encodeURIComponent(prompt);
    
    // Reduced delay for faster transition
    setTimeout(() => {
      router.push(`/dashboard/chat?prompt=${encodedPrompt}`);
    }, 25);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Transition Overlay - Dark Theme */}
      {isTransitioning && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-[#0f1419] rounded-full flex items-center justify-center overflow-hidden border border-gray-700">
              <video
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
              >
                <source
                  src="https://epwm2xeeqm8soa6z.public.blob.vercel-storage.com/Buzzberry%20AI%20Chat.webm"
                  type="video/webm"
                />
                <img
                  className="w-8 h-8"
                  alt="Buzzberry AI"
                  src="/AI Blurb Icon.svg"
                />
              </video>
            </div>
            <div className="text-white text-sm font-medium">Preparing your chat...</div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0s', animationDuration: '1.4s'}}></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s', animationDuration: '1.4s'}}></div>
              <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.4s', animationDuration: '1.4s'}}></div>
            </div>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="w-full h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4 py-4 md:py-6">
          <div className="w-full max-w-4xl">
            <MainContentSection onPromptSubmit={handlePromptSubmit} />
          </div>
        </div>
      </div>

      {/* Top navigation buttons */}
      <div className="absolute top-2 xs:top-3.5 right-2 xs:right-4 flex gap-1 xs:gap-2 z-20">
        <Button
          variant="outline"
          onClick={() => setIsChatHistoryOpen(!isChatHistoryOpen)}
          className="flex items-center gap-1 px-2 xs:px-3.5 py-2 xs:py-3 bg-[#0f1419] rounded-[34px] border-gray-700 hover:bg-[#1a1f2e]"
        >
          <img
            className="w-3 xs:w-4 h-3 xs:h-4"
            alt="Chat history icon"
            src="/Chat History.svg"
          />
          <span className="hidden sm:inline font-medium text-white text-xs tracking-[-0.08px] leading-5 font-['Plus_Jakarta_Sans',Helvetica]">
            Chat History
          </span>
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            // Clear current chat and start fresh
            router.push('/dashboard/aisearch');
          }}
          className="flex items-center justify-center px-3 py-2 xs:py-3 bg-[#0f1419] rounded-full border-gray-700 hover:bg-[#1a1f2e]"
        >
          <img 
            className="w-3 xs:w-4 h-3 xs:h-4" 
            alt="Plus icon" 
            src="/plus-icon.svg"
          />
        </Button>
      </div>

      {/* Overlay when sidebar is open */}
      <div className={`fixed inset-0 bg-black transition-opacity duration-300 ${
        isChatHistoryOpen ? 'opacity-50 z-30' : 'opacity-0 pointer-events-none'
      }`} onClick={() => setIsChatHistoryOpen(false)} />

      {/* Chat History Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-72 xs:w-80 transform transition-transform duration-300 ease-in-out z-40 ${
        isChatHistoryOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <ChatHistorySection 
          onClose={() => setIsChatHistoryOpen(false)} 
          onChatSelect={(chatId) => {
            console.log('Loading chat from dashboard:', chatId)
            // Close overlay then navigate to chat page with the selected chat
            setIsChatHistoryOpen(false)
            router.push(`/dashboard/chat?sessionId=${chatId}`)
          }}
        />
      </div>
    </div>
  );
};