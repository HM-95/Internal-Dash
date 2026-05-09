// Database types and interfaces

export interface SocialMedia {
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter';
  username: string;
  url: string;
}

// Raw database schema type (matches the actual database structure)
export interface RawCreator {
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
  recent_post_1: any;
  recent_post_2: any;
  recent_post_3: any;
  recent_post_4: any;
  recent_post_5: any;
  recent_post_6: any;
  recent_post_7: any;
  recent_post_8: any;
  recent_post_9: any;
  recent_post_10: any;
  recent_post_11: any;
  recent_post_12: any;
  paid_ad_placements: boolean;
  created_at: string;
  average_likes: any;
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
}

export interface Creator {
  id: string;
  profile_pic?: string;
  match_score?: number;
  buzz_score: number;
  username: string;
  username_tag?: string;
  social_media: SocialMedia[];
  bio: string;
  followers: number;
  followers_change?: number;
  followers_change_type?: 'positive' | 'negative';
  engagement: number;
  engagement_change?: number;
  engagement_change_type?: 'positive' | 'negative';
  avg_views: number;
  avg_views_change?: number;
  avg_views_change_type?: 'positive' | 'negative';
  avg_likes?: number;
  avg_likes_change?: number;
  avg_likes_change_type?: 'positive' | 'negative';
  avg_comments?: number;
  avg_comments_change?: number;
  avg_comments_change_type?: 'positive' | 'negative';
  niches: Array<{ name: string; type: 'primary' | 'secondary' }>;
  hashtags?: string[];
  thumbnails: string[];
  expanded_thumbnails?: string[];
  share_urls?: string[]; // URLs for TikTok posts
  location?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

// Alias for backward compatibility
export type Influencer = Creator;

export interface Niche {
  id: string;
  name: string;
  created_at: string;
}

export interface CreatorMetrics {
  total_creators: number;
  avg_followers: number;
  avg_views: number;
  avg_engagement: number;
  change_percentage: number;
  change_type: 'positive' | 'negative';
}

export interface DatabaseFilters {
  niches?: string[];
  platforms?: string[];
  match_scores?: string[];
  buzz_scores?: string[];
  followers_min?: number;
  followers_max?: number;
  engagement_min?: number;
  engagement_max?: number;
  avg_views_min?: number;
  avg_views_max?: number;
  locations?: string[];
  email_required?: boolean;
}

export interface CampaignRecommendation {
  id: string;
  sessionId: string;
  influencerIds: string[];
  chatContext: string;
  estimatedReach: number;
  estimatedEngagementRate: number;
  budgetRange: {
    min: number;
    max: number;
    currency: string;
  };
  created_at: string;
  updated_at: string;
}

export interface InfluencerSearchFilters {
  niches?: string[];
  platforms?: string[];
  followers_min?: number;
  followers_max?: number;
  engagement_min?: number;
  engagement_max?: number;
  locations?: string[];
}

export interface UserList {
  id: string;
  name: string;
  description?: string;
  creator_ids: string[];
  created_at: string;
  updated_at: string;
}

export type CreatorListMode = 'ai' | 'all';
export type ViewMode = 'cards' | 'list';
export type SortField = 'match_score' | 'followers' | 'avg_views' | 'engagement';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: SortField | null;
  direction: SortDirection;
} 