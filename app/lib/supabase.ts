import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
/** Non-secret anon key must come from env at runtime; placeholder is invalid on purpose for local builds. */
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'set-NEXT_PUBLIC_SUPABASE_ANON_KEY-in-env';

export const supabase = createClient(supabaseUrl, supabaseAnonKey) as SupabaseClient;

// Database types matching your exact Supabase schema
export type Database = {
  public: {
    Tables: {
      healthwellness: {
        Row: {
          id: string;
          uuid: string;
          handle: string;
          display_name: string;
          profile_url: string;
          profile_image_url: string;
          bio: string;
          platform: string;
          location: string;
          location_region: string;
          primary_wellness_niche: string;
          secondary_wellness_niche: string;
          wellness_specialties: string[];
          target_audience: string;
          health_credentials: string[];
          certifications: string[];
          years_experience: number;
          followers_count: number;
          followers_change: number;
          followers_change_type: string;
          average_views: number;
          average_views_change: number;
          average_views_change_type: string;
          average_comments: number;
          average_comments_change: number;
          average_comments_change_type: string;
          average_likes: any; // JSONB
          average_likes_change: number;
          average_likes_change_type: string;
          engagement_rate: number;
          engagement_rate_change: number;
          engagement_rate_change_type: string;
          wellness_engagement_score: number;
          content_quality_score: number;
          credibility_score: number;
          buzz_score: number;
          wellness_hashtags: string[];
          content_themes: string[];
          content_frequency: string;
          recent_wellness_post_1: any; // JSONB
          recent_wellness_post_2: any; // JSONB
          recent_wellness_post_3: any; // JSONB
          recent_wellness_post_4: any; // JSONB
          recent_wellness_post_5: any; // JSONB
          recent_wellness_post_6: any; // JSONB
          recent_wellness_post_7: any; // JSONB
          recent_wellness_post_8: any; // JSONB
          recent_wellness_post_9: any; // JSONB
          recent_wellness_post_10: any; // JSONB
          recent_wellness_post_11: any; // JSONB
          recent_wellness_post_12: any; // JSONB
          email: string;
          bio_links: string;
          brand_tags: string;
          paid_ad_placements: boolean;
          offers_services: boolean;
          service_types: string[];
          pricing_range: string;
          availability: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          uuid?: string;
          handle: string;
          display_name: string;
          profile_url?: string;
          profile_image_url?: string;
          bio?: string;
          platform: string;
          location?: string;
          location_region?: string;
          primary_wellness_niche: string;
          secondary_wellness_niche?: string;
          wellness_specialties?: string[];
          target_audience?: string;
          health_credentials?: string[];
          certifications?: string[];
          years_experience?: number;
          followers_count?: number;
          followers_change?: number;
          followers_change_type?: string;
          average_views?: number;
          average_views_change?: number;
          average_views_change_type?: string;
          average_comments?: number;
          average_comments_change?: number;
          average_comments_change_type?: string;
          average_likes?: any;
          average_likes_change?: number;
          average_likes_change_type?: string;
          engagement_rate?: number;
          engagement_rate_change?: number;
          engagement_rate_change_type?: string;
          wellness_engagement_score?: number;
          content_quality_score?: number;
          credibility_score?: number;
          buzz_score?: number;
          wellness_hashtags?: string[];
          content_themes?: string[];
          content_frequency?: string;
          recent_wellness_post_1?: any;
          recent_wellness_post_2?: any;
          recent_wellness_post_3?: any;
          recent_wellness_post_4?: any;
          recent_wellness_post_5?: any;
          recent_wellness_post_6?: any;
          recent_wellness_post_7?: any;
          recent_wellness_post_8?: any;
          recent_wellness_post_9?: any;
          recent_wellness_post_10?: any;
          recent_wellness_post_11?: any;
          recent_wellness_post_12?: any;
          email?: string;
          bio_links?: string;
          brand_tags?: string;
          paid_ad_placements?: boolean;
          offers_services?: boolean;
          service_types?: string[];
          pricing_range?: string;
          availability?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          uuid?: string;
          handle?: string;
          display_name?: string;
          profile_url?: string;
          profile_image_url?: string;
          bio?: string;
          platform?: string;
          location?: string;
          location_region?: string;
          primary_wellness_niche?: string;
          secondary_wellness_niche?: string;
          wellness_specialties?: string[];
          target_audience?: string;
          health_credentials?: string[];
          certifications?: string[];
          years_experience?: number;
          followers_count?: number;
          followers_change?: number;
          followers_change_type?: string;
          average_views?: number;
          average_views_change?: number;
          average_views_change_type?: string;
          average_comments?: number;
          average_comments_change?: number;
          average_comments_change_type?: string;
          average_likes?: any;
          average_likes_change?: number;
          average_likes_change_type?: string;
          engagement_rate?: number;
          engagement_rate_change?: number;
          engagement_rate_change_type?: string;
          wellness_engagement_score?: number;
          content_quality_score?: number;
          credibility_score?: number;
          buzz_score?: number;
          wellness_hashtags?: string[];
          content_themes?: string[];
          content_frequency?: string;
          recent_wellness_post_1?: any;
          recent_wellness_post_2?: any;
          recent_wellness_post_3?: any;
          recent_wellness_post_4?: any;
          recent_wellness_post_5?: any;
          recent_wellness_post_6?: any;
          recent_wellness_post_7?: any;
          recent_wellness_post_8?: any;
          recent_wellness_post_9?: any;
          recent_wellness_post_10?: any;
          recent_wellness_post_11?: any;
          recent_wellness_post_12?: any;
          email?: string;
          bio_links?: string;
          brand_tags?: string;
          paid_ad_placements?: boolean;
          offers_services?: boolean;
          service_types?: string[];
          pricing_range?: string;
          availability?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      creatordata: {
        Row: {
          id: string;
          uuid: string;
          handle: string;
          display_name: string;
          profile_url: string;
          profile_image_url: string;
          bio: string;
          platform: string;
          primary_niche: string;
          secondary_niche: string;
          location: string;
          followers_count: number;
          average_views: number;
          average_comments: number;
          engagement_rate: number;
          hashtags: string[];
          email: string;
          recent_post_1: any; // JSONB
          recent_post_2: any; // JSONB
          recent_post_3: any; // JSONB
          recent_post_4: any; // JSONB
          recent_post_5: any; // JSONB
          recent_post_6: any; // JSONB
          recent_post_7: any; // JSONB
          recent_post_8: any; // JSONB
          recent_post_9: any; // JSONB
          recent_post_10: any; // JSONB
          recent_post_11: any; // JSONB
          recent_post_12: any; // JSONB
          paid_ad_placements: boolean;
          created_at: string;
          average_likes: any; // JSONB
          brand_tags: string;
          bio_links: string;
          followers_change: number;
          followers_change_type: string;
          engagement_rate_change: number;
          engagement_rate_change_type: string;
          average_views_change: number;
          average_views_change_type: string;
          average_likes_change: number;
          average_likes_change_type: string;
          average_comments_change: number;
          average_comments_change_type: string;
          buzz_score: number;
        };
        Insert: {
          id?: string;
          uuid?: string;
          handle: string;
          display_name: string;
          profile_url?: string;
          profile_image_url?: string;
          bio?: string;
          platform: string;
          primary_niche?: string;
          secondary_niche?: string;
          location?: string;
          followers_count: number;
          average_views: number;
          average_comments: number;
          engagement_rate: number;
          hashtags?: string[];
          email?: string;
          recent_post_1?: any;
          recent_post_2?: any;
          recent_post_3?: any;
          recent_post_4?: any;
          recent_post_5?: any;
          recent_post_6?: any;
          recent_post_7?: any;
          recent_post_8?: any;
          recent_post_9?: any;
          recent_post_10?: any;
          recent_post_11?: any;
          recent_post_12?: any;
          paid_ad_placements?: boolean;
          created_at?: string;
          average_likes?: any;
          brand_tags?: string;
          bio_links?: string;
          followers_change?: number;
          followers_change_type?: string;
          engagement_rate_change?: number;
          engagement_rate_change_type?: string;
          average_views_change?: number;
          average_views_change_type?: string;
          average_likes_change?: number;
          average_likes_change_type?: string;
          average_comments_change?: number;
          average_comments_change_type?: string;
          buzz_score?: number;
        };
        Update: {
          id?: string;
          uuid?: string;
          handle?: string;
          display_name?: string;
          profile_url?: string;
          profile_image_url?: string;
          bio?: string;
          platform?: string;
          primary_niche?: string;
          secondary_niche?: string;
          location?: string;
          followers_count?: number;
          average_views?: number;
          average_comments?: number;
          engagement_rate?: number;
          hashtags?: string[];
          email?: string;
          recent_post_1?: any;
          recent_post_2?: any;
          recent_post_3?: any;
          recent_post_4?: any;
          recent_post_5?: any;
          recent_post_6?: any;
          recent_post_7?: any;
          recent_post_8?: any;
          recent_post_9?: any;
          recent_post_10?: any;
          recent_post_11?: any;
          recent_post_12?: any;
          paid_ad_placements?: boolean;
          created_at?: string;
          average_likes?: any;
          brand_tags?: string;
          bio_links?: string;
          followers_change?: number;
          followers_change_type?: string;
          engagement_rate_change?: number;
          engagement_rate_change_type?: string;
          average_views_change?: number;
          average_views_change_type?: string;
          average_likes_change?: number;
          average_likes_change_type?: string;
          average_comments_change?: number;
          average_comments_change_type?: string;
          buzz_score?: number;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          selected_niches: string[];
          target_audience_description: string | null;
          subscription_plan: 'free' | 'starter' | 'pro' | 'agency';
          subscription_status: 'active' | 'cancelled' | 'past_due' | 'trialing';
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
        };
        Insert: {
          id?: string;
          user_id: string;
          selected_niches?: string[];
          target_audience_description?: string | null;
          subscription_plan?: 'free' | 'starter' | 'pro' | 'agency';
          subscription_status?: 'active' | 'cancelled' | 'past_due' | 'trialing';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_start_date?: string | null;
          trial_end_date?: string | null;
          onboarding_completed?: boolean;
          onboarding_completed_at?: string | null;
          monthly_imports_used?: number;
          monthly_exports_used?: number;
          monthly_ai_searches_used?: number;
          usage_reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          selected_niches?: string[];
          target_audience_description?: string | null;
          subscription_plan?: 'free' | 'starter' | 'pro' | 'agency';
          subscription_status?: 'active' | 'cancelled' | 'past_due' | 'trialing';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_start_date?: string | null;
          trial_end_date?: string | null;
          onboarding_completed?: boolean;
          onboarding_completed_at?: string | null;
          monthly_imports_used?: number;
          monthly_exports_used?: number;
          monthly_ai_searches_used?: number;
          usage_reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

// Helper type for the transformed creator data
export interface CreatorData {
  id: string;
  profile_pic: string;
  match_score?: number; // This will be calculated/assigned by AI
  buzz_score: number;
  username: string;
  username_tag: string;
  social_media: Array<{
    platform: string;
    username: string;
    url: string;
  }>;
  bio: string;
  followers: number;
  followers_change: number;
  followers_change_type: 'positive' | 'negative';
  engagement: number;
  engagement_change: number;
  engagement_change_type: 'positive' | 'negative';
  avg_views: number;
  avg_views_change: number;
  avg_views_change_type: 'positive' | 'negative';
  avg_likes: number;
  avg_likes_change: number;
  avg_likes_change_type: 'positive' | 'negative';
  avg_comments: number;
  avg_comments_change: number;
  avg_comments_change_type: 'positive' | 'negative';
  niches: string[];
  hashtags: string[];
  thumbnails: string[];
  location: string;
  email: string;
  created_at: string;
  updated_at: string;
} 