'use client';

import React, { ReactElement } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { OnboardingPricingPage } from './OnboardingPricingPage';

const influencerData = [
  {
    id: 1,
    name: "colewherld",
    avatar: "/finance bro profile.svg",
    platform: "instagram",
    location: "Miami, US",
    followers: "263,179",
    followersChange: "+23%",
    followersChangeType: "positive",
    avgViews: "87,597",
    avgViewsChange: "+12%",
    avgViewsChangeType: "positive",
    niche: "Crypto",
    buzzScore: "72%",
  },
  {
    id: 2,
    name: "octavia.trades",
    avatar: "/Octavia profile.svg",
    platform: "instagram",
    location: "San Francisco, US",
    followers: "52,500",
    followersChange: "-14%",
    followersChangeType: "negative",
    avgViews: "92,000",
    avgViewsChange: "+8%",
    avgViewsChangeType: "positive",
    niche: "Trading",
    buzzScore: "43%",
  },
  {
    id: 3,
    name: "finance_bro",
    avatar: "/finance bro profile.svg",
    platform: "tiktok",
    location: "New York, US",
    followers: "285,482",
    followersChange: "+13%",
    followersChangeType: "positive",
    avgViews: "70,853",
    avgViewsChange: "+27%",
    avgViewsChangeType: "positive",
    niche: "Finance",
    buzzScore: "91%",
  },
];

const nicheOptions = [
  { id: 1, label: "Crypto", active: true },
  { id: 2, label: "Trading", active: false },
  { id: 3, label: "Finance", active: false },
];

const progressDots = [
  { id: 1, active: true },
  { id: 2, active: false },
  { id: 3, active: false },
];

// Audience data for the spinning wheel
const audienceProfiles = [
  { id: 1, image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop" },
  { id: 2, image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop" },
  { id: 3, image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop" },
  { id: 4, image: "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop" },
  { id: 5, image: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop" },
  { id: 6, image: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop" },
  { id: 7, image: "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop" },
];

interface NewOnboardingFlowProps {
  userHasCompletedOnboarding?: boolean;
}

interface MatchesData {
  totalMatches: number;
  isLoading: boolean;
  error: string | null;
}

export const NewOnboardingFlow = ({ userHasCompletedOnboarding = false }: NewOnboardingFlowProps): ReactElement => {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [currentPage, setCurrentPage] = React.useState(-1); // Start with welcome page
  const [selectedNiche, setSelectedNiche] = React.useState<number | null>(null); // No default selection
  const [showWelcome, setShowWelcome] = React.useState(false);
  const [showLogo, setShowLogo] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [promptValue, setPromptValue] = React.useState("");
  const [loadingStep, setLoadingStep] = React.useState(0);
  const [showMatchesPage, setShowMatchesPage] = React.useState(false);
  const [counterValue, setCounterValue] = React.useState(800);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [matchesData, setMatchesData] = React.useState<MatchesData>({
    totalMatches: 1476, // Will be replaced with real API call
    isLoading: false,
    error: null
  });
  const [apiCallStartTime, setApiCallStartTime] = React.useState<number | null>(null);
  const [actualApiDuration, setActualApiDuration] = React.useState<number | null>(null);

  // Debug function to check current user preferences
  const debugUserPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        console.log('🔍 DEBUG: User not authenticated');
        return;
      }

      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.log('🔍 DEBUG: Error fetching preferences:', error);
      } else {
        console.log('🔍 DEBUG: Current user preferences:', preferences);
      }
    } catch (error) {
      console.log('🔍 DEBUG: Exception in debugUserPreferences:', error);
    }
  };

  // Function to fetch real AI matches count
  const fetchRealMatches = async (): Promise<{ count: number; duration: number }> => {
    const startTime = Date.now();
    setApiCallStartTime(startTime);
    
    try {
      console.log('🔄 Fetching real AI matches...');
      
      // First, generate AI matches
      const generateResponse = await fetch('/api/ai-matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!generateResponse.ok) {
        throw new Error('Failed to generate AI matches');
      }
      
      const generateData = await generateResponse.json();
      console.log('✅ AI matches generated:', generateData);
      
      // Then fetch the count
      const countResponse = await fetch('/api/ai-matches?page=1&limit=1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!countResponse.ok) {
        throw new Error('Failed to fetch matches count');
      }
      
      const countData = await countResponse.json();
      const totalMatches = countData.total_matches || 0;
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`🎯 Real matches found: ${totalMatches} (took ${duration}ms)`);
      
      setActualApiDuration(duration);
      setMatchesData((prev: MatchesData) => ({ ...prev, totalMatches, isLoading: false, error: null }));
      
      return { count: totalMatches, duration };
      
    } catch (error) {
      console.error('❌ Error fetching real matches:', error);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      setActualApiDuration(duration);
      setMatchesData((prev: MatchesData) => ({ 
        ...prev, 
        totalMatches: 1476, // Fallback to mock number
        isLoading: false, 
        error: 'Failed to load matches' 
      }));
      
      return { count: 1476, duration }; // Return fallback
    }
  };

  // Check if user has completed onboarding steps but not subscription
  const checkUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCurrentPage(0);
        return;
      }

      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('onboarding_steps_completed, selected_niches, target_audience_description')
        .eq('user_id', user.id)
        .single();

      if (preferences?.onboarding_steps_completed && 
          preferences?.selected_niches && 
          preferences?.target_audience_description) {
        // User has completed steps, take them directly to pricing
        console.log('User has completed steps, going to pricing page');
        setCurrentPage(4);
        
        // Load their previous data
        if (preferences.selected_niches && preferences.selected_niches.length > 0) {
          const nicheLabel = preferences.selected_niches[0];
          const foundNiche = nicheOptions.find(n => n.label === nicheLabel);
          if (foundNiche) {
            setSelectedNiche(foundNiche.id);
          }
        }
        if (preferences.target_audience_description) {
          setPromptValue(preferences.target_audience_description);
        }
      } else if (preferences?.selected_niches && preferences?.selected_niches.length > 0) {
        // User has saved niche but not completed, continue from where they left off
        const nicheLabel = preferences.selected_niches[0];
        const foundNiche = nicheOptions.find(n => n.label === nicheLabel);
        if (foundNiche) {
          setSelectedNiche(foundNiche.id);
        }
        
        if (preferences.target_audience_description) {
          setPromptValue(preferences.target_audience_description);
          setCurrentPage(2); // Start from step 3 if they have both
        } else {
          setCurrentPage(1); // Start from step 2 if they only have niche
        }
      } else {
        // Start from beginning
        setCurrentPage(0);
      }
    } catch (error) {
      console.error('Error checking user progress:', error);
      setCurrentPage(0);
    }
  };

  // Progressive saving functions - save data as user progresses
  const saveNicheSelection = async (nicheId: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        console.error('User not authenticated for niche saving');
        return;
      }

      const selectedNicheLabels = nicheOptions
        .filter(niche => niche.id === nicheId)
        .map(niche => niche.label);

      // Use upsert with proper subscription_plan handling
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          selected_niches: selectedNicheLabels,
          subscription_plan: 'free', // Unpaid users get free plan
          subscription_status: 'active', // Active account (starter = free tier)
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving niche selection:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
      } else {
        console.log('Niche selection saved successfully:', selectedNicheLabels);
        
        // Check if we can trigger AI matching now (if target audience is already saved)
        try {
          const { data: existingPrefs } = await supabase
            .from('user_preferences')
            .select('target_audience_description')
            .eq('user_id', user.id)
            .single();
          
          if (existingPrefs?.target_audience_description) {
            console.log('Target audience already exists, triggering AI matching...');
            const response = await fetch('/api/ai-matches', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user.id,
                targetAudience: existingPrefs.target_audience_description,
                selectedNiche: selectedNicheLabels[0] // Use the first selected niche
              })
            });
            
            if (response.ok) {
              console.log('AI matching triggered successfully from niche selection');
            } else {
              console.error('Failed to trigger AI matching from niche selection:', response.statusText);
            }
          }
        } catch (aiError) {
          console.error('Error checking/triggering AI matching from niche selection:', aiError);
          // Don't fail the onboarding if AI matching fails
        }
        
        // Debug: check what was actually saved
        await debugUserPreferences();
      }
    } catch (error) {
      console.error('Error in saveNicheSelection:', error);
    }
  };

  const saveTargetAudience = async (description: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        console.error('User not authenticated for target audience saving');
        return;
      }

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          target_audience_description: description.trim(),
          subscription_plan: 'free', // Unpaid users get free plan
          subscription_status: 'active', // Active account (starter = free tier)
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving target audience:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
      } else {
        console.log('Target audience saved successfully:', description.trim());
        
        // AI matching will be triggered immediately when prompt is submitted
        
        // Debug: check what was actually saved
        await debugUserPreferences();
      }
    } catch (error) {
      console.error('Error in saveTargetAudience:', error);
    }
  };
  


  // Fade in welcome text after component mounts
  // Preload the logo image to ensure it's ready when needed
  React.useEffect(() => {
    const logoImg = new Image();
    logoImg.src = '/haven-influence-vertical-logo.svg';
    logoImg.onload = () => {
      console.log('Logo preloaded successfully');
    };
    logoImg.onerror = () => {
      console.error('Failed to preload logo');
    };
  }, []);

  React.useEffect(() => {
    if (currentPage === -1) {
      const fadeInTimer = setTimeout(() => {
        setShowWelcome(true);
        // Fade in logo after welcome text - reduced delay for better reliability
        const logoTimer = setTimeout(() => {
          setShowLogo(true);
        }, 400); // Logo appears 400ms after welcome text (reduced from 800ms)
        return () => clearTimeout(logoTimer);
      }, 100); // Reduced delay before fade in (from 200ms)
      return () => clearTimeout(fadeInTimer);
    }
  }, []);

  // Auto-advance from welcome page after both elements are shown
  React.useEffect(() => {
    if (currentPage === -1 && showWelcome && showLogo) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
        setShowLogo(false);
        setTimeout(() => {
          // If user has already completed onboarding, redirect to dashboard
          if (userHasCompletedOnboarding) {
            router.push('/dashboard');
          } else {
            // Check if user has completed steps but not subscription
            checkUserProgress();
          }
        }, 600); // Wait for fade out to complete
      }, 1500); // Show both elements for 1.5 seconds after logo appears
      return () => clearTimeout(timer);
    }
  }, [currentPage, showWelcome, showLogo, userHasCompletedOnboarding, router]);

  const handleNext = async () => {
    if (currentPage === 0 && selectedNiche) {
      // Save niche selection before moving to next step
      await saveNicheSelection(selectedNiche);
      setCurrentPage(currentPage + 1);
    } else if (currentPage === 1 && promptValue.trim()) {
      // Save target audience description before moving to next step
      await saveTargetAudience(promptValue);
      setCurrentPage(currentPage + 1);
    } else if (currentPage < 2 && currentPage >= 0) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleBack = () => {
    if (currentPage > 0 && currentPage <= 2) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNicheSelect = async (nicheId: number) => {
    const newSelection = selectedNiche === nicheId ? null : nicheId;
    setSelectedNiche(newSelection);
    
    // Save niche selection immediately when selected
    if (newSelection) {
      await saveNicheSelection(newSelection);
    }
  };

  const handlePromptSubmit = async () => {
    if (promptValue.trim()) {
      // Save target audience immediately when submitted
      await saveTargetAudience(promptValue);
      
      setIsAnalyzing(true);
      setLoadingStep(0);
      setMatchesData((prev: MatchesData) => ({ ...prev, isLoading: true, error: null }));
      
      // Start fetching real matches in the background
      const matchesPromise = fetchRealMatches();
      
      // Progress through loading steps with dynamic timing
      setTimeout(() => setLoadingStep(1), 1200);
      setTimeout(() => setLoadingStep(2), 2400);
      
      // Wait for either 3.5 seconds OR the API call to complete (whichever is longer)
      const minLoadingTime = 3500;
      const loadingStartTime = Date.now();
      
      try {
        const { count: realMatchCount, duration: apiDuration } = await matchesPromise;
        const elapsedTime = Date.now() - loadingStartTime;
        
        console.log(`🕐 API took ${apiDuration}ms, total elapsed: ${elapsedTime}ms`);
        
        // If API finished before minimum loading time, wait for the remainder
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        setTimeout(() => {
          setIsAnalyzing(false);
          setLoadingStep(0);
          setCurrentPage(3); // Move to matches found page
          
          // Fade in the matches page
          setTimeout(() => setShowMatchesPage(true), 100);
          
          // Start counter animation with real data
          setTimeout(() => {
            const startValue = 800;
            const endValue = realMatchCount;
            const duration = 2000; // 2 seconds
            const startTime = Date.now();
            
            const updateCounter = () => {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const currentValue = Math.floor(startValue + (endValue - startValue) * progress);
              setCounterValue(currentValue);
              
              if (progress < 1) {
                requestAnimationFrame(updateCounter);
              }
            };
            
            updateCounter();
          }, 500);
          
          // Auto fade out and continue after 5 seconds
          setTimeout(async () => {
            setShowMatchesPage(false);
            // Save all user preferences and mark steps as completed
            await saveUserPreferencesOnly();
            setTimeout(() => setCurrentPage(4), 800); // Move to pricing page
          }, 5000);
        }, remainingTime);
        
      } catch (error) {
        console.error('❌ Error in handlePromptSubmit:', error);
        // Fallback to original timing if API fails
        setTimeout(() => {
          setIsAnalyzing(false);
          setLoadingStep(0);
          setCurrentPage(3);
          setTimeout(() => setShowMatchesPage(true), 100);
          setTimeout(() => {
            const startValue = 800;
            const endValue = 1476; // Fallback number
            const duration = 2000;
            const startTime = Date.now();
            
            const updateCounter = () => {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const currentValue = Math.floor(startValue + (endValue - startValue) * progress);
              setCounterValue(currentValue);
              
              if (progress < 1) {
                requestAnimationFrame(updateCounter);
              }
            };
            
            updateCounter();
          }, 500);
          
          setTimeout(async () => {
            setShowMatchesPage(false);
            await saveUserPreferencesOnly();
            setTimeout(() => setCurrentPage(4), 800);
          }, 5000);
        }, minLoadingTime);
      }
    }
  };

  const saveUserPreferencesOnly = async () => {
    setIsSubmitting(true);
    
    try {
      // Get selected niche labels
      const selectedNicheLabels = nicheOptions
        .filter(niche => selectedNiche === niche.id)
        .map(niche => niche.label);
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        console.error('User not authenticated for final preferences saving');
        return;
      }
      
      const preferenceData = {
        user_id: user.id,
        selected_niches: selectedNicheLabels,
        target_audience_description: promptValue.trim(),
        subscription_plan: 'free', // Set to free for unpaid users
        subscription_status: 'free', // Use 'free' instead of 'trial' for unpaid users
        // Mark onboarding steps as completed, but subscription still needed
        onboarding_steps_completed: true,
        updated_at: new Date().toISOString(),
      };
      
      console.log('Attempting to save final preferences:', preferenceData);
      
      // Always upsert for authenticated users
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(preferenceData, {
          onConflict: 'user_id'
        })
        .select(); // Add select to get the returned data
      
      if (error) {
        console.error('Error saving user preferences:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
      } else {
        console.log('User preferences saved successfully');
        console.log('Returned data:', data);
        console.log('Saved data:', {
          selected_niches: selectedNicheLabels,
          target_audience_description: promptValue.trim(),
          onboarding_steps_completed: true
        });
        // Debug: check what was actually saved
        await debugUserPreferences();
      }
    } catch (error) {
      console.error('Error in saveUserPreferencesOnly:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePromptSubmit();
    }
  };

  const getLoadingText = () => {
    switch (loadingStep) {
      case 0:
        return { title: "Analyzing audience...", subtitle: "Processing your target description" };
      case 1:
        return { title: "Searching influencers...", subtitle: "Scanning our database of 60,000+ creators" };
      case 2:
        return { title: "Matches found!", subtitle: "Preparing your personalized results" };
      default:
        return { title: "Analyzing audience...", subtitle: "Processing your target description" };
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#1a1f2e] to-[#0a0d1a] flex items-center justify-center p-3 sm:p-4 lg:p-6 overflow-hidden relative">
      {/* Half Circle Background - Only visible on matches page and positioned outside all containers */}
      {currentPage === 3 && showMatchesPage && (
        <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#1a1f2e] to-[#0a0d1a]">
          <img 
            src="/Half Circle.png" 
            alt="Half Circle Background" 
            className="absolute left-0 top-0 h-full w-auto object-cover object-left opacity-80 hidden sm:block"
            style={{ 
              minWidth: '60vw',
              maxWidth: '72vw',
              height: '100vh'
            }}
          />
        </div>
      )}
      
      <div className={`max-w-6xl w-full h-full flex flex-col justify-center space-y-3 sm:space-y-4 lg:space-y-5 relative ${
        currentPage === 3 && showMatchesPage ? 'z-10 bg-transparent' : 'z-auto'
      }`}>
        {/* Page Content with Smooth Transitions */}
        <div className={`relative flex-1 flex flex-col justify-center min-h-0 ${
          currentPage === 3 && showMatchesPage ? 'bg-transparent' : ''
        }`}>
          {/* Welcome Page */}
          <div className={`absolute inset-0 flex flex-col justify-center items-center transition-all duration-500 ease-in-out ${
            currentPage === -1 
              ? 'opacity-100'
              : 'opacity-0 translate-x-8 blur-sm pointer-events-none'
          }`}>
            <div className="flex flex-col sm:flex-row items-center justify-center px-4 w-full">
              <h1 className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-normal text-white transition-all duration-500 ease-in-out whitespace-nowrap ${
                showWelcome ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-4 blur-sm'
              }`}>
                Welcome to
              </h1>
              <div className={`transition-all duration-500 ease-in-out sm:ml-3 ${
                showLogo ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-4 blur-sm'
              } mt-2 sm:mt-0`}>
                <img 
                  src="/haven-influence-vertical-logo.svg" 
                  alt="Haven Influence Logo" 
                  className="h-16 sm:h-20 lg:h-24 xl:h-30 w-auto object-contain"
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    console.error('Failed to load Haven Influence logo');
                    // Fallback to text if image fails
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    // Create fallback text
                    const fallback = document.createElement('span');
                    fallback.textContent = 'Haven Influence';
                    fallback.className = 'text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-normal text-white';
                    target.parentNode?.appendChild(fallback);
                  }}
                  onLoad={() => {
                    console.log('Haven Influence logo loaded successfully');
                  }}
                />
              </div>
            </div>
          </div>

          {/* Page 0 */}
          <div className={`absolute inset-0 flex flex-col justify-center transition-all duration-500 ease-in-out ${
            currentPage === 0 ? 'opacity-100 translate-x-0 blur-0' : currentPage < 0 ? 'opacity-0 translate-x-8 blur-sm pointer-events-none' : 'opacity-0 translate-x-8 blur-sm pointer-events-none'
          }`}>
            {/* Tracking Card */}
            <div className="flex justify-center flex-1 items-center min-h-0">
              <img 
                src="/Tracking Card.svg" 
                alt="Influencer Tracking Card" 
                className="max-w-full h-auto max-h-[50vh] sm:max-h-[55vh] lg:max-h-[60vh] w-auto object-contain"
              />
            </div>

            {/* Main Heading */}
            <div className="text-center flex-shrink-0 mb-6 sm:mb-8 lg:mb-10">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white leading-tight font-sans px-4 max-w-2xl mx-auto">
                Track over 60,000 influencers with<br />
                performance data updated every week
              </h1>
            </div>

            {/* Niche Selection */}
            <div className="text-center space-y-4 sm:space-y-5 lg:space-y-6 flex-shrink-0">
              <h2 className="text-sm sm:text-base font-normal text-gray-400 font-sans">
                Select your target niche <span className="text-red-400">*</span>
              </h2>
              
              <div className="flex justify-center gap-2 sm:gap-3 lg:gap-4 flex-wrap px-4">
                {nicheOptions.map((niche) => (
                  <button
                    key={niche.id}
                    onClick={() => handleNicheSelect(niche.id)}
                    className={`px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 lg:py-2 rounded-full border border-gray-600 bg-gray-500/25 text-white hover:bg-gray-500/40 text-xs sm:text-sm lg:text-base font-medium transition-colors ${
                      selectedNiche === niche.id 
                        ? '!bg-white !text-black !border-white shadow-lg hover:!bg-gray-100 hover:!text-black' 
                        : 'border-gray-600 bg-gray-500/25 hover:bg-gray-500/40 text-white'
                    }`}
                  >
                    {niche.label}
                  </button>
                ))}
              </div>
              
              {/* Validation Message */}
              {currentPage === 0 && !selectedNiche && (
                <p className="text-red-400 text-xs sm:text-sm font-medium mt-2">
                  Please select a niche to continue
                </p>
              )}
            </div>
          </div>

          {/* Page 1 */}
          <div className={`absolute inset-0 flex flex-col justify-center transition-all duration-500 ease-in-out ${
            currentPage === 1 ? 'opacity-100 translate-x-0 blur-0' : currentPage < 1 ? 'opacity-0 translate-x-8 blur-sm pointer-events-none' : 'opacity-0 -translate-x-8 blur-sm pointer-events-none'
          }`}>
            {/* Audience Tracking Image */}
            <div className="flex justify-center flex-1 items-center min-h-0">
              <img 
                src="/audience_tracking.svg" 
                alt="Audience Tracking" 
                className="max-w-full h-auto max-h-[40vh] sm:max-h-[45vh] lg:max-h-[50vh] w-auto object-contain"
              />
            </div>

            {/* Main Heading */}
            <div className="text-center flex-shrink-0 mb-6 sm:mb-8 lg:mb-10">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white leading-tight font-sans px-4 max-w-3xl mx-auto">
                Search our data or import your own list of<br />
                influencers to measure their performance
              </h1>
            </div>

            {/* Description */}
            <div className="text-center space-y-4 sm:space-y-5 lg:space-y-6 flex-shrink-0">
              <h2 className="text-sm sm:text-base font-normal text-gray-400 font-sans max-w-3xl mx-auto px-4">
                All your influencer imports are kept confidential.<br />
                You can import the accounts you want to track in your dashboard
              </h2>
            </div>
          </div>

          {/* Page 2 */}
          <div className={`absolute inset-0 flex flex-col justify-center transition-all duration-500 ease-in-out ${
            currentPage === 2 ? 'opacity-100 translate-x-0 blur-0' : currentPage < 2 ? 'opacity-0 translate-x-8 blur-sm pointer-events-none' : 'opacity-0 -translate-x-8 blur-sm pointer-events-none'
          }`}>
            {/* Flexible spacing that adapts to screen size */}
            <div className="flex-shrink-0 h-4 sm:h-6 lg:h-8"></div>
            
            {/* Audience Match Image */}
            <div className="flex justify-center items-center mb-4 sm:mb-6 flex-shrink-0">
              <img 
                src="/Audience-Match.svg" 
                alt="Audience Match" 
                className="max-w-full h-auto max-h-[35vh] sm:max-h-[40vh] lg:max-h-[45vh] w-auto object-contain"
              />
            </div>

            {/* Main Heading */}
            <div className="text-center flex-shrink-0 mb-4 sm:mb-6 lg:mb-8">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white leading-tight font-sans px-4 max-w-3xl mx-auto">
                Find the best audience matches for your campaign<br />
                based on your target customer
              </h1>
            </div>

            {/* Description and Prompt Box Container */}
            <div className="text-center space-y-3 sm:space-y-4 lg:space-y-5 flex-shrink-0">
              <h2 className="text-sm sm:text-base font-normal text-gray-400 font-sans max-w-3xl mx-auto px-4">
                Search for your target audience
              </h2>
              
              {/* ChatGPT-style Prompt Box */}
              <div className="w-full max-w-2xl mx-auto px-4">
                <div className="relative">
                  <input
                    type="text"
                    value={promptValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPromptValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe your target audience..."
                    className={`w-full px-4 py-3 rounded-2xl backdrop-blur-sm border text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300/40 focus:border-transparent transition-all text-sm sm:text-base ${
                      isAnalyzing 
                        ? 'bg-gray-800/60 border-gray-600/50 pr-48 sm:pr-56' 
                        : 'bg-gray-200/20 border-gray-300/30 pr-12 sm:pr-14'
                    }`}
                    disabled={isAnalyzing}
                  />
                  
                  {/* Loading animation inside the input box */}
                  {isAnalyzing ? (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 bg-gray-800/80 px-3 py-1 rounded-lg">
                      <div className="text-white text-xs sm:text-sm whitespace-nowrap">
                        {getLoadingText().title}
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={handlePromptSubmit}
                      disabled={isAnalyzing || !promptValue.trim()}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center"
                    >
                      <img 
                        src="/Send Prompt Button.png" 
                        alt="Send" 
                        className="w-full h-full object-contain transition-all duration-200 hover:scale-110 hover:shadow-lg"
                      />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Page 3 - Matches Found Page */}
          <div className={`absolute inset-0 flex flex-col justify-center transition-all duration-500 ease-in-out bg-transparent ${
            currentPage === 3 && showMatchesPage ? 'opacity-100 translate-x-0 blur-0' : 'opacity-0 translate-x-8 blur-sm pointer-events-none'
          }`}>
            <div className="flex flex-col justify-center items-center h-full relative bg-transparent">
              {/* Main Text Content - Positioned to avoid overlapping with half circle */}
              <div className="absolute left-1/2 sm:left-8 md:left-16 lg:left-24 xl:left-32 top-1/2 transform -translate-x-1/2 sm:translate-x-0 -translate-y-1/2 z-10 px-4 text-center sm:text-left max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                <div className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-none mb-3 sm:mb-4 font-mono">
                  {matchesData.isLoading ? '...' : counterValue.toLocaleString()}
                </div>
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">
                  Matches Found
                </h1>
                {matchesData.error && (
                  <p className="text-red-400 text-sm mt-2">
                    Error loading matches
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Page 4 - Pricing Page */}
          <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${
            currentPage === 4 ? 'opacity-100 translate-x-0 blur-0' : currentPage < 4 ? 'opacity-0 translate-x-8 blur-sm pointer-events-none' : 'opacity-0 -translate-x-8 blur-sm pointer-events-none'
          }`}>
            <OnboardingPricingPage 
              isVisible={currentPage === 4}
            />
          </div>
        </div>

        {/* Progress Dots */}
        <div className={`flex justify-center gap-2 flex-shrink-0 py-1 transition-opacity duration-300 ${
          currentPage === -1 || currentPage === 3 || currentPage === 4 ? 'opacity-0' : 'opacity-100'
        }`}>
          {progressDots.map((dot, index) => (
            <div
              key={dot.id}
              className={`h-1.5 w-8 rounded-full transition-all ${
                index === currentPage ? 'bg-white' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center items-center flex-shrink-0 px-4 relative h-12">
          {/* Back Button - Positioned absolutely on the left */}
          {currentPage > 0 && currentPage !== -1 && currentPage !== 3 && currentPage !== 4 && (
            <button 
              onClick={handleBack}
              className="absolute left-4 flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-medium transition-all bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}

          {/* Next Button - Centered */}
          {currentPage >= 0 && currentPage < 2 && currentPage !== 3 && currentPage !== 4 && (
            <button 
              onClick={handleNext}
              disabled={currentPage === 0 && !selectedNiche}
              className={`px-4 sm:px-6 lg:px-8 py-1.5 sm:py-2 lg:py-2.5 rounded-full text-sm sm:text-base lg:text-base font-semibold transition-all shadow-lg min-w-[100px] sm:min-w-[120px] lg:min-w-[140px] ${
                currentPage === 0 && !selectedNiche 
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50' 
                  : 'bg-white hover:bg-gray-100 text-gray-900'
              }`}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
