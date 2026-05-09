export interface TagItem {
  name: string;
}

export interface Campaign {
  id: number;
  name: string;
  createdDate: string;
  creatorCount: number;
  pinned?: boolean;
  tags: TagItem[];
}

export interface Creator {
  id: number;
  name: string;
  handle: string;
  profile_image_url?: string;
  followers_count: number;
  average_views: number;
  engagement_rate: number; // percentage 0-100
  buzz_score: number; // percentage 0-100
  primary_niche?: string;
  secondary_niche?: string;
  email?: string | null;
}

export interface OverlayCreator {
  id: number;
  username: string;
  username_tag?: string;
  profile_image_url?: string;
  followers: number;
  average_views: number;
  engagement_rate: number;
  buzz_score: number;
  primary_niche?: string;
  secondary_niche?: string;
  email?: string | null;
}


