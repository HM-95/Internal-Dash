// User Preferences Types
export interface UserPreferences {
  id: string;
  user_id: string;
  selected_niches: string[];
  target_audience_description: string | null;
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  monthly_imports_used: number;
  monthly_exports_used: number;
  monthly_ai_searches_used: number;
  usage_reset_date: string;
  created_at: string;
  updated_at: string;
}

export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'agency';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing';

// Available niches for selection
export const AVAILABLE_NICHES = [
  'Technology',
  'Fashion',
  'Beauty',
  'Fitness',
  'Food',
  'Travel',
  'Lifestyle',
  'Business',
  'Finance',
  'Education',
  'Entertainment',
  'Gaming',
  'Sports',
  'Health',
  'Parenting',
  'DIY/Crafts',
  'Automotive',
  'Real Estate',
  'Pets',
  'Comedy',
  'Music',
  'Art',
  'Photography',
  'Science',
  'Politics',
  'News',
  'Religion',
  'Spirituality',
  'Environment',
  'Social Issues'
] as const;

export type AvailableNiche = typeof AVAILABLE_NICHES[number];

// Subscription plan limits based on actual pricing tiers
export const SUBSCRIPTION_LIMITS = {
  free: {
    monthly_imports: 0,
    monthly_exports: 0,
    monthly_ai_searches: 0, // No access for free users
    price: 0,
    data_refresh: 'none'
  },
  starter: {
    monthly_imports: 100,
    monthly_exports: 50,
    monthly_ai_searches: 10, // Limited AI searches
    price: 149,
    data_refresh: 'weekly'
  },
  pro: {
    monthly_imports: 2000,
    monthly_exports: 500,
    monthly_ai_searches: -1, // Unlimited AI searches
    price: 199,
    data_refresh: 'weekly'
  },
  agency: {
    monthly_imports: 7500,
    monthly_exports: 2000,
    monthly_ai_searches: -1, // Unlimited AI searches
    price: 599,
    data_refresh: '72_hours'
  }
} as const;

// Default user preferences
export const DEFAULT_USER_PREFERENCES: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  selected_niches: [],
  target_audience_description: null,
  subscription_plan: 'free',
  subscription_status: 'active',
  stripe_customer_id: null,
  stripe_subscription_id: null,
  trial_start_date: null,
  trial_end_date: null,
  onboarding_completed: false,
  onboarding_completed_at: null,
  monthly_imports_used: 0,
  monthly_exports_used: 0,
  monthly_ai_searches_used: 0,
  usage_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
};

// API request/response types
export interface CreateUserPreferencesRequest {
  selected_niches: string[];
  target_audience_description: string;
}

export interface UpdateUserPreferencesRequest {
  selected_niches?: string[];
  target_audience_description?: string;
}

export interface UserPreferencesResponse {
  success: boolean;
  data?: UserPreferences;
  error?: string;
}

// Usage tracking types
export interface UsageStats {
  monthly_imports_used: number;
  monthly_exports_used: number;
  monthly_ai_searches_used: number;
  usage_reset_date: string;
  limits: {
    imports: number;
    exports: number;
    ai_searches: number;
  };
  usage_percentages: {
    imports: number;
    exports: number;
    ai_searches: number;
  };
}
