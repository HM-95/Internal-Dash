// Health & Wellness Creator Data Types
// Updated types for the healthwellness table and related functionality

export interface HealthWellnessCreator {
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
  
  // Health & Wellness specific fields
  primary_wellness_niche: WellnessNiche;
  secondary_wellness_niche?: WellnessNiche;
  wellness_specialties: WellnessSpecialty[];
  target_audience: TargetAudience;
  health_credentials: HealthCredential[];
  certifications: string[];
  years_experience?: number;
  
  // Social metrics
  followers_count: number;
  followers_change: number;
  followers_change_type: ChangeType;
  average_views: number;
  average_views_change: number;
  average_views_change_type: ChangeType;
  average_comments: number;
  average_comments_change: number;
  average_comments_change_type: ChangeType;
  average_likes: any; // JSONB
  average_likes_change: number;
  average_likes_change_type: ChangeType;
  engagement_rate: number;
  engagement_rate_change: number;
  engagement_rate_change_type: ChangeType;
  
  // Health & Wellness specific metrics
  wellness_engagement_score: number;
  content_quality_score: number;
  credibility_score: number;
  buzz_score: number;
  
  // Content and hashtags
  wellness_hashtags: string[];
  content_themes: ContentTheme[];
  content_frequency: ContentFrequency;
  
  // Recent content
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
  
  // Contact and business info
  email: string;
  bio_links: string;
  brand_tags: string;
  paid_ad_placements: boolean;
  
  // Wellness business info
  offers_services: boolean;
  service_types: ServiceType[];
  pricing_range: PricingRange;
  availability: Availability;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Enums and type definitions
export type WellnessNiche = 
  | 'fitness'
  | 'nutrition'
  | 'mental_health'
  | 'yoga'
  | 'meditation'
  | 'wellness_lifestyle'
  | 'holistic_health'
  | 'sports'
  | 'recovery'
  | 'wellness_business';

export type WellnessSpecialty = 
  | 'weight_loss'
  | 'muscle_building'
  | 'stress_management'
  | 'flexibility'
  | 'mind_body_connection'
  | 'meal_planning'
  | 'nutrition_education'
  | 'mindfulness'
  | 'general_wellness';

export type TargetAudience = 
  | 'beginners'
  | 'intermediate'
  | 'advanced'
  | 'seniors'
  | 'athletes'
  | 'busy_professionals'
  | 'experts';

export type HealthCredential = 
  | 'certified_trainer'
  | 'nutritionist'
  | 'yoga_instructor'
  | 'therapist'
  | 'doctor'
  | 'wellness_practitioner';

export type ContentTheme = 
  | 'workout_routines'
  | 'nutrition_tips'
  | 'mental_health'
  | 'recovery'
  | 'motivation'
  | 'wellness_education';

export type ContentFrequency = 
  | 'daily'
  | 'weekly'
  | 'bi_weekly'
  | 'monthly';

export type ServiceType = 
  | 'personal_training'
  | 'nutrition_coaching'
  | 'wellness_consulting'
  | 'online_courses'
  | 'wellness_coaching';

export type PricingRange = 
  | 'budget'
  | 'mid_range'
  | 'premium'
  | 'luxury';

export type Availability = 
  | 'available'
  | 'limited'
  | 'waitlist'
  | 'not_available';

export type ChangeType = 
  | 'positive'
  | 'negative'
  | 'neutral';

// Health & Wellness specific query filters
export interface HealthWellnessFilters {
  primary_wellness_niche?: WellnessNiche[];
  secondary_wellness_niche?: WellnessNiche[];
  wellness_specialties?: WellnessSpecialty[];
  target_audience?: TargetAudience[];
  health_credentials?: HealthCredential[];
  service_types?: ServiceType[];
  content_themes?: ContentTheme[];
  platform?: string[];
  location?: string[];
  location_region?: string[];
  min_followers?: number;
  max_followers?: number;
  min_engagement_rate?: number;
  max_engagement_rate?: number;
  min_wellness_engagement_score?: number;
  max_wellness_engagement_score?: number;
  min_content_quality_score?: number;
  max_content_quality_score?: number;
  min_credibility_score?: number;
  max_credibility_score?: number;
  min_buzz_score?: number;
  max_buzz_score?: number;
  offers_services?: boolean;
  pricing_range?: PricingRange[];
  availability?: Availability[];
  email_required?: boolean;
}

// Health & Wellness search query
export interface HealthWellnessQuery {
  query?: string;
  filters?: HealthWellnessFilters;
  sort_by?: 'followers_count' | 'engagement_rate' | 'wellness_engagement_score' | 'content_quality_score' | 'credibility_score' | 'buzz_score' | 'created_at';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Health & Wellness recommendation result
export interface HealthWellnessRecommendation {
  id: string;
  healthwellness: HealthWellnessCreator;
  match_score: number;
  wellness_match_score: number;
  content_relevance_score: number;
  credibility_match_score: number;
  engagement_potential_score: number;
  reasoning: string;
}

// Health & Wellness index for semantic search
export interface HealthWellnessIndex {
  id: string;
  healthwellness_id: string;
  handle: string;
  display_name: string;
  bio: string;
  primary_wellness_niche: WellnessNiche;
  secondary_wellness_niche?: WellnessNiche;
  wellness_specialties: WellnessSpecialty[];
  target_audience: TargetAudience;
  followers_count: number;
  average_views: number;
  engagement_rate: number;
  wellness_engagement_score: number;
  content_quality_score: number;
  credibility_score: number;
  buzz_score: number;
  wellness_hashtags: string[];
  content_themes: ContentTheme[];
  recent_wellness_content: string;
  location: string;
  location_region: string;
  platform: string;
  bio_links: string;
  brand_tags: string;
  email: string;
  service_types: ServiceType[];
  health_credentials: HealthCredential[];
  bio_embedding: number[];
  wellness_hashtags_embedding: number[];
  recent_content_embedding: number[];
  created_at: string;
  updated_at: string;
}

// Transformed creator data for frontend display
export interface TransformedHealthWellnessCreator {
  id: string;
  profile_pic: string;
  match_score?: number;
  wellness_match_score?: number;
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
  followers_change_type: ChangeType;
  engagement: number;
  engagement_change: number;
  engagement_change_type: ChangeType;
  wellness_engagement: number;
  content_quality: number;
  credibility: number;
  avg_views: number;
  avg_views_change: number;
  avg_views_change_type: ChangeType;
  avg_likes: number;
  avg_likes_change: number;
  avg_likes_change_type: ChangeType;
  avg_comments: number;
  avg_comments_change: number;
  avg_comments_change_type: ChangeType;
  wellness_niches: WellnessNiche[];
  wellness_specialties: WellnessSpecialty[];
  health_credentials: HealthCredential[];
  service_types: ServiceType[];
  content_themes: ContentTheme[];
  wellness_hashtags: string[];
  thumbnails: string[];
  location: string;
  email: string;
  offers_services: boolean;
  pricing_range: PricingRange;
  availability: Availability;
  created_at: string;
  updated_at: string;
}

// API response types
export interface HealthWellnessAPIResponse {
  success: boolean;
  creators?: TransformedHealthWellnessCreator[];
  total_count?: number;
  page?: number;
  limit?: number;
  has_more?: boolean;
  error?: string;
}

export interface HealthWellnessRecommendationResponse {
  success: boolean;
  recommendations?: HealthWellnessRecommendation[];
  total_count?: number;
  error?: string;
}
