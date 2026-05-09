'use client';

import React from 'react';
import { Lock, CreditCard, DollarSign, User, Save, CheckCircle, Eye, EyeOff, X, ChevronDown, Sparkles, AlertCircle, Check } from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { usePasswordChange } from '@/hooks/usePasswordChange';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { useNiches } from '@/hooks/useNiches';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_LIMITS } from '@/types/userPreferences';



// Password Change Form Component
interface PasswordChangeFormProps {
  passwords: {
    current: string;
    new: string;
    confirm: string;
  };
  setPasswords: React.Dispatch<React.SetStateAction<{
    current: string;
    new: string;
    confirm: string;
  }>>;
  showPasswords: {
    current: boolean;
    new: boolean;
    confirm: boolean;
  };
  setShowPasswords: React.Dispatch<React.SetStateAction<{
    current: boolean;
    new: boolean;
    confirm: boolean;
  }>>;
  passwordChange: any;
  handlePasswordChange: () => void;
}

const PasswordChangeForm = ({ 
  passwords, 
  setPasswords, 
  showPasswords, 
  setShowPasswords, 
  passwordChange, 
  handlePasswordChange 
}: PasswordChangeFormProps) => (
  <div className="space-y-6 max-w-md">
    <div>
      <label className="block text-sm font-semibold text-[#f9fafb] mb-2">
        Current Password
      </label>
      <div className="relative">
        <input
          type={showPasswords.current ? 'text' : 'password'}
          value={passwords.current}
          onChange={(e) => {
            setPasswords(prev => ({ ...prev, current: e.target.value }));
            passwordChange.clearMessages();
          }}
          className="w-full px-4 py-3 pr-12 border border-[#374151] bg-[#1a1f2e] text-[#f9fafb] rounded-xl focus:ring-2 focus:ring-[#6C40E4] focus:border-[#6C40E4] placeholder-[#9ca3af]"
          placeholder="Enter current password"
          disabled={passwordChange.loading}
        />
        <button
          type="button"
          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
          className="absolute right-3 top-3.5 text-[#9ca3af] hover:text-[#f9fafb]"
        >
          {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>

    <div>
      <label className="block text-sm font-semibold text-[#f9fafb] mb-2">
        New Password
      </label>
      <div className="relative">
        <input
          type={showPasswords.new ? 'text' : 'password'}
          value={passwords.new}
          onChange={(e) => {
            setPasswords(prev => ({ ...prev, new: e.target.value }));
            passwordChange.checkPasswordStrength(e.target.value);
            passwordChange.clearMessages();
          }}
          className="w-full px-4 py-3 pr-12 border border-[#374151] bg-[#1a1f2e] text-[#f9fafb] rounded-xl focus:ring-2 focus:ring-[#6C40E4] focus:border-[#6C40E4] placeholder-[#9ca3af]"
          placeholder="Enter new password"
          disabled={passwordChange.loading}
        />
        <button
          type="button"
          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
          className="absolute right-3 top-3.5 text-[#9ca3af] hover:text-[#f9fafb]"
        >
          {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {/* Password Strength Indicator */}
      {passwordChange.passwordStrength && passwords.new && (
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#9ca3af]">Password Strength:</span>
            <span className={`text-sm font-medium ${
              passwordChange.passwordStrength.score >= 75 ? 'text-green-400' :
              passwordChange.passwordStrength.score >= 50 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {passwordChange.passwordStrength.level}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                passwordChange.passwordStrength.score >= 75 ? 'bg-green-500' :
                passwordChange.passwordStrength.score >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(passwordChange.passwordStrength.score, 100)}%` }}
            ></div>
          </div>
          {passwordChange.passwordStrength.feedback.length > 0 && (
            <ul className="text-xs text-[#9ca3af] space-y-1">
              {passwordChange.passwordStrength.feedback.map((feedback: string, index: number) => (
                <li key={index} className="flex items-center">
                  <span className="text-red-400 mr-2">•</span>
                  {feedback}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>

    <div>
      <label className="block text-sm font-semibold text-[#f9fafb] mb-2">
        Confirm New Password
      </label>
      <div className="relative">
        <input
          type={showPasswords.confirm ? 'text' : 'password'}
          value={passwords.confirm}
          onChange={(e) => {
            setPasswords(prev => ({ ...prev, confirm: e.target.value }));
            passwordChange.clearMessages();
          }}
          className="w-full px-4 py-3 pr-12 border border-[#374151] bg-[#1a1f2e] text-[#f9fafb] rounded-xl focus:ring-2 focus:ring-[#6C40E4] focus:border-[#6C40E4] placeholder-[#9ca3af]"
          placeholder="Confirm new password"
          disabled={passwordChange.loading}
        />
        <button
          type="button"
          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
          className="absolute right-3 top-3.5 text-[#9ca3af] hover:text-[#f9fafb]"
        >
          {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {passwords.confirm && passwords.new !== passwords.confirm && (
        <p className="mt-1 text-sm text-red-400">Passwords do not match</p>
      )}
    </div>

    {/* Error Messages */}
    {passwordChange.error && (
      <div className="flex items-center text-red-400 text-sm bg-red-900/20 border border-red-500/20 rounded-lg p-3">
        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
        {passwordChange.error}
      </div>
    )}

    {/* Success Message */}
    {passwordChange.success && (
      <div className="flex items-center text-green-400 text-sm bg-green-900/20 border border-green-500/20 rounded-lg p-3">
        <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
        Password updated successfully!
      </div>
    )}

    <div className="pt-4">
      <button
        onClick={handlePasswordChange}
        disabled={passwordChange.loading || !passwords.current || !passwords.new || !passwords.confirm || passwords.new !== passwords.confirm}
        className={`flex items-center px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 ${
          passwordChange.loading || !passwords.current || !passwords.new || !passwords.confirm || passwords.new !== passwords.confirm
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 hover:shadow-2xl hover:shadow-purple-500/25'
        }`}
      >
        {passwordChange.loading ? (
          <>
            <div className="w-5 h-5 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
            Updating...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5 mr-2" />
            Update Password
          </>
        )}
      </button>
    </div>
  </div>
);

// Custom Dropdown Component
interface DropdownOption {
  value: string | number;
  label: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
}

function CustomDropdown({ options, value, onChange, placeholder, className = "" }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-[#374151] rounded-xl focus:ring-2 focus:ring-[#60a5fa] focus:border-[#60a5fa] bg-[#1a1f2e] text-left flex items-center justify-between hover:border-[#4b5563] transition-colors"
      >
        <span className="text-[#f9fafb]">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-5 h-5 text-[#9ca3af] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1f2e] border border-[#374151] rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-[#2a3441] transition-colors first:rounded-t-xl last:rounded-b-xl ${
                option.value === value ? 'bg-[#6C40E4]/20 text-[#6C40E4]' : 'text-[#f9fafb]'
              }`}
            >
              {option.value === value && <span className="mr-2 text-[#6C40E4]">✓</span>}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Budget Range Dropdown Component (appears above)
function BudgetDropdown({ options, value, onChange, placeholder, className = "" }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-[#374151] rounded-xl focus:ring-2 focus:ring-[#6C40E4] focus:border-[#6C40E4] bg-[#1a1f2e] text-left flex items-center justify-between hover:border-[#4b5563] transition-colors"
      >
        <span className="text-[#f9fafb]">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-5 h-5 text-[#9ca3af] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1a1f2e] border border-[#374151] rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-[#2a3441] transition-colors first:rounded-t-xl last:rounded-b-xl ${
                option.value === value ? 'bg-[#6C40E4]/20 text-[#6C40E4]' : 'text-[#f9fafb]'
              }`}
            >
              {option.value === value && <span className="mr-2 text-[#6C40E4]">✓</span>}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  // Hooks

  const userPreferences = useUserPreferences();
  const passwordChange = usePasswordChange();
  const { nicheNames, loading: nichesLoading, error: nichesError } = useNiches();
  
  // Local state
  const [activeTab, setActiveTab] = React.useState('ai-preferences');
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);
  const [showPasswords, setShowPasswords] = React.useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwords, setPasswords] = React.useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedNiches, setSelectedNiches] = React.useState<string[]>([]);
  const [targetAudienceDescription, setTargetAudienceDescription] = React.useState<string>('');
  const [originalNiches, setOriginalNiches] = React.useState<string[]>([]);
  const [originalTargetAudience, setOriginalTargetAudience] = React.useState<string>('');
  const [aiPrefsSaved, setAiPrefsSaved] = React.useState(false);
  const [passwordSaved, setPasswordSaved] = React.useState(false);
  const [isRegeneratingAI, setIsRegeneratingAI] = React.useState(false);
  // Removed hardcoded currentPlan - now using userPreferences.usageStats and userPreferences.preferences.subscription_plan

  // Enhanced close handler to trigger discover page reload if needed
  const handleClose = () => {
    // Check if we need to reload discover page and user is currently on discover
    if (typeof window !== 'undefined') {
      const needsReload = localStorage.getItem('discover_needs_reload');
      const currentPath = window.location.pathname;
      
      if (needsReload === 'true' && currentPath.includes('/discover')) {
        // Clear the flag and reload the page
        localStorage.removeItem('discover_needs_reload');
        window.location.reload();
      }
    }
    
    onClose();
  };

  // Handle ESC key press
  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  
  // Load current AI preferences when modal opens
  React.useEffect(() => {
    if (isOpen && userPreferences.preferences) {
      const niches = userPreferences.preferences.selected_niches || [];
      const audience = userPreferences.preferences.target_audience_description || '';
      
      setSelectedNiches(niches);
      setTargetAudienceDescription(audience);
      setOriginalNiches(niches);
      setOriginalTargetAudience(audience);
      
      // Reset states when modal opens
      setAiPrefsSaved(false);
      setError(null);
    }
  }, [isOpen, userPreferences.preferences]);

  // TODO: Fetch current plan from Supabase when integrating
  // React.useEffect(() => {
  //   const fetchCurrentPlan = async () => {
  //     const { data: profile } = await supabase
  //       .from('profiles')
  //       .select('stripe_customer_id, current_plan')
  //       .single();
  //     
  //     if (profile?.current_plan) {
  //       setCurrentPlan(profile.current_plan);
  //     }
  //   };
  //   fetchCurrentPlan();
  // }, []);

  const tabs = [
    { id: 'ai-preferences', label: 'AI Preferences', icon: () => <div className="w-4 h-4 bg-[#6C40E4] rounded" /> },
    { id: 'password', label: 'Change Password', icon: Lock },
    { id: 'my-plan', label: 'My Plan', icon: User },
    { id: 'pricing', label: 'Pricing', icon: DollarSign }
  ];

  // Check if preferences have changed
  const hasPreferencesChanged = () => {
    const nichesChanged = JSON.stringify(selectedNiches.sort()) !== JSON.stringify(originalNiches.sort());
    const audienceChanged = targetAudienceDescription.trim() !== originalTargetAudience.trim();
    return nichesChanged || audienceChanged;
  };

  // Handle niche selection
  const handleNicheToggle = (niche: string) => {
    setSelectedNiches(prev => {
      if (prev.includes(niche)) {
        return prev.filter(n => n !== niche);
      } else {
        return [...prev, niche];
      }
    });
  };
  
  // Save AI preferences and regenerate matches
  const handleSaveAIPreferences = async () => {
    if (selectedNiches.length === 0) {
      setError('Please select at least one niche');
      return;
    }
    
    if (!targetAudienceDescription.trim()) {
      setError('Please provide a target audience description');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Update user preferences
      const success = await userPreferences.updatePreferences({
        selected_niches: selectedNiches,
        target_audience_description: targetAudienceDescription.trim()
      });
      
      if (success) {
        setAiPrefsSaved(true);
        
        // Regenerate AI matches with new preferences
        setIsRegeneratingAI(true);
        try {
          const response = await fetch('/api/ai-matches', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('AI matches regenerated:', data.matches_generated);
            
            // Clear all AI-related caches to force reload
            if (typeof window !== 'undefined') {
              const cacheKeys = [
                'ai_matches_all',
                'ai_matches_50',
                'ai_page_1',
                'ai_page_2',
                'ai_page_3',
                'ai_page_4',
                'ai_page_5'
              ];
              cacheKeys.forEach(key => {
                localStorage.removeItem(key);
              });
              
              // Also clear any cached AI metrics
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith('ai_') || key.includes('ai_matches')) {
                  localStorage.removeItem(key);
                }
              });
            }
            
            // Update original values to reflect saved state
            setOriginalNiches(selectedNiches);
            setOriginalTargetAudience(targetAudienceDescription.trim());
            
            // Set flag for discover page reload
            if (typeof window !== 'undefined') {
              localStorage.setItem('discover_needs_reload', 'true');
            }
            
            // Show success message
            setAiPrefsSaved(true);
            setTimeout(() => {
              setAiPrefsSaved(false);
            }, 3000);
          } else {
            const errorData = await response.text();
            console.error('Failed to regenerate AI matches:', errorData);
            setError('Failed to regenerate AI matches. Please try again.');
          }
        } catch (aiError) {
          console.error('Error regenerating AI matches:', aiError);
          setError('Error regenerating AI matches. Please check your connection and try again.');
        } finally {
          setIsRegeneratingAI(false);
        }
      } else {
        setError('Failed to save preferences');
      }
    } catch (err) {
      setError('Failed to save preferences');
      console.error('Error saving AI preferences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const niches = nicheNames;
  const locations = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Global'];
  const goalOptions = ['reach', 'drive sales', 'grow audience', 'brand awareness', 'engagement', 'conversions'];
  const budgetOptions = ['<$500', '$500-2K', '$2K-5K', '$5K-10K', '$10K+'];

  // Helper function to get current plan limits
  const getCurrentPlanLimits = () => {
    if (!userPreferences.usageStats) return null;
    return userPreferences.usageStats.limits;
  };

  // Helper function to check if user is on current plan
  const isCurrentPlan = (planName: string) => {
    return userPreferences.preferences?.subscription_plan === planName;
  };

  // Dropdown options
  const locationOptions = locations.map(location => ({ value: location, label: location }));
  const budgetOptions2 = budgetOptions.map(budget => ({ value: budget, label: budget }));

  // Removed duplicate functions - using the new implementations above

  const handlePasswordChange = async () => {
    const validationErrors = passwordChange.validatePasswords(
      passwords.current,
      passwords.new,
      passwords.confirm
    );

    if (validationErrors.length > 0) {
      return; // Validation errors will be shown by the hook
    }

    const success = await passwordChange.changePassword(passwords.current, passwords.new);
    if (success) {
      setPasswords({ current: '', new: '', confirm: '' });
    }
  };



  // Removed unused functions to fix linter errors



  const { plans, handlePlanPurchase, loading: stripeLoading, error: stripeError } = useStripeCheckout();

  // Handle Stripe errors
  React.useEffect(() => {
    if (stripeError) {
      setError(stripeError);
    }
  }, [stripeError]);

  const handleStartFreeTrial = async (planName: 'starter' | 'pro' | 'agency') => {
    setError(null); // Clear any previous errors
    
    try {
      const result = await handlePlanPurchase(planName, billingCycle);
      
      if (result?.requiresConfirmation) {
        // Show confirmation dialog with preview data
        const confirmed = window.confirm(
          `${result.previewData.preview_message}\n\nDo you want to proceed?`
        );
        
        if (confirmed) {
          // Proceed with the actual change
          const finalResult = await handlePlanPurchase(planName, billingCycle, true);
          if (finalResult?.success) {
            // Show success message or refresh
            window.location.reload();
          }
        }
      } else if (result?.success) {
        // Show success message or refresh
        window.location.reload();
      }
    } catch (error) {
      console.error('Plan change error:', error);
      // Error is already handled in the hook
    }
  };

  const handleContactUs = () => {
    window.open('mailto:hey@buzzberry.io', '_blank');
  };

  const handleManageBilling = async () => {
    try {
      setError(null);
      
      // Use the customer portal API to get the proper portal URL
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to access billing portal');
      }

      const { url } = await response.json();
      
      if (url) {
        window.open(url, '_blank');
      } else {
        throw new Error('No billing portal URL received');
      }
    } catch (err) {
      console.error('Billing portal error:', err);
      setError(err instanceof Error ? err.message : 'Failed to access billing portal');
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-[1000px] mx-4 sm:mx-6 lg:mx-8 h-[calc(90vh-40px)] sm:h-[calc(85vh-40px)] bg-[#0f1419] rounded-2xl shadow-lg overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 text-[#9ca3af] hover:text-[#f9fafb] hover:bg-[#2a3441] rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Settings Content */}
        <div className="h-full overflow-y-auto custom-scrollbar">
          <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center mb-4 sm:mb-6">
              <img src="/SettingsIconUnselected.svg" alt="Settings" className="w-6 h-6 lg:w-7 lg:h-7 mr-3" />
              <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold text-[#f9fafb]">Settings</h1>
            </div>

            {/* Top Navigation */}
            <div className="bg-[#1a1f2e] rounded-2xl shadow-sm border border-[#374151] p-2">
              <nav className="flex flex-wrap gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2.5 lg:px-6 lg:py-3 rounded-xl font-medium transition-all duration-200 text-sm lg:text-base whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-[#6C40E4] text-white shadow-md'
                        : 'text-[#9ca3af] hover:text-[#f9fafb] hover:bg-[#2a3441]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Error Display */}
          {(error || userPreferences.error || passwordChange.error) && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <p className="text-red-400 text-sm">{error || userPreferences.error || passwordChange.error}</p>
                <button 
                  onClick={() => {
                    setError(null);
                    // Note: userPreferences.error and passwordChange.error are managed by their respective hooks
                  }}
                  className="ml-auto text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="bg-[#1a1f2e] rounded-xl sm:rounded-2xl shadow-sm border border-[#374151] p-4 sm:p-6 lg:p-8 min-h-[500px]">
            {/* My Plan */}
            {activeTab === 'my-plan' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg sm:text-xl lg:text-xl font-bold text-[#f9fafb] mb-2">My Plan</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <p className="text-sm sm:text-base text-[#9ca3af] flex-1">
                      {userPreferences.usageStats ? (
                        <>
                          Your next refill of <span className="font-semibold">{userPreferences.usageStats.limits.exports.toLocaleString()}</span> exports and <span className="font-semibold">{userPreferences.usageStats.limits.imports.toLocaleString()}</span> imports is due on{' '}
                          <span className="font-semibold underline">{new Date(userPreferences.usageStats.usage_reset_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>.
                        </>
                      ) : (
                        'Loading plan information...'
                      )}
                    </p>
                                        <button
                      onClick={handleManageBilling}
                      className="flex items-center justify-center sm:justify-start px-4 py-2 bg-[#2a3441] text-[#f9fafb] rounded-xl hover:bg-[#374151] transition-colors font-medium text-sm whitespace-nowrap"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Manage billing
                    </button>
                  </div>
                </div>

                {/* Plan Info Card */}
                <div className="bg-gradient-to-b from-black/50 to-[#292929]/70 rounded-[2.5rem] p-6 sm:p-8 mb-6">
                  {/* User Info - Top Left */}
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-[#6C40E4] rounded-full flex items-center justify-center mr-3">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <h3 
                      className="text-base sm:text-lg font-bold leading-none"
                      style={{
                        background: 'linear-gradient(131deg, rgb(255, 255, 255), rgb(53, 53, 53))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        color: 'rgb(241, 239, 237)'
                      }}
                    >
                      {userPreferences.preferences?.subscription_plan ? 
                        userPreferences.preferences.subscription_plan.charAt(0).toUpperCase() + userPreferences.preferences.subscription_plan.slice(1) + ' plan' : 
                        'Loading...'
                      }
                    </h3>
        </div>

                  {/* Usage Stats */}
                  <div className="space-y-6">
                    {userPreferences.usageStats ? (
                      <>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-sm text-[#9ca3af]">Monthly imports left</div>
                            <div className="whitespace-nowrap">
                              <span className="text-xl sm:text-2xl font-bold text-white leading-none">
                                {(userPreferences.usageStats.limits.imports - userPreferences.usageStats.monthly_imports_used).toLocaleString()}
                              </span>
                              <span className="text-base sm:text-lg text-[#9ca3af] font-normal"> / {userPreferences.usageStats.limits.imports.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="w-full bg-[#374151] rounded-full h-3 shadow-inner">
                            <div 
                              className="bg-gradient-to-r from-[#10B981] to-[#34D399] h-3 rounded-full transition-all duration-300"
                              style={{ width: `${userPreferences.usageStats ? Math.min((userPreferences.usageStats.monthly_imports_used / userPreferences.usageStats.limits.imports) * 100, 100) : 0}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-sm text-[#9ca3af]">Monthly exports left</div>
                            <div className="whitespace-nowrap">
                              <span className="text-xl sm:text-2xl font-bold text-white leading-none">
                                {(userPreferences.usageStats.limits.exports - userPreferences.usageStats.monthly_exports_used).toLocaleString()}
                              </span>
                              <span className="text-base sm:text-lg text-[#9ca3af] font-normal"> / {userPreferences.usageStats.limits.exports.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="w-full bg-[#374151] rounded-full h-3 shadow-inner">
                            <div 
                              className="bg-gradient-to-r from-[#6C40E4] to-[#8B5CF6] h-3 rounded-full transition-all duration-300"
                              style={{ width: `${userPreferences.usageStats ? Math.min((userPreferences.usageStats.monthly_exports_used / userPreferences.usageStats.limits.exports) * 100, 100) : 0}%` }}
                            ></div>
                          </div>
                        </div>
                        {/* AI Searches Usage */}
                        {userPreferences.usageStats.limits.ai_searches !== -1 && (
          <div>
                            <div className="flex justify-between items-center mb-1">
                              <div className="text-sm text-[#9ca3af]">Monthly AI searches left</div>
                              <div className="whitespace-nowrap">
                                <span className="text-xl sm:text-2xl font-bold text-white leading-none">
                                  {(userPreferences.usageStats.limits.ai_searches - userPreferences.usageStats.monthly_ai_searches_used).toLocaleString()}
                                </span>
                                <span className="text-base sm:text-lg text-[#9ca3af] font-normal"> / {userPreferences.usageStats.limits.ai_searches.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="w-full bg-[#374151] rounded-full h-3 shadow-inner">
                              <div 
                                className="bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] h-3 rounded-full transition-all duration-300"
                                style={{ width: `${userPreferences.usageStats ? Math.min((userPreferences.usageStats.monthly_ai_searches_used / userPreferences.usageStats.limits.ai_searches) * 100, 100) : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-2 border-[#6C40E4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-[#9ca3af] text-sm">Loading usage statistics...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upgrade Section */}
                <div className="bg-gradient-to-b from-black/50 to-[#292929]/70 rounded-[2.5rem] p-6 sm:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="mb-4 lg:mb-0 flex-1">
                      <h3 
                        className="text-base sm:text-lg font-bold mb-2 leading-none"
                        style={{
                          background: 'linear-gradient(131deg, rgb(255, 255, 255), rgb(53, 53, 53))',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          color: 'rgb(241, 239, 237)'
                        }}
                      >
                        {(() => {
                          const currentPlan = userPreferences.preferences?.subscription_plan || 'starter';
                          const upgradePlan = currentPlan === 'starter' ? 'Pro' : currentPlan === 'pro' ? 'Agency' : null;
                          return upgradePlan ? `Upgrade to ${upgradePlan} Plan` : 'You have the highest plan';
                        })()}
                      </h3>
                      <p className="text-sm sm:text-base text-[#9ca3af] mb-2">
                        {(() => {
                          const currentPlan = userPreferences.preferences?.subscription_plan || 'starter';
                          if (currentPlan === 'agency') {
                            return 'You have the highest tier plan with maximum capacity.';
                          }
                          const upgradeLimits = currentPlan === 'starter' ? 
                            { imports: 2000, exports: 500 } : 
                            { imports: 7500, exports: 2000 };
                          return (
                            <>
                              Get more capacity with <span className="font-semibold">{upgradeLimits.imports.toLocaleString()}</span> imports and <span className="font-semibold">{upgradeLimits.exports.toLocaleString()}</span> exports per month.
                            </>
                          );
                        })()}
                      </p>
                      <button 
                        onClick={() => setActiveTab('pricing')}
                        className="text-[#6C40E4] hover:text-[#8B5CF6] font-medium text-sm sm:text-base"
                      >
                        See all available plans
                      </button>
                    </div>
                    <div className="flex-shrink-0 text-left md:text-left lg:text-right w-full lg:w-auto">
                      <div className="text-left md:text-left lg:text-right mb-3">
                        <div className="text-xl sm:text-2xl font-bold text-white">
                          {(() => {
                            const currentPlan = userPreferences.preferences?.subscription_plan || 'starter';
                            const upgradePrice = currentPlan === 'starter' ? 199 : currentPlan === 'pro' ? 599 : null;
                            return upgradePrice ? `$${upgradePrice}` : 'N/A';
                          })()}
                          <span className="text-sm sm:text-base text-[#9ca3af] font-normal"> per month</span>
                        </div>
                        <div className="text-xs sm:text-sm text-[#9ca3af]">billed monthly</div>
                      </div>
                      {/* Upgrade Plan Button */}
                      {(() => {
                        const currentPlan = userPreferences.preferences?.subscription_plan || 'starter';
                        if (currentPlan === 'agency') {
                          return (
                            <div className="w-full lg:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-[#374151] text-[#9ca3af] rounded-xl font-semibold text-sm sm:text-base text-center">
                              Highest plan
                            </div>
                          );
                        }
                        return (
                          <button 
                            onClick={() => setShowUpgradeModal(true)}
                            className="w-full lg:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-500 hover:to-blue-500 hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 font-semibold text-sm sm:text-base"
                          >
                            Upgrade plan
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </div>
            </div>
            )}

            {/* AI Preferences */}
            {activeTab === 'ai-preferences' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg sm:text-xl lg:text-xl font-bold text-[#f9fafb] mb-2">AI Matching Preferences</h2>
                  <p className="text-sm sm:text-base text-[#9ca3af]">Configure your AI matching preferences to get better creator recommendations.</p>
                </div>
                
                <div className="space-y-8">
                  {/* Niches */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-[#f9fafb] mb-3">Preferred Niches</h3>
                    <p className="text-sm sm:text-base text-[#9ca3af] mb-4">Select the niches you're most interested in for creator partnerships.</p>
                    {nichesLoading ? (
                      <div className="flex flex-wrap gap-2">
                        {[...Array(12)].map((_, index) => (
                          <div
                            key={index}
                            className="h-9 bg-gray-700 rounded-lg animate-pulse"
                            style={{
                              minWidth: '70px',
                              height: '35px'
                            }}
                          />
                        ))}
                      </div>
                    ) : nichesError ? (
                      <div className="text-red-400 text-sm mb-4">
                        Failed to load niches. Please refresh the page.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {niches.map((niche) => (
                          <button
                            key={niche}
                            onClick={() => handleNicheToggle(niche)}
                            disabled={isLoading}
                            className={`transition-all duration-200 ${
                              selectedNiches.includes(niche)
                                ? 'text-[#F9FAFB]'
                                : 'text-[#9ca3af] hover:text-[#F9FAFB]'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            style={{
                              boxSizing: 'border-box',
                              display: 'flex',
                              flexDirection: 'row',
                              justifyContent: 'center',
                              alignItems: 'center',
                              padding: '10px',
                              gap: '10px',
                              minWidth: '70px',
                              height: '35px',
                              backgroundColor: selectedNiches.includes(niche) ? 'rgba(30, 58, 138, 0.5)' : 'rgba(75, 85, 99, 0.5)',
                              border: '1px solid #3B82F6',
                              borderRadius: '10px',
                              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                              fontStyle: 'normal',
                              fontWeight: 500,
                              fontSize: '15px',
                              lineHeight: '100%'
                            }}
                          >
                            {niche}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Target Audience Description */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-[#f9fafb] mb-3">Target Audience Description</h3>
                    <p className="text-sm sm:text-base text-[#9ca3af] mb-4">Describe your target audience to help our AI find the best influencer matches for your campaigns.</p>
                    <textarea
                      value={targetAudienceDescription}
                      onChange={(e) => setTargetAudienceDescription(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-[#374151] bg-[#1a1f2e] text-[#f9fafb] rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] placeholder-[#9ca3af] resize-none"
                      placeholder="Describe your target audience (e.g., 'crypto enthusiasts in the US and Asia between 50k to 10M+ followers')..."
                      disabled={isLoading}
                    />
                    {error && (
                      <div className="mt-2 flex items-center text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {error}
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <div className="pt-6">
                    <button
                      onClick={handleSaveAIPreferences}
                      disabled={isLoading || isRegeneratingAI || !hasPreferencesChanged()}
                      className={`flex items-center px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 ${
                        isLoading || isRegeneratingAI || !hasPreferencesChanged()
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 hover:shadow-2xl hover:shadow-purple-500/25'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                          Saving Preferences...
                        </>
                      ) : isRegeneratingAI ? (
                        <>
                          <div className="w-5 h-5 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                          Regenerating AI Matches...
                        </>
                      ) : aiPrefsSaved ? (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          Preferences Updated
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          Update Preferences
                        </>
                      )}
                    </button>

                  </div>
                </div>
              </div>
            )}

            {/* Change Password */}
            {activeTab === 'password' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg sm:text-xl lg:text-xl font-bold text-[#f9fafb] mb-2">Change Password</h2>
                  <p className="text-sm sm:text-base text-[#9ca3af]">Update your account password to keep your account secure.</p>
                </div>
                
                <PasswordChangeForm 
                  passwords={passwords}
                  setPasswords={setPasswords}
                  showPasswords={showPasswords}
                  setShowPasswords={setShowPasswords}
                  passwordChange={passwordChange}
                  handlePasswordChange={handlePasswordChange}
                />
              </div>
            )}

            {/* Pricing */}
            {activeTab === 'pricing' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg sm:text-xl lg:text-xl font-bold text-[#f9fafb] mb-2">Pricing Plans</h2>
                  <p className="text-sm sm:text-base text-[#9ca3af]">Choose the plan that best fits your creator marketing needs.</p>
                </div>
                
                <div className="space-y-6">
                  {/* Monthly/Annual Toggle */}
                  <div className="flex justify-center">
                                         <div className="bg-[#2a3441] rounded-xl p-1 flex">
                       <button
                         onClick={() => setBillingCycle('monthly')}
                         className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                           billingCycle === 'monthly'
                             ? 'bg-white/20 text-white'
                             : 'text-gray-300 hover:text-white hover:bg-white/10'
                         }`}
                       >
                         Monthly
                       </button>
                       <button
                         onClick={() => setBillingCycle('annual')}
                         className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                           billingCycle === 'annual'
                             ? 'bg-white/20 text-white'
                             : 'text-gray-300 hover:text-white hover:bg-white/10'
                         }`}
                       >
                         Annual
                       </button>
                     </div>
                  </div>

                  {/* Three New Plans - Glassmorphism Design */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    {/* Starter Plan */}
                    <div className={`relative w-full max-w-sm mx-auto lg:max-w-none flex flex-col justify-between p-8 lg:p-10 rounded-[2.5rem] bg-gradient-to-b from-black/50 to-[#292929]/70 shadow-[inset_0_5px_3px_-3px_rgba(255,255,255,0.41),inset_0_4px_20px_-5px_rgb(78,78,78)] backdrop-blur-[15px] hover:backdrop-blur-[20px] transition-all duration-300 min-h-[500px] lg:min-h-[540px] ${isCurrentPlan('starter') ? 'border-2 border-purple-500/60' : ''}`}>
                      {/* Current Plan Badge */}
                      {isCurrentPlan('starter') && (
                        <div className="absolute top-4 left-6 font-mono text-purple-400 text-xs font-medium uppercase">
                          CURRENT PLAN
                        </div>
                      )}
                      {/* Header Section */}
                      <div className="flex flex-col gap-4">
                        {/* Plan Name */}
                        <h3 className="text-xl lg:text-2xl font-medium text-white" style={{WebkitTextStrokeWidth: '0.25px'}}>Starter</h3>
                        
                                                 <div className="flex flex-col gap-1">
                           {/* Pricing with Gradient Text */}
                           <div className="flex items-baseline gap-1">
                             <span 
                               className="text-3xl lg:text-4xl font-semibold leading-none"
                               style={{
                                 background: 'linear-gradient(131deg, rgb(255, 255, 255), rgb(53, 53, 53))',
                                 WebkitBackgroundClip: 'text',
                                 WebkitTextFillColor: 'transparent',
                                 backgroundClip: 'text',
                                 color: 'rgb(241, 239, 237)'
                               }}
                             >
                               ${billingCycle === 'monthly' ? '149' : '134'}
                             </span>
                             <span className="text-[#666666] text-sm">/month</span>
                           </div>
                          {billingCycle === 'annual' && (
                            <div className="mt-1">
                              <p className="text-xs text-gray-300">billed annually</p>
                              <p className="text-xs text-green-300 font-medium">
                                Save $180/year
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Features Section */}
                      <div className="flex flex-col gap-4 flex-1 justify-center">
                                                 <ul className="flex flex-col gap-1.5 list-none pl-0 w-full">
                           <li className="flex items-center py-1 text-gray-300 text-xs leading-relaxed">
                             <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                             <span>Search over 80k influencers</span>
                           </li>
                           <li className="flex items-center py-1 text-gray-300 text-xs leading-relaxed">
                             <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                             <span>Import & track 100 influencers</span>
                           </li>
                           <li className="flex items-center py-1 text-gray-300 text-xs leading-relaxed">
                             <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                             <span>Export up to 50 profiles</span>
                           </li>
                           <li className="flex items-center py-1 text-gray-300 text-xs leading-relaxed">
                             <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                             <span>Limited AI searches</span>
                           </li>
                           <li className="flex items-center py-1 text-gray-300 text-xs leading-relaxed">
                             <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                             <span>Weekly data refresh</span>
                           </li>
                         </ul>
                      </div>

                      {/* Footer Section */}
                      <div className="flex flex-col gap-4">
                        {/* 7-day free trial with dividers */}
                        <div className="flex flex-row justify-center items-center gap-3 w-full">
                          <div className="flex-1 h-px bg-gray-600"></div>
                          <span className="text-gray-400 text-xs">7-day free trial</span>
                          <div className="flex-1 h-px bg-gray-600"></div>
                        </div>

                        {/* Button with Webflow styling */}
                        <button
                          onClick={() => handleStartFreeTrial('starter')}
                          disabled={stripeLoading || isCurrentPlan('starter')}
                          className="relative rounded-[1.125rem] text-white text-base font-medium text-center transition-none shadow-[0_16px_20px_0_rgba(0,0,0,0.4)] active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                          <div className="relative overflow-hidden py-4 px-6 border border-[#707070] rounded-[1.125rem] bg-transparent shadow-[inset_0_0_7px_0_rgba(255,255,255,0.28)] group-hover:shadow-[inset_0_0_10px_0_rgba(147,51,234,0.3)] group-hover:border-purple-400/60 transition-all duration-200">
                            {stripeLoading ? 'Processing...' : isCurrentPlan('starter') ? 'Current Plan' : 'Try for Free'}
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Pro Plan - Most Popular */}
                    <div className={`relative w-full max-w-sm mx-auto lg:max-w-none flex flex-col justify-between p-6 lg:p-8 rounded-[2.5rem] bg-gradient-to-b from-black/50 to-[#292929]/70 shadow-[inset_0_5px_3px_-3px_rgba(255,255,255,0.41),inset_0_4px_20px_-5px_rgb(78,78,78)] backdrop-blur-[15px] hover:backdrop-blur-[20px] transition-all duration-300 border border-purple-500/40 min-h-[480px] lg:min-h-[520px] ${isCurrentPlan('pro') ? 'border-2 border-purple-500/60' : ''}`}>
                      {/* Most Popular Badge - Top Right */}
                      <div className="absolute top-4 right-6 font-mono text-[#b6b6b6] text-xs font-medium uppercase">
                        MOST POPULAR
                      </div>
                      {/* Current Plan Badge - Top Left */}
                      {isCurrentPlan('pro') && (
                        <div className="absolute top-4 left-6 font-mono text-purple-400 text-xs font-medium uppercase">
                          CURRENT PLAN
                        </div>
                      )}
                      
                      {/* Header Section */}
                      <div className="flex flex-col gap-4 pt-2">
                        {/* Plan Name */}
                        <h3 className="text-xl lg:text-2xl font-medium text-white" style={{WebkitTextStrokeWidth: '0.25px'}}>Pro</h3>
                        
                                                 <div className="flex flex-col gap-1">
                           {/* Pricing with Gradient Text */}
                           <div className="flex items-baseline gap-1">
                             <span 
                               className="text-3xl lg:text-4xl font-semibold leading-none"
                               style={{
                                 background: 'linear-gradient(131deg, rgb(255, 255, 255), rgb(53, 53, 53))',
                                 WebkitBackgroundClip: 'text',
                                 WebkitTextFillColor: 'transparent',
                                 backgroundClip: 'text',
                                 color: 'rgb(241, 239, 237)'
                               }}
                             >
                               ${billingCycle === 'monthly' ? '199' : '179'}
                             </span>
                             <span className="text-[#666666] text-sm">/month</span>
                           </div>
                          {billingCycle === 'annual' && (
                            <div className="mt-1">
                              <p className="text-xs text-gray-300">billed annually</p>
                              <p className="text-xs text-green-300 font-medium">
                                Save $240/year
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Features Section */}
                      <div className="flex flex-col gap-4 flex-1 justify-center">
                                                 <ul className="flex flex-col gap-1.5 list-none pl-0 w-full">
                           <li className="flex items-center py-1 text-gray-300 text-xs leading-relaxed">
                             <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                             <span>Search over 80k influencers</span>
                           </li>
                           <li className="flex items-center py-1 text-gray-300 text-xs leading-relaxed">
                             <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                             <span>Import & track 2,000 influencers</span>
                           </li>
                           <li className="flex items-center py-1 text-gray-300 text-xs leading-relaxed">
                             <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                             <span>Export up to 500 profiles</span>
                           </li>
                           <li className="flex items-center py-1 text-gray-300 text-xs leading-relaxed">
                             <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                             <span>Unlimited AI Searches</span>
                           </li>
                           <li className="flex items-center py-1 text-gray-300 text-xs leading-relaxed">
                             <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                             <span>Weekly data refresh</span>
                           </li>
                         </ul>
                      </div>

                      {/* Footer Section */}
                      <div className="flex flex-col gap-4">
                        {/* 7-day free trial with dividers */}
                        <div className="flex flex-row justify-center items-center gap-3 w-full">
                          <div className="flex-1 h-px bg-gray-600"></div>
                          <span className="text-gray-400 text-xs">7-day free trial</span>
                          <div className="flex-1 h-px bg-gray-600"></div>
                        </div>

                        {/* Button with Webflow styling */}
                        <button
                          onClick={() => handleStartFreeTrial('pro')}
                          disabled={stripeLoading || isCurrentPlan('pro')}
                          className="relative rounded-[1.125rem] text-white text-base font-medium text-center transition-none shadow-[0_16px_20px_0_rgba(0,0,0,0.4)] active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                          <div className="relative overflow-hidden py-4 px-6 border border-[#707070] rounded-[1.125rem] bg-transparent shadow-[inset_0_0_7px_0_rgba(255,255,255,0.28)] group-hover:shadow-[inset_0_0_10px_0_rgba(147,51,234,0.3)] group-hover:border-purple-400/60 transition-all duration-200">
                            {stripeLoading ? 'Processing...' : isCurrentPlan('pro') ? 'Current Plan' : 'Try for Free'}
                          </div>
                        </button>
            </div>
          </div>

                    {/* Agency Plan */}
                    <div className={`relative w-full max-w-sm mx-auto lg:max-w-none flex flex-col justify-between p-8 lg:pr-8 rounded-[2.5rem] bg-gradient-to-b from-black/50 to-[#292929]/70 shadow-[inset_0_5px_3px_-3px_rgba(255,255,255,0.41),inset_0_4px_20px_-5px_rgb(78,78,78)] backdrop-blur-[15px] hover:backdrop-blur-[20px] transition-all duration-300 min-h-[500px] lg:min-h-[540px] ${isCurrentPlan('agency') ? 'border-2 border-purple-500/60' : ''}`}>
                      {/* Current Plan Badge */}
                      {isCurrentPlan('agency') && (
                        <div className="absolute top-4 left-6 font-mono text-purple-400 text-xs font-medium uppercase">
                          CURRENT PLAN
                        </div>
                      )}
                      {/* Header Section */}
                      <div className="flex flex-col gap-4">
                        {/* Plan Name */}
                        <h3 className="text-xl lg:text-2xl font-medium text-white" style={{WebkitTextStrokeWidth: '0.25px'}}>Agency</h3>
                        
                                                 <div className="flex flex-col gap-1">
                           {/* Pricing with Gradient Text */}
                           <div className="flex items-baseline gap-1">
                             <span 
                               className="text-3xl lg:text-4xl font-semibold leading-none"
                               style={{
                                 background: 'linear-gradient(131deg, rgb(255, 255, 255), rgb(53, 53, 53))',
                                 WebkitBackgroundClip: 'text',
                                 WebkitTextFillColor: 'transparent',
                                 backgroundClip: 'text',
                                 color: 'rgb(241, 239, 237)'
                               }}
                             >
                               ${billingCycle === 'monthly' ? '599' : '539'}
                             </span>
                             <span className="text-[#666666] text-sm">/month</span>
                           </div>
                          {billingCycle === 'annual' && (
                            <div className="mt-1">
                              <p className="text-xs text-gray-300">billed annually</p>
                              <p className="text-xs text-green-300 font-medium">
                                Save $720/year
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Features Section */}
                      <div className="flex flex-col gap-4 flex-1 justify-center">
                                                 <ul className="flex flex-col gap-1.5 list-none pl-0 w-full">
                           <li className="flex items-center py-1 text-gray-300 text-xs leading-relaxed">
                             <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                             <span>Search over 80k influencers</span>
                           </li>
                           <li className="flex items-center py-1 text-gray-300 text-xs leading-relaxed">
                             <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                             <span>Import & track 7,500 influencers</span>
                           </li>
                           <li className="flex items-center py-1 text-gray-300 text-xs leading-relaxed">
                             <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                             <span>Export up to 2,000 profiles</span>
                           </li>
                           <li className="flex items-center py-1 text-gray-300 text-xs leading-relaxed">
                             <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                             <span>Unlimited AI Searches</span>
                           </li>
                           <li className="flex items-center py-1 text-gray-300 text-xs leading-relaxed">
                             <div className="w-4 h-4 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                             <span>Data refresh every 72 hours</span>
                           </li>
                         </ul>
                      </div>

                      {/* Footer Section */}
                      <div className="flex flex-col gap-4">
                        {/* 7-day free trial with dividers */}
                        <div className="flex flex-row justify-center items-center gap-3 w-full">
                          <div className="flex-1 h-px bg-gray-600"></div>
                          <span className="text-gray-400 text-xs">7-day free trial</span>
                          <div className="flex-1 h-px bg-gray-600"></div>
                        </div>

                        {/* Button with Webflow styling */}
                        <button
                          onClick={() => handleStartFreeTrial('agency')}
                          disabled={stripeLoading || isCurrentPlan('agency')}
                          className="relative rounded-[1.125rem] text-white text-base font-medium text-center transition-none shadow-[0_16px_20px_0_rgba(0,0,0,0.4)] active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                          <div className="relative overflow-hidden py-4 px-6 border border-[#707070] rounded-[1.125rem] bg-transparent shadow-[inset_0_0_7px_0_rgba(255,255,255,0.28)] group-hover:shadow-[inset_0_0_10px_0_rgba(147,51,234,0.3)] group-hover:border-purple-400/60 transition-all duration-200">
                            {stripeLoading ? 'Processing...' : isCurrentPlan('agency') ? 'Current Plan' : 'Try for Free'}
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                                     {/* Enterprise Plan - Simple Text */}
                   <div className="text-center mt-8">
                     <p className="text-[#a9a9a9] font-medium text-base lg:text-lg">
                       For added tracking & higher usage limits contact us for the <span className="text-white underline cursor-pointer hover:text-gray-200 transition-colors" onClick={handleContactUs}>Enterprise Plan</span>
                     </p>
            </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Upgrade Plan Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl mx-4 sm:mx-6 lg:mx-8 max-h-[90vh] bg-[#0f1419] rounded-2xl shadow-lg overflow-hidden">
              {/* Close Button */}
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 text-[#9ca3af] hover:text-[#f9fafb] hover:bg-[#2a3441] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 lg:p-8 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#f9fafb] mb-6 sm:mb-8 pr-8">Update Subscription</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  {/* Left Side - Selected Plan */}
                <div>
                    <h3 className="text-base sm:text-lg font-semibold text-[#f9fafb] mb-4 sm:mb-6">Selected plan</h3>
                    
                    <div className="mb-4 sm:mb-6">
                      <h4 
                        className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 leading-none"
                        style={{
                          background: 'linear-gradient(131deg, rgb(255, 255, 255), rgb(53, 53, 53))',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          color: 'rgb(241, 239, 237)'
                        }}
                      >
                        {(() => {
                          const currentPlan = userPreferences.preferences?.subscription_plan || 'starter';
                          const upgradePlan = currentPlan === 'starter' ? 'Pro' : currentPlan === 'pro' ? 'Agency' : 'Agency';
                          return upgradePlan;
                        })()}
                      </h4>
                      <p className="text-[#9ca3af] text-base sm:text-lg mb-4 sm:mb-6">
                        {(() => {
                          const currentPlan = userPreferences.preferences?.subscription_plan || 'starter';
                          const upgradeLimits = currentPlan === 'starter' ? 
                            { imports: 2000, exports: 500 } : 
                            { imports: 7500, exports: 2000 };
                          return `${upgradeLimits.imports.toLocaleString()} influencers tracking capacity`;
                        })()}
                      </p>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <h5 className="text-sm sm:text-base font-semibold text-[#f9fafb]">You get:</h5>
                      
                      <div className="flex items-center">
                        <div className="w-5 h-5 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                        <span className="text-xs sm:text-sm text-[#9ca3af]">Search over 80k influencers</span>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-5 h-5 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                        <span className="text-xs sm:text-sm text-[#9ca3af]">
                          {(() => {
                            const currentPlan = userPreferences.preferences?.subscription_plan || 'starter';
                            const upgradeLimits = currentPlan === 'starter' ? 
                              { imports: 2000, exports: 500 } : 
                              { imports: 7500, exports: 2000 };
                            return `Import & track ${upgradeLimits.imports.toLocaleString()} influencers`;
                          })()}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-5 h-5 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                        <span className="text-xs sm:text-sm text-[#9ca3af]">
                          {(() => {
                            const currentPlan = userPreferences.preferences?.subscription_plan || 'starter';
                            const upgradeLimits = currentPlan === 'starter' ? 
                              { imports: 2000, exports: 500 } : 
                              { imports: 7500, exports: 2000 };
                            return `Export up to ${upgradeLimits.exports.toLocaleString()} profiles`;
                          })()}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-5 h-5 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                        <span className="text-xs sm:text-sm text-[#9ca3af]">Unlimited AI Searches</span>
                </div>
                      
                      <div className="flex items-center">
                        <div className="w-5 h-5 mr-3 flex-shrink-0 bg-[url('/icons/PricingCheckIcon.svg')] bg-no-repeat bg-center bg-contain"></div>
                        <span className="text-xs sm:text-sm text-[#9ca3af]">Data refresh every 72 hours</span>
              </div>
            </div>
          </div>

                  {/* Right Side - Upgrade Summary */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-[#f9fafb] mb-4 sm:mb-6">Your upgrade summary</h3>
                    
                    <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-sm sm:text-base text-[#9ca3af] flex-1">What you will pay now</span>
                        <span className="font-semibold text-[#f9fafb] text-sm sm:text-base whitespace-nowrap">
                          {(() => {
                            const currentPlan = userPreferences.preferences?.subscription_plan || 'starter';
                            const upgradePlan = currentPlan === 'starter' ? 'pro' : 'agency';
                            const plan = plans.find(p => p.id === upgradePlan);
                            const price = billingCycle === 'monthly' ? plan?.monthlyPrice : plan?.annualPrice;
                            return `$${price}.00`;
                          })()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="text-sm sm:text-base text-[#9ca3af]">
                            {billingCycle === 'monthly' ? 'What you will pay monthly starting' : 'What you will pay annually starting'}
                          </div>
                          <div className="text-xs sm:text-sm text-[#9ca3af]">February 15th</div>
                        </div>
                        <span className="font-semibold text-[#f9fafb] text-sm sm:text-base whitespace-nowrap">
                          {(() => {
                            const currentPlan = userPreferences.preferences?.subscription_plan || 'starter';
                            const upgradePlan = currentPlan === 'starter' ? 'pro' : 'agency';
                            const plan = plans.find(p => p.id === upgradePlan);
                            const price = billingCycle === 'monthly' ? plan?.monthlyPrice : plan?.annualPrice;
                            return `$${price}.00`;
                          })()}
                        </span>
                      </div>
          </div>

                    <div className="mb-4 sm:mb-6">
                      <label className="block text-xs sm:text-sm font-medium text-[#f9fafb] mb-2">
                        Billing cycle
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setBillingCycle('monthly')}
                          className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                            billingCycle === 'monthly'
                              ? 'bg-[#6C40E4] text-white'
                              : 'bg-[#2a3441] text-[#9ca3af] hover:text-white hover:bg-[#374151]'
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          onClick={() => setBillingCycle('annual')}
                          className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                            billingCycle === 'annual'
                              ? 'bg-[#6C40E4] text-white'
                              : 'bg-[#2a3441] text-[#9ca3af] hover:text-white hover:bg-[#374151]'
                          }`}
                        >
                          Annual (Save 10%)
                        </button>
                      </div>
                    </div>

                    <div className="mb-4 sm:mb-6">
                      <label className="block text-xs sm:text-sm font-medium text-[#f9fafb] mb-2">
                        Promo code (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your promo code"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-[#374151] bg-[#1a1f2e] text-[#f9fafb] rounded-xl focus:ring-2 focus:ring-[#6C40E4] focus:border-[#6C40E4] placeholder-[#9ca3af] text-sm sm:text-base"
                      />
                    </div>

                    <div className="mb-4 sm:mb-6">
                      <p className="text-xs sm:text-sm text-[#9ca3af] text-center leading-relaxed">
                        By confirming your new plan, you agree to Buzzberry's{' '}
                        <a href="#" className="text-[#6C40E4] hover:text-[#8B5CF6] underline">Terms of service</a>
                        {' '}and{' '}
                        <a href="#" className="text-[#6C40E4] hover:text-[#8B5CF6] underline">Privacy policy</a>
                      </p>
                    </div>

                    {/* Confirm Upgrade Button */}
                    <button
                      onClick={async () => {
                        const currentPlan = userPreferences.preferences?.subscription_plan || 'starter';
                        const upgradePlan = currentPlan === 'starter' ? 'pro' : 'agency';
                        
                        try {
                          const result = await handlePlanPurchase(upgradePlan, billingCycle);
                          
                          if (result?.requiresConfirmation) {
                            // Show confirmation dialog with preview data
                            const confirmed = window.confirm(
                              `${result.previewData.preview_message}\n\nDo you want to proceed?`
                            );
                            
                            if (confirmed) {
                              // Proceed with the actual change
                              const finalResult = await handlePlanPurchase(upgradePlan, billingCycle, true);
                              if (finalResult?.success) {
                                setShowUpgradeModal(false);
                                // Show success message or refresh
                                window.location.reload();
                              }
                            }
                          } else if (result?.success) {
                            setShowUpgradeModal(false);
                            // Show success message or refresh
                            window.location.reload();
                          }
                        } catch (error) {
                          console.error('Upgrade error:', error);
                          // Error is already handled in the hook
                        }
                      }}
                      disabled={stripeLoading}
                      className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-500 hover:to-blue-500 hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 font-semibold text-sm sm:text-base lg:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {stripeLoading ? 'Processing...' : 'Confirm upgrade'}
                    </button>
                  </div>
                </div>
            </div>
            </div>
          </div>
        )}

        {/* Custom Scrollbar Styles - moved to globals.css */}
      </div>
    </div>
  );
}