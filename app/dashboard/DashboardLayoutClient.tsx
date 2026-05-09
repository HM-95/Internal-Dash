'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { FeedbackModal } from '@/components/dashboard/modals/FeedbackModal';
import { SettingsModal } from '@/components/dashboard/modals/SettingsModal';
import { InternalAuthProvider } from '@/contexts/InternalAuthContext';
// import { User } from '@supabase/supabase-js'; // DISABLED - Using internal auth

interface InternalUser {
  username: string;
  accessGroup: string;
  userId: string;
}

interface DashboardLayoutClientProps {
  user: InternalUser;
  children: React.ReactNode;
}

// Navigation Loading Skeleton Component
function NavigationLoadingSkeleton({ target }: { target: string | null }) {
  // Different skeletons for different pages with consistent design patterns
  if (target === 'AI Search') {
    return (
      <div className="bg-black min-h-screen">
        <section className="flex flex-col w-full max-w-[820px] items-center gap-8 sm:gap-10 md:gap-10 lg:gap-12 mx-auto py-6 sm:py-6 md:py-6 lg:py-8 px-4">
          {/* Welcome Section Skeleton */}
          <div className="flex flex-col items-center gap-3 sm:gap-[3px] w-full max-w-xs sm:max-w-sm md:max-w-none">
            <div className="flex flex-col w-full max-w-[180px] sm:max-w-[228px] items-start gap-2.5">
              <div className="w-full h-[90px] sm:h-[90px] md:h-[110px] lg:h-[130px] bg-gray-800 rounded-lg animate-pulse" />
            </div>
            <div className="flex flex-col items-start gap-3 sm:gap-2.5 p-2 sm:p-2.5 w-full">
              <div className="flex flex-col w-full max-w-[780px] items-start gap-2 sm:gap-2 mx-auto px-2 sm:px-4 md:px-0">
                <div className="w-full flex justify-center">
                  <div className="h-8 sm:h-10 md:h-12 w-80 bg-gray-800 rounded animate-pulse" />
                </div>
                <div className="w-full flex flex-col items-center gap-2">
                  <div className="h-4 sm:h-5 md:h-6 w-96 bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 sm:h-5 md:h-6 w-80 bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature Cards and Search Section Skeleton */}
          <div className="flex flex-col w-full max-w-[804px] items-center gap-6 sm:gap-6 md:gap-8 lg:gap-10">
            <div className="flex flex-row flex-wrap items-center justify-center gap-3 xs:gap-2 sm:gap-3 w-full px-2 sm:px-0">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="w-[180px] sm:w-[200px] md:w-[220px] lg:w-[240px] bg-[#0f1419] border border-[#2c3954] rounded-xl animate-pulse">
                  <div className="flex flex-col h-[80px] xs:h-[90px] sm:h-[100px] md:h-[120px] items-start pt-2 pb-3 sm:pb-4 px-2 sm:px-3">
                    <div className="flex flex-col items-start justify-center gap-1 w-full mt-auto">
                      <div className="h-4 sm:h-5 md:h-6 w-32 bg-gray-700 rounded" />
                      <div className="h-3 sm:h-4 w-28 bg-gray-600 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="w-full max-w-[776px] px-2 sm:px-0">
              <div className="border border-gray-700 rounded-xl bg-[#0f1419] p-4">
                <div className="h-6 bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
  
  if (target === 'My Lists') {
    return (
      <main className="flex flex-col min-h-screen bg-black w-full p-3 lg:p-4">
        <section className="flex flex-col w-full">
          <div className="h-7 w-28 bg-gray-800 rounded mb-4 animate-pulse" />

          <div className="w-full bg-[#0f1419] rounded-[12px] border border-[#2c3954] p-3 lg:p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-24 bg-gray-700 rounded animate-pulse" />
                <div className="h-8 w-28 bg-gray-800 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-20 bg-gray-700 rounded animate-pulse" />
                <div className="h-8 w-20 bg-gray-700 rounded animate-pulse" />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-full bg-[#1a1f2e] rounded-[12px] border border-[#2c3954] p-3 animate-pulse"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="h-5 w-40 bg-gray-700 rounded mb-2" />
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-16 bg-gray-700 rounded" />
                        <div className="h-4 w-20 bg-gray-800 rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 h-3 w-full bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    );
  }
  
  // Default Discover skeleton
  return (
    <div className="bg-black min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-800 rounded mb-4 animate-pulse" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#0f1419] border border-[#2c3954] rounded-xl p-4 animate-pulse">
                <div className="h-4 w-20 bg-gray-700 rounded mb-2" />
                <div className="h-6 w-16 bg-gray-600 rounded mb-1" />
                <div className="h-3 w-12 bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-[#0f1419] border border-[#2c3954] rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-700 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-700 rounded mb-1" />
                  <div className="h-3 w-20 bg-gray-600 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-700 rounded" />
                <div className="h-3 w-3/4 bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayoutClient({ user, children }: DashboardLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showFeedbackModal, setShowFeedbackModal] = React.useState(false);
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [toast, setToast] = React.useState<null | { type: 'success' | 'error'; title: string; message: string }>(null);
  const [toastExiting, setToastExiting] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [navigationTarget, setNavigationTarget] = React.useState<string | null>(null);

  // Fix hydration issues by ensuring client-side rendering
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect from /dashboard to /dashboard/discover
  React.useEffect(() => {
    if (pathname === '/dashboard') {
      router.replace('/dashboard/discover');
    }
  }, [pathname, router]);

  // Clear navigation loading state when route changes
  React.useEffect(() => {
    setIsNavigating(false);
    setNavigationTarget(null);
  }, [pathname]);



  // Determine active item based on current pathname
  const getActiveItem = () => {
    if (pathname.includes('/chat')) return 'AI Search';
    if (pathname.includes('/aisearch')) return 'AI Search';
    if (pathname.includes('/discover')) return 'Discover';
    if (pathname.includes('/mylists')) return 'My Lists';
    if (pathname.includes('/talent-network')) return 'Talent Network';
    return 'Discover'; // default to Discover
  };

  const handleNavigate = (item: string) => {
    if (item === 'Settings') {
      setShowSettingsModal(true);
    } else if (item === 'Feedback') {
      setShowFeedbackModal(true);
    } else {
      // Set loading state immediately for instant feedback
      setIsNavigating(true);
      setNavigationTarget(item);
      
      // Navigate to the target page
      switch (item) {
        case 'AI Search':
          router.push('/dashboard/aisearch');
          break;
        case 'Discover':
          router.push('/dashboard/discover');
          break;
        case 'My Lists':
          router.push('/dashboard/mylists');
          break;
        case 'Talent Network':
          router.push('/dashboard/talent-network');
          break;
        default:
          router.push('/dashboard/discover');
      }
    }
  };

  const handleFeedbackClick = () => {
    setShowFeedbackModal(true);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Handle toast display and auto-hide
  const handleToast = (toastData: { type: 'success' | 'error'; title: string; message: string }) => {
    setToast(toastData);
    setToastExiting(false);
    
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setToastExiting(true);
      setTimeout(() => {
        setToast(null);
        setToastExiting(false);
      }, 200);
    }, 3000);
  };

  // Don't render anything while redirecting or during hydration
  if (pathname === '/dashboard' || !isClient) {
    return null;
  }

  return (
    <InternalAuthProvider user={user}>
      <main className="flex h-screen overflow-hidden relative">
        {toast && (
          <div className="fixed top-4 right-4 z-[10000] pointer-events-none">
            <div className={`pointer-events-auto bg-[#1a1f2e] border border-gray-700 rounded-[12px] px-4 py-3 shadow-xl text-sm min-w-[260px] max-w-sm ${toastExiting ? 'toast-exit' : 'toast-enter'}`}>
              <div className="text-gray-50 font-semibold mb-1">{toast.title}</div>
              <div className="text-gray-300">{toast.message}</div>
            </div>
          </div>
        )}
        <DashboardSidebar 
          user={user}
          activeItem={getActiveItem()}
          onNavigate={handleNavigate}
          onFeedbackClick={handleFeedbackClick}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            {isNavigating ? (
              <NavigationLoadingSkeleton target={navigationTarget} />
            ) : (
              children
            )}
          </div>
        </div>
        
        {showFeedbackModal && (
          <FeedbackModal
            isOpen={showFeedbackModal}
            onClose={() => setShowFeedbackModal(false)}
            onNotify={handleToast}
          />
        )}
        
        {showSettingsModal && (
          <SettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
          />
        )}
      </main>
    </InternalAuthProvider>
  );
} 