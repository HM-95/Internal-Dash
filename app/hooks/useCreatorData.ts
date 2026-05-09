import React from 'react';
import { supabase } from '../lib/supabaseClient';
import { Creator, DatabaseFilters, CreatorListMode, ViewMode, SortField, SortDirection, SortState, Niche, CreatorMetrics } from '../types/database';
import { parseLocationManually, getDisplayLocation } from '../utils/locationParser';

// Pagination configuration - default value
const DEFAULT_CREATORS_PER_PAGE = 24;

// Lightweight in-memory cache for counts to avoid repeated expensive count queries
const COUNT_CACHE_TTL_MS = 60_000; // 60s
const countCache = new Map<string, { value: number; ts: number }>();
const PAGE_CACHE_TTL_MS = 5 * 60_000; // 5 minutes for page/metrics cache

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (_e) {
    return null;
  }
}

function getPageCacheKey(filtersHash: string): string {
  return `discover_page_${filtersHash}`;
}

function getMetricsCacheKey(filtersHash: string): string {
  return `discover_metrics_${filtersHash}`;
}

function getSortKey(sortState: SortState): string {
  if (!sortState || !sortState.field) return 'default';
  return `${sortState.field}:${sortState.direction}`;
}

type CachedPage = {
  page: number;
  creators: Creator[];
  totalCount: number;
  sortKey: string;
  ts: number;
};

type CachedMetrics = {
  metrics: CreatorMetrics;
  totalCount: number;
  ts: number;
};

function loadCachedPage(filters: DatabaseFilters, page: number, sortState: SortState, itemsPerPage?: number, mode?: CreatorListMode): CachedPage | null {
  try {
    const hash = getFilterHash({ ...filters, __page: page, __sort: getSortKey(sortState), __itemsPerPage: itemsPerPage, __mode: mode } as any);
    const key = getPageCacheKey(hash);
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    const cached = safeParse<CachedPage>(raw);
    if (!cached) return null;
    if (Date.now() - cached.ts > PAGE_CACHE_TTL_MS) return null;
    return cached;
  } catch (_e) {
    return null;
  }
}

function saveCachedPage(filters: DatabaseFilters, page: number, sortState: SortState, creators: Creator[], totalCount: number, itemsPerPage?: number, mode?: CreatorListMode): void {
  try {
    const hash = getFilterHash({ ...filters, __page: page, __sort: getSortKey(sortState), __itemsPerPage: itemsPerPage, __mode: mode } as any);
    const key = getPageCacheKey(hash);
    const payload: CachedPage = { page, creators, totalCount, sortKey: getSortKey(sortState), ts: Date.now() };
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(payload));
    }
  } catch (_e) {
    // ignore
  }
}

function loadCachedMetrics(filters: DatabaseFilters): CachedMetrics | null {
  try {
    const hash = getFilterHash(filters);
    const key = getMetricsCacheKey(hash);
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    const cached = safeParse<CachedMetrics>(raw);
    if (!cached) return null;
    if (Date.now() - cached.ts > PAGE_CACHE_TTL_MS) return null;
    return cached;
  } catch (_e) {
    return null;
  }
}

function saveCachedMetrics(filters: DatabaseFilters, metrics: CreatorMetrics, totalCount: number): void {
  try {
    const hash = getFilterHash(filters);
    const key = getMetricsCacheKey(hash);
    const payload: CachedMetrics = { metrics, totalCount, ts: Date.now() };
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(payload));
    }
  } catch (_e) {
    // ignore
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

function getFilterHash(filters: DatabaseFilters): string {
  // Ignore transient fields and ensure stable order
  return stableStringify(filters);
}

// Normalize legacy buzz score labels to the new buckets
function normalizeBuzzScoreLabels(labels: string[] | undefined | null): string[] {
  if (!Array.isArray(labels) || labels.length === 0) return [];
  const result = new Set<string>();
  for (const label of labels) {
    switch (label) {
      case '90%+':
        result.add('90%+');
        break;
      case '70-90%':
        result.add('70-90%');
        break;
      case '50-70%':
        result.add('50-70%');
        break;
      case '30-50%':
        result.add('30-50%');
        break;
      case 'Less than 30%':
        result.add('Less than 30%');
        break;
      // Legacy labels → map to nearest new buckets
      case '80-90%':
      case '70-80%':
        result.add('70-90%');
        break;
      case '60-70%':
        result.add('50-70%');
        break;
      case 'Less than 60%':
        result.add('30-50%');
        result.add('Less than 30%');
        break;
      default:
        // Ignore unknown labels silently
        break;
    }
  }
  return Array.from(result);
}

function buildPlatformOrClause(platforms: string[]): string {
  const mapped = platforms
    .map(p => (p.toLowerCase() === 'x' ? 'twitter' : p.toLowerCase()))
    .map(p => {
      if (p === 'instagram') return 'platform.ilike.instagram';
      if (p === 'tiktok') return 'platform.ilike.tiktok';
      if (p === 'youtube') return 'platform.ilike.youtube';
      if (p === 'twitter') return 'platform.ilike.twitter';
      return `platform.ilike.${p}`;
    });
  return mapped.join(',');
}

function getCachedCount(hash: string): number | null {
  const cached = countCache.get(hash);
  if (!cached) return null;
  if (Date.now() - cached.ts > COUNT_CACHE_TTL_MS) {
    countCache.delete(hash);
    return null;
  }
  return cached.value;
}

function setCachedCount(hash: string, count: number): void {
  countCache.set(hash, { value: count, ts: Date.now() });
}

// Extract static thumbnail from TikTok video URL
const extractStaticThumbnail = (videoUrl: string): string => {
  if (!videoUrl) return '';
  
  // For TikTok videos, try to get static thumbnail
  if (videoUrl.includes('tiktok.com') || videoUrl.includes('supabase.co')) {
    // If it's a .awebp file, it should already be static
    if (videoUrl.includes('.awebp') || videoUrl.includes('.webp') || videoUrl.includes('.jpg') || videoUrl.includes('.png')) {
      return videoUrl;
    }
    // For video files, try to get thumbnail by replacing extension or adding thumbnail parameter
    if (videoUrl.includes('.mp4') || videoUrl.includes('.mov')) {
      // Try to get thumbnail version
      return videoUrl.replace(/\.(mp4|mov)/, '_thumbnail.jpg');
    }
  }
  
  return videoUrl; // Return as-is if we can't determine a better thumbnail
};

// Helper functions to extract metrics from different data formats
const extractAverageLikes = (averageLikesData: any): number => {
  if (typeof averageLikesData === 'object' && averageLikesData !== null) {
    // Handle case where it's an object with avg_value
    if (averageLikesData.avg_value !== undefined) {
      return averageLikesData.avg_value;
    }
    // Handle case where it's an object with average_likes property
    if (averageLikesData.average_likes !== undefined) {
      return averageLikesData.average_likes;
    }
  }
  // Handle case where it's a direct number
  return averageLikesData || 0;
};

const extractAverageComments = (averageCommentsData: any): number => {
  if (typeof averageCommentsData === 'object' && averageCommentsData !== null) {
    // Handle case where it's an object with avg_value
    if (averageCommentsData.avg_value !== undefined) {
      return averageCommentsData.avg_value;
    }
    // Handle case where it's an object with average_comments property
    if (averageCommentsData.average_comments !== undefined) {
      return averageCommentsData.average_comments;
    }
  }
  // Handle case where it's a direct number
  return averageCommentsData || 0;
};

const extractAverageViews = (averageViewsData: any): number => {
  if (typeof averageViewsData === 'object' && averageViewsData !== null) {
    // Handle case where it's an object with avg_value
    if (averageViewsData.avg_value !== undefined) {
      return averageViewsData.avg_value;
    }
    // Handle case where it's an object with average_views property
    if (averageViewsData.average_views !== undefined) {
      return averageViewsData.average_views;
    }
  }
  // Handle case where it's a direct number
  return averageViewsData || 0;
};

const extractEngagementRate = (engagementData: any): number => {
  if (typeof engagementData === 'object' && engagementData !== null) {
    // Handle case where it's an object with avg_value
    if (engagementData.avg_value !== undefined) {
      return engagementData.avg_value;
    }
    // Handle case where it's an object with engagement_rate property
    if (engagementData.engagement_rate !== undefined) {
      return engagementData.engagement_rate;
    }
  }
  // Handle case where it's a direct number
  return engagementData || 0;
};

const extractFollowersCount = (followersData: any): number => {
  if (typeof followersData === 'object' && followersData !== null) {
    // Handle case where it's an object with avg_value
    if (followersData.avg_value !== undefined) {
      return followersData.avg_value;
    }
    // Handle case where it's an object with followers_count property
    if (followersData.followers_count !== undefined) {
      return followersData.followers_count;
    }
  }
  // Handle case where it's a direct number
  return followersData || 0;
};

// Transform Supabase data to match UI expectations
const transformCreatorData = async (dbCreator: any): Promise<Creator> => {
  try {
    // Extract recent posts and create thumbnails array - optimized for immediate loading
    const validThumbnails = [];
    const validShareUrls = [];
    
    // Only process posts until we have enough thumbnails for UI (max 4)
    for (let i = 1; i <= 12 && validThumbnails.length < 4; i++) {
      // Try wellness post first, fallback to regular post
      let post = dbCreator[`recent_wellness_post_${i}`] || dbCreator[`recent_post_${i}`];
      if (post) {
        // Handle case where post might be a JSON string
        if (typeof post === 'string') {
          const trimmed = post.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
              post = JSON.parse(trimmed);
            } catch (_e) {
              // Failed to parse post - skip this post
              continue;
            }
          } else {
            // Not JSON structure we can parse - skip
            continue;
          }
        }
        // Prefer media_urls[0] if available (Instagram), else fallback to video_url
        let thumbnailUrl = '';
        if (Array.isArray(post.media_urls) && post.media_urls.length > 0) {
          thumbnailUrl = post.media_urls[0];
          // Clean up URL if it ends with '?'
          if (thumbnailUrl && thumbnailUrl.endsWith('?')) {
            thumbnailUrl = thumbnailUrl.slice(0, -1);
          }
        } else if (typeof post.media_urls === 'string' && post.media_urls.trim()) {
          // Handle case where media_urls is a single URL string
          thumbnailUrl = post.media_urls.trim();
          // Clean up URL if it ends with '?'
          if (thumbnailUrl && thumbnailUrl.endsWith('?')) {
            thumbnailUrl = thumbnailUrl.slice(0, -1);
          }
        } else if (post.video_url) {
          thumbnailUrl = extractStaticThumbnail(post.video_url);
        }
        
        // Only add valid thumbnails (skip empty media_urls)
        if (thumbnailUrl) {
          validThumbnails.push(thumbnailUrl);
          
          // Extract share URL for TikTok posts
          if (dbCreator.platform?.toLowerCase() === 'tiktok' && post.share_url) {
            validShareUrls.push(post.share_url);
          } else {
            validShareUrls.push(''); // Empty string for non-TikTok posts
          }
        }
      }
    }
    
    // Take the first 4 valid thumbnails, fill remaining with placeholders if needed
    const recentPosts = [
      ...validThumbnails.slice(0, 4),
      ...Array(4 - Math.min(validThumbnails.length, 4)).fill('/images/PostThumbnail-3.svg')
    ];
    

    
    // Process thumbnails for display
    const cardThumbnails = recentPosts.slice(0, 3);
    const expandedThumbnails = recentPosts.slice(0, 4);

    // Create social media array from platform data
    const socialMedia = [{
      platform: (dbCreator.platform || 'instagram').toLowerCase(),
      username: dbCreator.handle || '',
      url: dbCreator.profile_url || `https://${(dbCreator.platform || 'instagram').toLowerCase()}.com/${dbCreator.handle || ''}`
    }];

    // Create niches array from wellness niches with fallback to old fields
    const niches = [];
    // Only include secondary niches - remove primary niches
    const secondaryNiche = dbCreator.secondary_wellness_niche || dbCreator.secondary_niche;
    
    if (secondaryNiche) {
      niches.push({ name: secondaryNiche, type: 'secondary' as const });
    }

    // Parse location - use manual parsing for speed, AI only for complex cases
    let parsedLocation: any;
    const rawLocation = dbCreator.location || '';
    const locationRegion = dbCreator.locationRegion || '';
    

    
    try {
      // Use the locationRegion if available, otherwise fall back to location parsing
      if (locationRegion && locationRegion.trim() !== '') {
        parsedLocation = {
          city: null,
          country: locationRegion,
          region: locationRegion as any,
          isGlobal: locationRegion === 'Global',
          rawLocation: locationRegion
        };
      } else {
        // Use simple manual parsing to display raw location data
        parsedLocation = parseLocationManually(rawLocation);
      }
    } catch (locationError) {
      // Location parsing failed - use fallback
      parsedLocation = { city: null, country: 'Global', region: 'Global', isGlobal: true, rawLocation: rawLocation || '' };
    }
    
    const displayLocation = getDisplayLocation(parsedLocation);

  return {
    id: dbCreator.id,
    profile_pic: dbCreator.profile_image_url,
    match_score: dbCreator.match_score || undefined, // Will be set by AI logic
    buzz_score: dbCreator.buzz_score ?? 0, // Use nullish coalescing to handle null/undefined as 0
    username: dbCreator.display_name,
    username_tag: `@${dbCreator.handle}`,
    social_media: socialMedia,
    bio: dbCreator.bio || '',
    followers: extractFollowersCount(dbCreator.followers_count),
    followers_change: dbCreator.followers_change || 0,
    followers_change_type: (dbCreator.followers_change_type as 'positive' | 'negative') || 'positive',
    engagement: extractEngagementRate(dbCreator.engagement_rate),
    engagement_change: dbCreator.engagement_rate_change || 0,
    engagement_change_type: (dbCreator.engagement_rate_change_type as 'positive' | 'negative') || 'positive',
    avg_views: extractAverageViews(dbCreator.average_views),
    avg_views_change: dbCreator.average_views_change || 0,
    avg_views_change_type: (dbCreator.average_views_change_type as 'positive' | 'negative') || 'positive',
    avg_likes: extractAverageLikes(dbCreator.average_likes),
    avg_likes_change: dbCreator.average_likes_change || 0,
    avg_likes_change_type: (dbCreator.average_likes_change_type as 'positive' | 'negative') || 'positive',
    avg_comments: extractAverageComments(dbCreator.average_comments),
    avg_comments_change: dbCreator.average_comments_change || 0,
    avg_comments_change_type: (dbCreator.average_comments_change_type as 'positive' | 'negative') || 'positive',
    niches: niches,
    hashtags: dbCreator.hashtags || [],
    thumbnails: cardThumbnails, // Pre-processed thumbnails for cards
    expanded_thumbnails: expandedThumbnails, // Pre-processed thumbnails for expanded overlay
    share_urls: validShareUrls.slice(0, 4), // Share URLs for TikTok posts (max 4)
    location: displayLocation,
    email: (() => {
      const email = dbCreator.email || '';
      if (email) {
        console.log('🔍 Email found for creator:', dbCreator.display_name, 'Email:', email);
      }
      return email;
    })(),
    created_at: dbCreator.created_at || new Date().toISOString(),
    updated_at: dbCreator.created_at || new Date().toISOString()
  };
  } catch (error) {
    // Error transforming creator data - return fallback object
    return {
      id: dbCreator.id || 'unknown',
      profile_pic: dbCreator.profile_image_url || '',
      match_score: undefined,
      buzz_score: dbCreator.buzz_score ?? 0,
      username: dbCreator.display_name || 'Unknown Creator',
      username_tag: `@${dbCreator.handle || 'unknown'}`,
      social_media: [{
        platform: (dbCreator.platform || 'instagram').toLowerCase(),
        username: dbCreator.handle || '',
        url: `https://${(dbCreator.platform || 'instagram').toLowerCase()}.com/${dbCreator.handle || ''}`
      }],
      bio: dbCreator.bio || '',
      followers: extractFollowersCount(dbCreator.followers_count),
      followers_change: dbCreator.followers_change || 0,
      followers_change_type: 'positive' as const,
      engagement: extractEngagementRate(dbCreator.engagement_rate),
      engagement_change: dbCreator.engagement_rate_change || 0,
      engagement_change_type: 'positive' as const,
      avg_views: extractAverageViews(dbCreator.average_views),
      avg_views_change: dbCreator.average_views_change || 0,
      avg_views_change_type: 'positive' as const,
      avg_likes: extractAverageLikes(dbCreator.average_likes),
      avg_likes_change: dbCreator.average_likes_change || 0,
      avg_likes_change_type: 'positive' as const,
      avg_comments: extractAverageComments(dbCreator.average_comments),
      avg_comments_change: dbCreator.average_comments_change || 0,
      avg_comments_change_type: 'positive' as const,
      niches: [],
      hashtags: dbCreator.hashtags || [],
      thumbnails: [],
      expanded_thumbnails: [],
      share_urls: [],
      location: 'Unknown',
      email: dbCreator.email || '',
      created_at: dbCreator.created_at || new Date().toISOString(),
      updated_at: dbCreator.created_at || new Date().toISOString()
    };
  }
};

// Fetch AI metrics from database (all AI matches for user)
const fetchAIMetrics = async (userId: string, setTotalCount?: (count: number) => void) => {
  try {
    // Check session-level cache for AI metrics first
    const aiMetricsCacheKey = `ai_metrics_session_${userId}`;
    const cachedAIMetrics = getCachedData(aiMetricsCacheKey);
    
    if (cachedAIMetrics) {
      console.log(`⚡ Using session-cached AI metrics (${Math.round((Date.now() - cachedAIMetrics.timestamp) / 1000)}s old)`);
      if (setTotalCount) setTotalCount(cachedAIMetrics.total_creators);
      return cachedAIMetrics;
    }
    
    // Get count of all AI matches for this user
    console.log(`🔍 fetchAIMetrics: Counting AI matches for user_id=${userId}`);
    const { count } = await supabase
      .from('ai_matches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    const total_creators = typeof count === 'number' ? count : 0;
    console.log(`🔍 fetchAIMetrics: Found ${total_creators} AI matches for user ${userId}`);
    if (setTotalCount) setTotalCount(total_creators);
    
    // Get sample of AI matches, then manually fetch creator data
    const SAMPLE_SIZE = 250;
    
    // First, get AI matches with creator_ids
    const { data: aiMatches, error: matchesError } = await supabase
      .from('ai_matches')
      .select('creator_id')
      .eq('user_id', userId)
      .order('match_score', { ascending: false })
      .limit(SAMPLE_SIZE);
    
    if (matchesError) {
      console.error('Error fetching AI matches:', matchesError);
      throw matchesError;
    }
    
    if (!aiMatches || aiMatches.length === 0) {
      console.warn('No AI matches found for metrics calculation');
      return {
        total_creators,
        avg_followers: 0,
        avg_views: 0,
        avg_engagement: 0,
        change_percentage: 0,
        change_type: 'positive' as const,
      };
    }
    
    // Extract creator IDs
    const creatorIds = aiMatches.map(match => match.creator_id);
    console.log(`Fetching creator data for ${creatorIds.length} AI matches...`);
    
    // Now fetch creator data manually
    const { data: aiMatchesSample, error: sampleError } = await supabase
      .from('healthwellness')
      .select('followers_count, average_views, engagement_rate')
      .in('id', creatorIds);
    
    if (sampleError) {
      console.error('Error fetching creator data sample:', sampleError);
      throw sampleError;
    }
    
    // Process creator data directly (no nested structure)
    console.log('Creator data sample:', aiMatchesSample?.slice(0, 2)); // Debug first 2 creators
    console.log('Creator data length:', aiMatchesSample?.length);
    
    const safeSample = aiMatchesSample || [];
    
    // Debug individual metrics calculation
    const followersSum = safeSample.reduce((s, c: any) => s + (c.followers_count || 0), 0);
    const viewsSum = safeSample.reduce((s, c: any) => s + (c.average_views || 0), 0);
    const engagementSum = safeSample.reduce((s, c: any) => s + (c.engagement_rate || 0), 0);
    
    console.log('Metrics calculation debug:', {
      sampleLength: safeSample.length,
      followersSum,
      viewsSum,
      engagementSum,
      sampleCreator: safeSample[0]
    });
    
    const avg_followers = safeSample.length ? Math.round(followersSum / safeSample.length) : 0;
    const avg_views = safeSample.length ? Math.round(viewsSum / safeSample.length) : 0;
    const avg_engagement = safeSample.length ? Math.round((engagementSum / safeSample.length) * 100) / 100 : 0;
    
    const aiMetrics = {
      total_creators,
      avg_followers,
      avg_views,
      avg_engagement,
      change_percentage: 0,
      change_type: 'positive' as const,
    };
    
    // Cache AI metrics for entire session (no expiry)
    setCachedData(aiMetricsCacheKey, aiMetrics, CACHE_DURATIONS.AI_METRICS_SESSION);
    console.log(`✅ Cached AI metrics for entire session`);
    
    return aiMetrics;
  } catch (error) {
    console.error('Error fetching AI metrics:', error);
    // Fallback to empty metrics
    return {
      total_creators: 0,
      avg_followers: 0,
      avg_views: 0,
      avg_engagement: 0,
      change_percentage: 0,
      change_type: 'positive' as const,
    };
  }
};

// Cache for table determination to avoid repeated checks
let tableCache: { table: string; nicheField: string } | null = null;

// Function to clear table cache
const clearTableCache = () => {
  tableCache = null;
  console.log('🔄 Cleared table cache');
};

// Helper function to determine which table to use
const getTableAndField = async () => {
  // Clear cache to force fresh check
  clearTableCache();
  
  // Return cached result if available (should be null now)
  if (tableCache) {
    return tableCache;
  }
  
  // Check if healthwellness table has data
  const { data: healthwellnessData, error: healthwellnessError } = await supabase
    .from('healthwellness')
    .select('id')
    .limit(1);
  
  console.log('🔍 Table detection - healthwellness check:', {
    error: healthwellnessError,
    dataLength: healthwellnessData?.length,
    hasData: healthwellnessData && healthwellnessData.length > 0
  });
  
  if (!healthwellnessError && healthwellnessData && healthwellnessData.length > 0) {
    console.log('✅ Using healthwellness table');
    tableCache = { table: 'healthwellness', nicheField: 'secondary_niche' };
    return tableCache;
  }
  
  // Fallback to creatordata table
  console.log('⚠️ Falling back to creatordata table');
  tableCache = { table: 'creatordata', nicheField: 'secondary_niche' };
  return tableCache;
};

// Fetch metrics quickly (count with planned + lightweight averages from a small sample)
const fetchCreatorMetrics = async (filters: DatabaseFilters = {}, setTotalCount?: (count: number) => void) => {
  // Determine which table to use
  const { table, nicheField } = await getTableAndField();
  
  // 1) Cheap count only
  let countQuery = supabase
    .from(table)
    .select('*', { count: 'planned', head: true });

  // Apply filters to count query
  if (filters.niches?.length) countQuery = countQuery.in(nicheField, filters.niches);
  if (filters.platforms?.length) {
    countQuery = countQuery.or(buildPlatformOrClause(filters.platforms));
  }
  if (filters.followers_min !== undefined) countQuery = countQuery.gte('followers_count', filters.followers_min);
  if (filters.followers_max !== undefined) countQuery = countQuery.lte('followers_count', filters.followers_max);
  if (filters.engagement_min !== undefined) countQuery = countQuery.gte('engagement_rate', filters.engagement_min);
  if (filters.engagement_max !== undefined && filters.engagement_max < 500) countQuery = countQuery.lte('engagement_rate', filters.engagement_max);
  if (filters.avg_views_min !== undefined) countQuery = countQuery.gte('average_views', filters.avg_views_min);
  if (filters.avg_views_max !== undefined && filters.avg_views_max < 1_000_000) countQuery = countQuery.lte('average_views', filters.avg_views_max);
  if (filters.buzz_scores?.length) {
    const toClause = (label: string): string | null => {
      switch (label) {
        case '90%+':
          return 'buzz_score.gte.90';
        case '70-90%':
          return 'and(buzz_score.gte.70,buzz_score.lt.90)';
        case '50-70%':
          return 'and(buzz_score.gte.50,buzz_score.lt.70)';
        case '30-50%':
          return 'and(buzz_score.gte.30,buzz_score.lt.50)';
        case 'Less than 30%':
          return 'buzz_score.lt.30';
        default:
          return null;
      }
    };
    const clauses = filters.buzz_scores
      .map(toClause)
      .filter((c): c is string => !!c);
    if (clauses.length > 0) {
      countQuery = countQuery.or(clauses.join(','));
    }
  }
  if (filters.locations?.length) countQuery = countQuery.in('location', filters.locations);
  
  // Email filter for count query
  if (filters.email_required !== undefined) {
    if (filters.email_required) {
      // Show only creators with valid email (contains @ symbol)
      countQuery = countQuery.like('email', '%@%');
    } else {
      // Show only creators without email
      countQuery = countQuery.or('email.is.null,email.eq.,email.not.like.%@%');
    }
  }

  const { count } = await countQuery;
  const total_creators = typeof count === 'number' ? count : 0;
  if (setTotalCount) setTotalCount(total_creators);

  // 2) Small sample for averages to keep it fast
  const SAMPLE_SIZE = 250; // tune for speed vs accuracy
  let sampleQuery = supabase
    .from(table)
    .select('followers_count, average_views, engagement_rate')
    .limit(SAMPLE_SIZE);

  // Apply same filters to sample query
  if (filters.niches?.length) sampleQuery = sampleQuery.in(nicheField, filters.niches);
  if (filters.platforms?.length) {
    sampleQuery = sampleQuery.or(buildPlatformOrClause(filters.platforms));
  }
  if (filters.followers_min !== undefined) sampleQuery = sampleQuery.gte('followers_count', filters.followers_min);
  if (filters.followers_max !== undefined) sampleQuery = sampleQuery.lte('followers_count', filters.followers_max);
  if (filters.engagement_min !== undefined) sampleQuery = sampleQuery.gte('engagement_rate', filters.engagement_min);
  if (filters.engagement_max !== undefined && filters.engagement_max < 500) sampleQuery = sampleQuery.lte('engagement_rate', filters.engagement_max);
  if (filters.avg_views_min !== undefined) sampleQuery = sampleQuery.gte('average_views', filters.avg_views_min);
  if (filters.avg_views_max !== undefined && filters.avg_views_max < 1_000_000) sampleQuery = sampleQuery.lte('average_views', filters.avg_views_max);
  if (filters.buzz_scores?.length) {
    const toClause = (label: string): string | null => {
      switch (label) {
        case '90%+':
          return 'buzz_score.gte.90';
        case '70-90%':
          return 'and(buzz_score.gte.70,buzz_score.lt.90)';
        case '50-70%':
          return 'and(buzz_score.gte.50,buzz_score.lt.70)';
        case '30-50%':
          return 'and(buzz_score.gte.30,buzz_score.lt.50)';
        case 'Less than 30%':
          return 'buzz_score.lt.30';
        default:
          return null;
      }
    };
    const clauses = filters.buzz_scores
      .map(toClause)
      .filter((c): c is string => !!c);
    if (clauses.length > 0) {
      sampleQuery = sampleQuery.or(clauses.join(','));
    }
  }
  if (filters.locations?.length) sampleQuery = sampleQuery.in('location', filters.locations);
  
  // Email filter for sample query
  if (filters.email_required !== undefined) {
    if (filters.email_required) {
      // Show only creators with valid email (contains @ symbol)
      sampleQuery = sampleQuery.like('email', '%@%');
    } else {
      // Show only creators without email
      sampleQuery = sampleQuery.or('email.is.null,email.eq.,email.not.like.%@%');
    }
  }

  const { data: sampleData } = await sampleQuery;
  const safeSample = sampleData || [];
  const avg_followers = safeSample.length ? Math.round(safeSample.reduce((s, c: any) => s + (c.followers_count || 0), 0) / safeSample.length) : 0;
  const avg_views = safeSample.length ? Math.round(safeSample.reduce((s, c: any) => s + (c.average_views || 0), 0) / safeSample.length) : 0;
  const avg_engagement = safeSample.length ? Math.round((safeSample.reduce((s, c: any) => s + (c.engagement_rate || 0), 0) / safeSample.length) * 100) / 100 : 0;

  return {
    total_creators,
    avg_followers,
    avg_views,
    avg_engagement,
    change_percentage: 0,
    change_type: 'positive' as const,
  };
};

// In-memory cache for creator data to improve performance
const creatorDataCache = new Map<string, {
  data: any;
  timestamp: number;
  expiresIn: number;
}>();

// Cache duration constants (in milliseconds) - Intelligent retention strategy
const CACHE_DURATIONS = {
  AI_MATCHES: 8 * 60 * 1000, // 8 minutes - increased for better performance
  AI_PAGES: 15 * 60 * 1000, // 15 minutes - longer cache for pages
  AI_METRICS: 20 * 60 * 1000, // 20 minutes - metrics don't change often
  ALL_CREATORS: 5 * 60 * 1000, // 5 minutes - standard cache time
  ALL_CREATORS_PAGE_1: 24 * 60 * 60 * 1000, // 24 hours - page 1 cached much longer
  AI_PAGE_1: 24 * 60 * 60 * 1000, // 24 hours - AI page 1 cached much longer
  METRICS: 8 * 60 * 1000, // 8 minutes - increased cache time
  NICHES: 60 * 60 * 1000, // 60 minutes - niches rarely change
  COUNTS: 3 * 60 * 1000, // 3 minutes - for count caching
  AI_METRICS_SESSION: 0, // AI metrics cached for entire session (no expiry)
  ALL_CREATORS_METRICS_NO_FILTERS: 30 * 60 * 1000, // 30 minutes for All Creators metrics without filters
};

// Performance monitoring
let cacheStats = {
  hits: 0,
  misses: 0,
  preloads: 0,
  get hitRate() {
    const total = this.hits + this.misses;
    return total > 0 ? Math.round((this.hits / total) * 100) : 0;
  }
};

// Safe preloading function with proper limits and stop conditions
const safePreloadAdjacentPages = (
  currentPage: number, 
  totalPages: number, 
  mode: CreatorListMode, 
  filters: DatabaseFilters, 
  sortState: SortState, 
  itemsPerPage: number,
  fetchPaginatedCreators: any,
  isUserAction: boolean = true // Only preload on user actions, not automatic preloads
) => {
  // Only preload on user actions to prevent cascading
  if (!isUserAction) {
    return;
  }
  
  const pagesToPreload = [];
  
  // Only preload next page (limit to 1 page to prevent cascading)
  if (currentPage < totalPages) {
    pagesToPreload.push(currentPage + 1);
  }
  
  // Limit to maximum 1 preload to prevent infinite loops
  if (pagesToPreload.length === 0) return;
  
  console.log(`🔄 Safe preloading: page ${pagesToPreload[0]} for ${mode} mode...`);
  
  // Preload only the next page
  const pageNum = pagesToPreload[0];
  const cacheFilters = mode === 'ai' ? {} : filters;
  const cacheSortState = mode === 'ai' ? { field: 'followers', direction: 'desc' } : sortState;
  const cacheKey = `${mode}_creators_${JSON.stringify(cacheFilters)}_${pageNum}_${JSON.stringify(cacheSortState)}_${itemsPerPage}`;
  
  // Only preload if not already cached
  const existingCache = getCachedData(cacheKey);
  if (!existingCache) {
    console.log(`🔄 Preloading page ${pageNum} for ${mode} mode (not cached)`);
    setTimeout(() => {
      // Pass isUserAction: false to prevent cascading preloads
      fetchPaginatedCreators(pageNum, mode, cacheFilters, itemsPerPage, false);
    }, 500); // Longer delay to prevent overwhelming
  } else {
    console.log(`⏭️ Skipping preload for page ${pageNum} (already cached)`);
  }
};

// Smart preloading strategy - will be implemented after fetchPaginatedCreators is defined
let triggerSmartPreloading: (
  currentPage: number, 
  currentMode: CreatorListMode, 
  filters: DatabaseFilters, 
  sortState: SortState, 
  itemsPerPage: number
) => void;

// Helper function to get cached data
const getCachedData = (key: string): any | null => {
  const cached = creatorDataCache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > cached.expiresIn) {
    creatorDataCache.delete(key);
    return null;
  }
  
  // Return data with timestamp for debugging
  return {
    ...cached.data,
    _cacheTimestamp: cached.timestamp
  };
};

// Helper function to set cached data
const setCachedData = (key: string, data: any, expiresIn: number): void => {
  creatorDataCache.set(key, {
    data,
    timestamp: Date.now(),
    expiresIn
  });
};

// Custom hook for creator data management
export const useCreatorData = () => {
  const [creators, setCreators] = React.useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = React.useState<Creator[]>([]);
  const [paginatedCreators, setPaginatedCreators] = React.useState<Creator[]>([]);
  const [aiRecommendedCreators, setAiRecommendedCreators] = React.useState<Creator[]>([]);
  const [allCreators, setAllCreators] = React.useState<Creator[]>([]);
  
  // Initialize state from localStorage or defaults
  // Always default to 'all' (AI mode removed for internal-only tool)
  const [currentMode, setCurrentMode] = React.useState<CreatorListMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('discover_currentMode');
      // Coerce any legacy 'ai' value to 'all'
      if (!saved || saved === 'ai') {
        localStorage.setItem('discover_currentMode', 'all');
        return 'all' as CreatorListMode;
      }
      // Respect saved choice if not 'ai'
      return saved as CreatorListMode;
    }
    return 'all' as CreatorListMode;
  });
  
  const [currentPage, setCurrentPage] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('discover_currentPage');
      const parsedPage = saved ? parseInt(saved, 10) : 1;
      // Ensure we start on page 1 to avoid issues
      return Math.max(1, parsedPage);
    }
    return 1;
  });
  
  const [totalPages, setTotalPages] = React.useState(1);
  const [niches, setNiches] = React.useState<Niche[]>([]);
  const [metrics, setMetrics] = React.useState<CreatorMetrics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [paginationLoading, setPaginationLoading] = React.useState(false); // Dedicated pagination
  const [error, setError] = React.useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('discover_itemsPerPage');
      return saved ? parseInt(saved, 10) : DEFAULT_CREATORS_PER_PAGE;
    }
    return DEFAULT_CREATORS_PER_PAGE;
  });
  const [isModeSwitching, setIsModeSwitching] = React.useState(false);
  
  // Add currentFilters state with localStorage persistence
  const [currentFilters, setCurrentFilters] = React.useState<DatabaseFilters>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('discover_currentFilters');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as DatabaseFilters;
          if (parsed.buzz_scores) {
            parsed.buzz_scores = normalizeBuzzScoreLabels(parsed.buzz_scores);
          }
          return parsed;
        } catch (_e) {
          return {};
        }
      }
      return {};
    }
    return {};
  });
  
  const [totalFilteredCount, setTotalFilteredCount] = React.useState(0);
  const [sortState, setSortState] = React.useState<SortState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('discover_sortState');
      return saved ? JSON.parse(saved) : { field: null, direction: 'desc' };
    }
    return { field: null, direction: 'desc' };
  });

  // Helper functions to save state to localStorage
  const saveToLocalStorage = (key: string, value: any) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      } catch (error) {
        // Failed to save to localStorage - continue silently
      }
    }
  };

  // Update pagination when filtered creators change
  const updatePagination = (creatorList: Creator[], page: number = 1, customItemsPerPage?: number) => {
    const currentItemsPerPage = customItemsPerPage || itemsPerPage;
    const totalPages = Math.max(1, Math.ceil(creatorList.length / currentItemsPerPage));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (safePage - 1) * currentItemsPerPage;
    const endIndex = startIndex + currentItemsPerPage;
    const paginatedList = creatorList.slice(startIndex, endIndex);
    
    console.log('updatePagination called with:');
    console.log('- creatorList.length:', creatorList.length);
    console.log('- page:', page);
    console.log('- customItemsPerPage:', customItemsPerPage);
    console.log('- currentItemsPerPage:', currentItemsPerPage);
    console.log('- calculated totalPages:', totalPages);
    console.log('- safePage:', safePage);
    console.log('- paginatedList.length:', paginatedList.length);
    
    // Batch all state updates together to prevent multiple re-renders
    const updates = () => {
    setTotalPages(totalPages);
      setCurrentPage(safePage);
    setPaginatedCreators(paginatedList);
    };
    
    // Use requestAnimationFrame for smooth updates without blocking
    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      window.requestAnimationFrame(updates);
    } else {
      updates();
    }
    
    saveToLocalStorage('discover_currentPage', safePage);
  };

  // Helper function to manage pagination loading with minimum duration for UX
  const setPaginationLoadingWithMinDuration = async (loadingPromise: Promise<any>, minDuration: number = 300) => {
    setPaginationLoading(true);
    
    const startTime = Date.now();
    
    try {
      // Wait for both the loading promise and minimum duration
      const [result] = await Promise.all([
        loadingPromise,
        new Promise(resolve => setTimeout(resolve, minDuration))
      ]);
      
      return result;
    } finally {
      // Ensure we've shown loading for at least the minimum duration
      const elapsed = Date.now() - startTime;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }
      
      setPaginationLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = async (page: number) => {
    console.log(`🔍 DEBUG START: handlePageChange(${page}) - currentPage: ${currentPage}, loading: ${loading}, paginationLoading: ${paginationLoading}, mode: ${currentMode}`);
    
    // Validate page number
    if (page < 1 || page > totalPages) {
      console.warn(`🔍 DEBUG: Invalid page ${page}, totalPages: ${totalPages}`);
      return;
    }
    
    // Prevent duplicate requests
    if (currentPage === page && !loading && !paginationLoading) {
      console.log(`🔍 DEBUG: Already on page ${page}, skipping`);
      return;
    }
    
    console.log(`🔍 DEBUG: Calling fetchPaginatedCreators(${page}, ${currentMode})`);
    
    // Wait for the current page to load
    await fetchPaginatedCreators(page, currentMode, currentFilters);
    
    console.log(`🔍 DEBUG END: handlePageChange(${page}) completed`);
  };

  // Go to next page
  const nextPage = async () => {
    const nextPageNumber = currentPage + 1;
    console.log('nextPage called, currentPage:', currentPage, 'nextPage:', nextPageNumber, 'totalPages:', totalPages);
    if (nextPageNumber <= totalPages && !loading && !paginationLoading) {
      console.log('Navigating to next page:', nextPageNumber);
      await handlePageChange(nextPageNumber);
    } else {
      console.log('Cannot navigate to next page:', {
        nextPageNumber,
        totalPages,
        loading,
        paginationLoading
      });
    }
  };

  // Go to previous page
  const previousPage = async () => {
    console.log('previousPage called, currentPage:', currentPage);
    if (currentPage > 1 && !loading && !paginationLoading) {
      await handlePageChange(currentPage - 1);
    }
  };

  // Go to first page
  const goToFirstPage = async () => {
    console.log('goToFirstPage called, currentPage:', currentPage);
    if (currentPage > 1 && !loading && !paginationLoading) {
      await handlePageChange(1);
    }
  };

  // Go to last page
  const goToLastPage = async () => {
    console.log('goToLastPage called, currentPage:', currentPage, 'totalPages:', totalPages);
    if (currentPage < totalPages && !loading && !paginationLoading) {
      await handlePageChange(totalPages);
    }
  };

  // Apply filters to creators using Supabase queries
  const applyFilters = async (filters: DatabaseFilters, mode: CreatorListMode = currentMode) => {
    // For AI mode, apply client-side filtering to AI recommendations
    if (mode === 'ai' || currentMode === 'ai') {
      console.log('Applying client-side filters to AI recommendations');
      
      if (aiRecommendedCreators.length === 0) {
        console.warn('No AI recommendations available for filtering');
        return;
      }
      
      // Apply filters to AI recommendations
      let filteredAI = [...aiRecommendedCreators];
      
      // Apply niche filters
      if (filters.niches?.length) {
        filteredAI = filteredAI.filter(creator => {
          // Check if any of the creator's niches match the filter
          return creator.niches?.some(niche => 
            filters.niches!.includes(niche.name)
          ) || false;
        });
      }
      
      // Apply platform filters
      if (filters.platforms?.length) {
        filteredAI = filteredAI.filter(creator => {
          // Check social_media array for platform matches
          return creator.social_media?.some(social => 
            filters.platforms!.some(platform => 
              social.platform.toLowerCase().includes(platform.toLowerCase())
            )
          ) || false;
        });
      }
      
      // Apply follower count filters
      if (filters.followers_min !== undefined) {
        filteredAI = filteredAI.filter(creator => 
          (creator.followers || 0) >= filters.followers_min!
        );
      }
      if (filters.followers_max !== undefined) {
        filteredAI = filteredAI.filter(creator => 
          (creator.followers || 0) <= filters.followers_max!
        );
      }
      
      // Apply engagement filters
      if (filters.engagement_min !== undefined) {
        filteredAI = filteredAI.filter(creator => 
          (creator.engagement || 0) >= filters.engagement_min!
        );
      }
      if (filters.engagement_max !== undefined && filters.engagement_max < 500) {
        filteredAI = filteredAI.filter(creator => 
          (creator.engagement || 0) <= filters.engagement_max!
        );
      }
      
      // Apply average views filters
      if (filters.avg_views_min !== undefined) {
        filteredAI = filteredAI.filter(creator => 
          (creator.avg_views || 0) >= filters.avg_views_min!
        );
      }
      if (filters.avg_views_max !== undefined && filters.avg_views_max < 1_000_000) {
        filteredAI = filteredAI.filter(creator => 
          (creator.avg_views || 0) <= filters.avg_views_max!
        );
      }
      
      // Apply buzz score filters
      if (filters.buzz_scores?.length) {
        filteredAI = filteredAI.filter(creator => {
          const buzzScore = creator.buzz_score || 0;
          return filters.buzz_scores!.some(scoreRange => {
            switch (scoreRange) {
              case '90%+':
                return buzzScore >= 90;
              case '70-90%':
                return buzzScore >= 70 && buzzScore < 90;
              case '50-70%':
                return buzzScore >= 50 && buzzScore < 70;
              case '30-50%':
                return buzzScore >= 30 && buzzScore < 50;
              case 'Less than 30%':
                return buzzScore < 30;
              default:
                return false;
            }
          });
        });
      }
      
      // Apply location filters
      if (filters.locations?.length) {
        filteredAI = filteredAI.filter(creator => 
          filters.locations!.includes(creator.location || '')
        );
      }
      
      // Update state with filtered results
      setCreators(filteredAI);
      setFilteredCreators(filteredAI);
      updatePagination(filteredAI, 1); // Reset to page 1 after filtering
      
      // Update metrics based on filtered results
      const filteredMetrics = calculateMetricsFromCreators(filteredAI);
      setMetrics(filteredMetrics);
      setTotalFilteredCount(filteredAI.length);
      
      console.log(`AI mode filters applied: ${aiRecommendedCreators.length} → ${filteredAI.length} creators`);
      
      // Save filters to localStorage
      setCurrentFilters(filters);
      saveToLocalStorage('discover_currentFilters', filters);
      
      return;
    }
    
    // Normalize buzz score labels before using/saving
    if (filters.buzz_scores) {
      filters.buzz_scores = normalizeBuzzScoreLabels(filters.buzz_scores);
    }
    setCurrentFilters(filters);
    saveToLocalStorage('discover_currentFilters', filters);
    setLoading(true);
    setError(null);

    try {
      // Load filtered data first, then calculate metrics from the actual data
      await fetchPaginatedCreators(1, mode, filters);
      
      // Metrics will be updated by fetchPaginatedCreators based on the actual filtered data
      console.log('Filters applied, metrics updated from filtered data');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while filtering creators');
    } finally {
      setLoading(false);
    }
  };

  // Handle sorting - fetch data with server-side sorting
  const handleSort = async (field: SortField) => {
    const newDirection: 'asc' | 'desc' = sortState.field === field && sortState.direction === 'desc' ? 'asc' : 'desc';
    const newSortState: SortState = { field, direction: newDirection };
    setSortState(newSortState);
    saveToLocalStorage('discover_sortState', newSortState);
    
    if (currentMode === 'ai') {
      // For AI mode, handle sorting in-memory since all data is already loaded
      const creatorsToSort = filteredCreators.length > 0 ? filteredCreators : creators;
      if (creatorsToSort.length > 0) {
        const sortedCreators = [...creatorsToSort].sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (field) {
            case 'match_score':
              aValue = a.match_score || 0;
              bValue = b.match_score || 0;
              break;
            case 'followers':
              aValue = a.followers || 0;
              bValue = b.followers || 0;
              break;
            case 'engagement':
              aValue = a.engagement || 0;
              bValue = b.engagement || 0;
              break;
            case 'avg_views':
              aValue = a.avg_views || 0;
              bValue = b.avg_views || 0;
              break;
            default:
              aValue = a.followers || 0;
              bValue = b.followers || 0;
          }
          
          if (newDirection === 'asc') {
            return aValue - bValue;
          } else {
            return bValue - aValue;
          }
        });
        
        setCreators(sortedCreators);
        setFilteredCreators(sortedCreators);
        updatePagination(sortedCreators, 1); // Reset to page 1 after sorting
      }
      return;
    }
    
    // For 'all' mode, fetch data with server-side sorting
    await fetchCreatorsWithSorting(field, newDirection);
  };

  // Handle items per page change
  const handleItemsPerPageChange = async (newItemsPerPage: number) => {
    console.log('useCreatorData: handleItemsPerPageChange called with:', newItemsPerPage);
    console.log('Current mode:', currentMode);
    console.log('Current totalFilteredCount:', totalFilteredCount);
    
    // Prevent changes while loading
    if (loading || paginationLoading) {
      console.log('Skipping items per page change - already loading');
      return;
    }
    
    // Update items per page state
    setItemsPerPage(newItemsPerPage);
    saveToLocalStorage('discover_itemsPerPage', newItemsPerPage.toString());
    
    // Reset to page 1
    setCurrentPage(1);
    saveToLocalStorage('discover_currentPage', '1');
    
    // Clear caches to force fresh load with new items per page
    const cacheKeysToClear = Array.from(creatorDataCache.keys()).filter(key => 
      key.includes(`${currentMode}_creators_`)
    );
    cacheKeysToClear.forEach(key => creatorDataCache.delete(key));
    console.log(`Cleared ${cacheKeysToClear.length} cache entries for items per page change`);
    
    // Fetch new page data with updated items per page
    console.log('Fetching page 1 with new items per page:', newItemsPerPage);
    await fetchPaginatedCreators(1, currentMode, currentFilters, newItemsPerPage);
  };

  // Fetch creators with server-side sorting
  const fetchCreatorsWithSorting = async (sortField: SortField, sortDirection: 'asc' | 'desc', page: number = currentPage) => {
    const cachedBeforeFetch = loadCachedPage(currentFilters, page, { field: sortField, direction: sortDirection }, itemsPerPage, currentMode);
    setLoading(!cachedBeforeFetch);
    setError(null);
    
    try {
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage - 1;
      
      // Determine which table to use
      const { table, nicheField } = await getTableAndField();
      
      // Map frontend field names to database column names
      const getDatabaseField = (field: SortField): string => {
        switch (field) {
          case 'match_score':
            return 'buzz_score'; // Use buzz_score as proxy for match_score
          case 'followers':
            return 'followers_count';
          case 'avg_views':
            return 'average_views';
          case 'engagement':
            return 'engagement_rate';
          default:
            return 'followers_count';
        }
      };

      const databaseField = getDatabaseField(sortField);
      
      // First, get the total count of all matching records (without range)
      let countQuery = supabase
        .from(table)
        .select('*', { count: 'planned', head: true });
      
      // Apply the same filters to the count query
      if (currentFilters.niches?.length) {
        countQuery = countQuery.in(nicheField, currentFilters.niches);
      }
      if (currentFilters.platforms?.length) {
        countQuery = countQuery.or(buildPlatformOrClause(currentFilters.platforms));
      }
      if (currentFilters.followers_min !== undefined) {
        countQuery = countQuery.gte('followers_count', currentFilters.followers_min);
      }
      if (currentFilters.followers_max !== undefined) {
        countQuery = countQuery.lte('followers_count', currentFilters.followers_max);
      }
      if (currentFilters.engagement_min !== undefined) {
        countQuery = countQuery.gte('engagement_rate', currentFilters.engagement_min);
      }
      if (currentFilters.engagement_max !== undefined) {
        if (currentFilters.engagement_max < 500) {
          countQuery = countQuery.lte('engagement_rate', currentFilters.engagement_max);
        }
      }
      if (currentFilters.avg_views_min !== undefined) {
        countQuery = countQuery.gte('average_views', currentFilters.avg_views_min);
      }
      if (currentFilters.avg_views_max !== undefined) {
        if (currentFilters.avg_views_max < 1000000) {
          countQuery = countQuery.lte('average_views', currentFilters.avg_views_max);
        }
      }
      // Buzz score filter (discrete ranges combined with OR)
      if (currentFilters.buzz_scores?.length) {
        const toClause = (label: string): string | null => {
          switch (label) {
            case '90%+':
              return 'buzz_score.gte.90';
            case '70-90%':
              return 'and(buzz_score.gte.70,buzz_score.lt.90)';
            case '50-70%':
              return 'and(buzz_score.gte.50,buzz_score.lt.70)';
            case '30-50%':
              return 'and(buzz_score.gte.30,buzz_score.lt.50)';
            case 'Less than 30%':
              return 'buzz_score.lt.30';
            default:
              return null;
          }
        };
        const clauses = currentFilters.buzz_scores
          .map(toClause)
          .filter((c): c is string => !!c);
        if (clauses.length > 0) {
          countQuery = countQuery.or(clauses.join(','));
        }
      }
      if (currentFilters.locations?.length) {
        countQuery = countQuery.in('location', currentFilters.locations);
      }
      
      // Email filter for count query
      if (currentFilters.email_required !== undefined) {
        if (currentFilters.email_required) {
          // Count only creators with valid email (contains @ symbol)
          countQuery = countQuery.like('email', '%@%');
        } else {
          // Count only creators without email
          countQuery = countQuery.or('email.is.null,email.eq.,email.not.like.%@%');
        }
      }
      
      // Try cached count first (include buzz scores normalized already)
      const countHash = getFilterHash(currentFilters);
      let totalCount = getCachedCount(countHash);
      if (totalCount === null) {
        const { count } = await countQuery;
        totalCount = typeof count === 'number' ? count : 0;
        setCachedCount(countHash, totalCount);
      }
      
      // Build query with server-side sorting
      let query = supabase
        .from(table)
        .select('*')
        .order(databaseField, { ascending: sortDirection === 'asc' })
        .range(startIndex, endIndex);
      
      // Apply filters
      // Buzz score ranges (OR over labeled buckets)
      if (currentFilters.buzz_scores?.length) {
        const toClause = (label: string): string | null => {
          switch (label) {
            case '90%+':
              return 'buzz_score.gte.90';
            case '70-90%':
              return 'and(buzz_score.gte.70,buzz_score.lt.90)';
            case '50-70%':
              return 'and(buzz_score.gte.50,buzz_score.lt.70)';
            case '30-50%':
              return 'and(buzz_score.gte.30,buzz_score.lt.50)';
            case 'Less than 30%':
              return 'buzz_score.lt.30';
            default:
              return null;
          }
        };
        const clauses = currentFilters.buzz_scores
          .map(toClause)
          .filter((c): c is string => !!c);
        if (clauses.length > 0) {
          query = query.or(clauses.join(','));
        }
      }
      if (currentFilters.niches?.length) {
        query = query.in(nicheField, currentFilters.niches);
      }
      if (currentFilters.platforms?.length) {
        query = query.or(buildPlatformOrClause(currentFilters.platforms));
      }
      if (currentFilters.followers_min !== undefined) {
        query = query.gte('followers_count', currentFilters.followers_min);
      }
      if (currentFilters.followers_max !== undefined) {
        query = query.lte('followers_count', currentFilters.followers_max);
      }
      if (currentFilters.engagement_min !== undefined) {
        query = query.gte('engagement_rate', currentFilters.engagement_min);
      }
      if (currentFilters.engagement_max !== undefined) {
        if (currentFilters.engagement_max < 500) {
          query = query.lte('engagement_rate', currentFilters.engagement_max);
        }
      }
      if (currentFilters.avg_views_min !== undefined) {
        query = query.gte('average_views', currentFilters.avg_views_min);
      }
      if (currentFilters.avg_views_max !== undefined) {
        if (currentFilters.avg_views_max < 1000000) {
          query = query.lte('average_views', currentFilters.avg_views_max);
        }
      }
      // Remove legacy hack that forced no results in some combinations
      if (currentFilters.locations?.length) {
        query = query.in('location', currentFilters.locations);
      }
      
      // Email filter
      if (currentFilters.email_required !== undefined) {
        if (currentFilters.email_required) {
          // Show only creators with valid email (contains @ symbol)
          query = query.like('email', '%@%');
        } else {
          // Show only creators without email
          query = query.or('email.is.null,email.eq.,email.not.like.%@%');
        }
      }
      
      // Instant UI already handled by cachedBeforeFetch

      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      
      // Transform creators
      let transformedCreators: Creator[] = [];
      try {
        transformedCreators = await Promise.all((data || []).map(transformCreatorData));
      } catch (transformError) {
        // Error transforming creators - return empty array to prevent crash
        transformedCreators = [];
      }
      
      // This function now handles both 'all' and 'ai' modes
      console.log('fetchCreatorsWithSorting: Processing', currentMode, 'mode with', transformedCreators.length, 'creators');
      
      // Set state variables for both 'all' and 'ai' modes
      console.log('Setting', currentMode, 'mode state with', transformedCreators.length, 'creators');
      
      // Set state variables for both 'all' and 'ai' modes
      if (currentMode === 'ai') {
        // For AI mode, set AI-specific state
        setAiRecommendedCreators(transformedCreators);
        setCreators(transformedCreators);
        setFilteredCreators(transformedCreators);
        console.log('AI mode: Set state with', transformedCreators.length, 'creators');
      } else {
        // For 'all' mode, cache all creators for future use
      setAllCreators(transformedCreators);
      setCreators(transformedCreators);
      setFilteredCreators(transformedCreators);
      }
      
      // For pagination, we need to slice the data based on page size
      const sliceStartIndex = 0;
      const sliceEndIndex = Math.min(itemsPerPage, transformedCreators.length);
      const paginatedData = transformedCreators.slice(sliceStartIndex, sliceEndIndex);
      setPaginatedCreators(paginatedData);
      console.log('Paginated data set:', paginatedData.length, 'creators for page', page);
      
      setCurrentPage(page);
      saveToLocalStorage('discover_currentPage', page);
      
      // Set total pages based on the total count of all matching records
      if (typeof totalCount === 'number') {
        const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
        setTotalPages(totalPages);
        console.log('Total pages set to:', totalPages);
      }
      
      // Cache the total count for metrics
      setTotalFilteredCount(totalCount || transformedCreators.length);

      // Save page cache
      saveCachedPage(currentFilters, page, { field: sortField, direction: sortDirection }, transformedCreators, totalCount, itemsPerPage);
    } catch (err) {
      const hasVisibleData = Array.isArray(paginatedCreators) && paginatedCreators.length > 0;
      if (!hasVisibleData) {
        setError(err instanceof Error ? err.message : 'Failed to load creators');
      }
    } finally {
      setLoading(false);
    }
  };



  // Switch between AI recommendations and all creators
  const switchMode = async (mode: CreatorListMode) => {
    console.log('Switching mode from', currentMode, 'to', mode);
    
    // Prevent rapid mode switching
    if (mode === currentMode) {
      console.log('Already in this mode, ignoring switch');
      return;
    }
    
    // Prevent multiple rapid switches
    if (isModeSwitching) {
      console.log('Mode switch already in progress, ignoring');
      return;
    }
    
    setIsModeSwitching(true);
    setLoading(true);
    
    try {
      // Update mode first
    setCurrentMode(mode);
    saveToLocalStorage('discover_currentMode', mode);
    
    // Load appropriate data based on mode
    if (mode === 'ai') {
        console.log('Switching to AI mode...');
        
        // Clear all mode data immediately for clear separation
        setAllCreators([]);
        setCreators([]);
        setFilteredCreators([]);
        setPaginatedCreators([]);
        
        // Keep All Creators cache for fast mode switching (will expire naturally after 5 minutes)
        console.log('Keeping All Creators cache for fast mode switching');
        
        // Always fetch fresh paginated data for AI mode to ensure correct pagination
        console.log('Loading fresh AI recommendations with proper pagination...');
        // Reset pagination state before loading
        setCurrentPage(1);
        saveToLocalStorage('discover_currentPage', '1');
        
        // Use fetchPaginatedCreators for consistent pagination behavior
        await fetchPaginatedCreators(1, 'ai', {});
        
        // Preloading temporarily disabled for debugging
        
    } else {
        // For 'all' mode, use separate pagination and filters
        console.log('Switching to all mode...');
        
        // Clear AI data immediately for clear separation
        setCreators([]);
        setFilteredCreators([]);
        setPaginatedCreators([]);
        
        // Keep AI Recommendations cache for fast mode switching (will expire naturally after 8 minutes)
        console.log('Keeping AI Recommendations cache for fast mode switching');
        
        // Check if we have cached all creators data
        if (allCreators.length > 0) {
          console.log('Using cached all creators:', allCreators.length, 'creators');
          setCreators(allCreators);
          setFilteredCreators(allCreators);
          setPaginatedCreators(allCreators);
          setCurrentPage(1);
          saveToLocalStorage('discover_currentPage', '1');
          
          // Calculate metrics for all mode - use database metrics for accurate representation
          try {
            const allMetrics = await fetchCreatorMetrics({}, setTotalFilteredCount);
            setMetrics(allMetrics);
            // Calculate total pages based on the actual total count from metrics
            const actualTotalCount = allMetrics.total_creators || allCreators.length;
            const totalPages = Math.max(1, Math.ceil(actualTotalCount / itemsPerPage));
            setTotalPages(totalPages);
            console.log('All mode metrics updated from database (cached data):', allMetrics);
            console.log('All mode total pages set to:', totalPages, 'based on total count:', actualTotalCount);
          } catch (error) {
            console.error('Error fetching all mode metrics:', error);
            // Fallback to calculating from cached data
            const fallbackMetrics = calculateMetricsFromCreators(allCreators);
            setMetrics(fallbackMetrics);
            setTotalFilteredCount(allCreators.length);
            setTotalPages(1); // Only 1 page with cached data
            console.log('All mode metrics fallback from cached data:', fallbackMetrics);
          }
        } else {
          console.log('No all creators cached, loading fresh...');
          // Reset pagination state before loading
          setCurrentPage(1);
          saveToLocalStorage('discover_currentPage', '1');
          // Load all creators without any filters applied for the initial "all" view
          await fetchPaginatedCreators(1, 'all', {});
        }
        
        // Preloading temporarily disabled for debugging
      }
    } catch (error) {
      console.error('Error during mode switch:', error);
      setError('Failed to switch mode');
    } finally {
      // Clear loading state immediately for smooth transition
      setLoading(false);
      setIsModeSwitching(false);
    }
  };

  // Load personalized AI recommendations from stored matches (page-by-page)
  const loadPersonalizedAIRecommendations = async () => {
    try {
      console.log('🔍 Loading personalized AI recommendations...');
      setLoading(true);
      
      // Clear any cached data first to avoid stale data
      setAiRecommendedCreators([]);
      setCreators([]);
      setFilteredCreators([]);
      setPaginatedCreators([]);
      
      // Use unified pagination system for consistency
      await fetchPaginatedCreators(1, 'ai', {});
      
      console.log(`✅ Loaded AI recommendations: showing page 1 with optimized loading`);
      
    } catch (error) {
      console.error('❌ Error loading personalized AI recommendations:', error);
      console.error('❌ Full error details:', error instanceof Error ? error.message : 'Unknown error', error instanceof Error ? error.stack : '');
      console.warn('⚠️ Falling back to general recommendations...');
      
      // Fallback to general recommendations on error
      try {
        await loadGeneralAIRecommendations();
        console.log('✅ Successfully loaded general recommendations as fallback');
      } catch (fallbackError) {
        console.error('❌ Even fallback recommendations failed:', fallbackError);
        setError('Failed to load any recommendations. Please try refreshing the page.');
      }
    } finally {
      setLoading(false); // Clear loading state when done
    }
  };

  // Generate new AI matches and store them
  const generateAIMatches = async () => {
    try {
      console.log('⚡ Generating new AI matches...');
      
      // Call the API to generate and store matches
      const response = await fetch('/api/ai-matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI matches generation API error:', response.status, errorText);
        
        // Check if it's a table not found error
        if (errorText.includes('TABLE_NOT_FOUND') || errorText.includes('ai_matches_table.sql')) {
          console.error('🚨 CRITICAL: AI matches table does not exist in database!');
          console.error('📋 SOLUTION: Run this SQL migration in your Supabase dashboard:');
          console.error('📄 File: database/migrations/create_ai_matches_table.sql');
          throw new Error('AI matches table not found - please run the database migration');
        }
        
        throw new Error(`AI match generation failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Generated AI matches response:', data);
      
      if (data.success) {
        console.log(`✅ Successfully generated ${data.matches_generated || 'unknown'} AI matches`);
        // After generating, load the matches
        await loadStoredAIMatches();
      } else {
        throw new Error(`AI match generation failed: ${data.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('❌ Error generating AI matches:', error);
      console.warn('⚠️ Falling back to general recommendations due to AI match generation failure');
      // Fallback to general recommendations
      await loadGeneralAIRecommendations();
    }
  };





  // Load all AI matches for sorting and filtering (keep for compatibility)
  const loadAllAIMatches = async () => {
    try {
      console.log('Loading all AI matches for sorting/filtering...');
      
      // Check cache first
      const cacheKey = 'ai_matches_all';
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log('✅ Using cached all AI matches, count:', cachedData.length);
        return cachedData;
      }
      
      console.log('No cached data found, fetching from API...');
      // Use a reasonable limit that matches the total count we know we have (502)
      // The API default limit is 50, but we can safely request up to 500-600
      console.log('Making API request with 10 second timeout...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/ai-matches?page=1&limit=600', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      console.log('API response status:', response.status, response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI matches API error:', response.status, errorText);
        throw new Error(`AI matches API failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API response data:', {
        success: data.success,
        matchesCount: data.matches ? data.matches.length : 'no matches',
        totalMatches: data.total_matches
      });
      
      if (data.success && data.matches) {
        console.log('Transforming', data.matches.length, 'matches...');
        
        // Transform all matches
        const transformedMatches = await Promise.all(
          data.matches.map(async (match: any) => {
            const creator = match.creatordata;
            const transformedCreator = await transformCreatorData(creator);
            return {
              ...transformedCreator,
              match_score: match.match_score,
              match_explanation: match.match_explanation
            };
          })
        );
        
        console.log('Transformation complete. Final count:', transformedMatches.length);
        
        // Cache all matches
        setCachedData(cacheKey, transformedMatches, CACHE_DURATIONS.AI_MATCHES);
        console.log('Cached all AI matches');
        
        return transformedMatches;
      }
      
      console.log('No valid data returned from API');
      return [];
    } catch (error) {
      console.error('Error loading all AI matches:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('API request timed out after 10 seconds');
        } else {
          console.error('Error details:', error.message);
        }
      } else {
        console.error('Error details:', String(error));
      }
      return [];
    }
  };
  
  // Load stored AI matches from database (page by page)
  const loadStoredAIMatchesPage = async (page: number = 1) => {
    try {
      // Check cache for this specific page
      const cacheKey = `ai_matches_page_${page}`;
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log(`✅ Using cached AI matches for page ${page}`);
        return cachedData;
      }
      
      console.log(`Loading AI matches page ${page} from database...`);
      
      // Load only the specific page
      const response = await fetch(`/api/ai-matches?page=${page}&limit=${DEFAULT_CREATORS_PER_PAGE}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI matches API error:', response.status, errorText);
        throw new Error(`AI matches API failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.matches) {
        // Transform the matches for this page
        const transformedMatches = await Promise.all(
          data.matches.map(async (match: any) => {
            const creator = match.creatordata;
            const transformedCreator = await transformCreatorData(creator);
            return {
              ...transformedCreator,
              match_score: match.match_score,
              match_explanation: match.match_explanation
            };
          })
        );
        
        // Cache this page
        setCachedData(cacheKey, {
          matches: transformedMatches,
          totalCount: data.total_matches || 50
        }, CACHE_DURATIONS.AI_MATCHES);
        
        return {
          matches: transformedMatches,
          totalCount: data.total_matches || 50
        };
      }
      
      return { matches: [], totalCount: 0 };
    } catch (error) {
      console.error('Error loading AI matches page:', error);
      throw error;
    }
  };
  
  // Load stored AI matches from database (legacy - loads all at once)
  const loadStoredAIMatches = async () => {
    try {
      // Check cache first
      const cacheKey = 'ai_matches_50';
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log('✅ Using cached AI matches data');
        const transformedMatches = await Promise.all(
          cachedData.matches.map(async (match: any) => {
            const creator = match.creatordata;
            const transformedCreator = await transformCreatorData(creator);
            return {
              ...transformedCreator,
              match_score: match.match_score,
              match_explanation: match.match_explanation
            };
          })
        );
        
        setAiRecommendedCreators(transformedMatches);
        setCreators(transformedMatches);
        setFilteredCreators(transformedMatches);
        updatePagination(transformedMatches, 1);
        
        const aiMetrics = calculateMetricsFromCreators(transformedMatches);
        setMetrics(aiMetrics);
        setTotalFilteredCount(transformedMatches.length);
        
        console.log(`✅ Loaded ${transformedMatches.length} AI matches from cache`);
        return;
      }
      
      console.log('Loading AI matches from database...');
      
      // Load first page with reasonable limit for initial display
      const response = await fetch('/api/ai-matches?page=1&limit=50');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI matches API error:', response.status, errorText);
        
        // Check if it's a table not found error
        if (errorText.includes('TABLE_NOT_FOUND') || errorText.includes('ai_matches_table.sql')) {
          console.error('🚨 CRITICAL: AI matches table does not exist in database!');
          console.error('📋 SOLUTION: Run this SQL migration in your Supabase dashboard:');
          console.error('📄 File: database/migrations/create_ai_matches_table.sql');
          throw new Error('AI matches table not found - please run the database migration');
        }
        
        throw new Error(`AI matches API failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('AI matches response:', data);
      
      if (data.success && data.matches && data.matches.length > 0) {
        // Only regenerate if we have very few matches (< 10) to avoid unnecessary regeneration
        if (data.matches.length < 10) {
          console.warn(`⚠️ Only ${data.matches.length} AI matches found. Regenerating for better coverage...`);
          await generateAIMatches();
          return; // generateAIMatches will call loadStoredAIMatches again
        }
        
        // Transform the stored matches to match the Creator interface (optimized for speed)
        console.log('🚀 Transforming AI matches for fast loading...');
        const transformStart = Date.now();
        
        const transformedMatches = await Promise.all(
          data.matches.map(async (match: any) => {
            const creator = match.creatordata;
            const transformedCreator = await transformCreatorData(creator);
            return {
              ...transformedCreator,
              match_score: match.match_score,
              match_explanation: match.match_explanation
            };
          })
        );
        
        const transformTime = Date.now() - transformStart;
        console.log(`⚙️ Data transformation completed in ${transformTime}ms for ${transformedMatches.length} creators`);
        
        // Set AI recommendations state
        setAiRecommendedCreators(transformedMatches);
        setCreators(transformedMatches);
        setFilteredCreators(transformedMatches);
        updatePagination(transformedMatches, 1);
        
        // Update metrics
        const aiMetrics = calculateMetricsFromCreators(transformedMatches);
        setMetrics(aiMetrics);
        setTotalFilteredCount(transformedMatches.length);
        
        // Cache the successful response for future use
        setCachedData(cacheKey, data, CACHE_DURATIONS.AI_MATCHES);
        
        console.log(`✅ Loaded ${transformedMatches.length} AI matches from database successfully (cached for ${CACHE_DURATIONS.AI_MATCHES / 1000 / 60} minutes)`);
      } else {
        // No matches found - this shouldn't happen if onboarding worked correctly
        console.warn('⚠️ No AI matches found in database. This should have been generated during onboarding.');
        console.log('🔄 Attempting to generate matches now as fallback...');
        await generateAIMatches();
      }
      
    } catch (error) {
      console.error('❌ Error loading stored AI matches:', error);
      throw error;
    }
  };

  // Fallback function for general AI recommendations
  const loadGeneralAIRecommendations = async () => {
    try {
        const { data, error: queryError } = await supabase
          .from('healthwellness')
          .select('*')
          .order('followers_count', { ascending: false })
        .limit(50);
        
        if (queryError) throw queryError;
        
        // Transform the data
        let transformedCreators = await Promise.all((data || []).map(transformCreatorData));
        
      // Apply general scoring (performance-based)
        transformedCreators = transformedCreators.map(creator => ({
          ...creator,
        match_score: calculateGeneralMatchScore(creator),
        match_explanation: `Recommended based on strong performance metrics and ${creator.followers >= 1000000 ? 'large' : 'engaged'} audience`
        }));
        
      // Sort by match score
        transformedCreators.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
        
      // Don't limit to 50 - keep all for proper pagination
        setAiRecommendedCreators(transformedCreators);
        setCreators(transformedCreators);
        setFilteredCreators(transformedCreators);
        updatePagination(transformedCreators, 1);
      
    } catch (error) {
      console.error('Error loading general AI recommendations:', error);
      throw error;
    }
  };

  // Load creators from Supabase with pagination
  const loadCreators = async (mode: CreatorListMode = currentMode) => {
    console.log('loadCreators called with mode:', mode);
    setLoading(true);
    setError(null);

    try {
      // For 'all' mode, just set up the initial state and load first page
      if (mode === 'all') {
        console.log('Loading all creators with pagination...');
        // Do not clear creators to avoid visible empty glitch while fetching
        // Load first page immediately (will render cached page if present)
        await fetchPaginatedCreators(1, 'all', currentFilters);
      } else if (mode === 'ai') {
        console.log('Loading AI recommendations...');
        // For 'ai' mode, load personalized recommendations based on user onboarding data
        await loadPersonalizedAIRecommendations();
      }
      
    } catch (err) {
      console.error('Error in loadCreators:', err);
      setError(err instanceof Error ? err.message : 'Failed to load creators');
    } finally {
      setLoading(false);
    }
  };

  // Process AI results with proper state management and metrics
  const processAIResults = async (transformedCreators: Creator[], totalCount: number, pageNum: number, itemsPerPageCount: number, shouldUpdatePage: boolean = true) => {
    // Set AI-specific state
    setAiRecommendedCreators(transformedCreators);
    setCreators(transformedCreators);
    setFilteredCreators(transformedCreators);
    setPaginatedCreators(transformedCreators);
    
    if (shouldUpdatePage) {
      setCurrentPage(pageNum);
      saveToLocalStorage('discover_currentPage', pageNum);
    }
    
    // Set total pages based on the total count from API
    if (typeof totalCount === 'number') {
      const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPageCount));
      setTotalPages(totalPages);
      console.log(`AI mode: Set total pages to ${totalPages} (${totalCount} total creators, ${itemsPerPageCount} per page)`);
    }
    
    // Get metrics from ALL AI matches, not just current page
    let aiMetrics;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        aiMetrics = await fetchAIMetrics(user.id, setTotalFilteredCount);
        setMetrics(aiMetrics);
        console.log('AI mode metrics updated from database (all matches):', aiMetrics);
      } else {
        throw new Error('No authenticated user for AI metrics');
      }
    } catch (error) {
      console.error('Error fetching AI mode metrics:', error);
      // Fallback to calculating from current page data
      aiMetrics = calculateMetricsFromCreators(transformedCreators);
      setMetrics(aiMetrics);
      setTotalFilteredCount(totalCount || transformedCreators.length);
      console.log('AI mode metrics fallback (page data):', aiMetrics);
    }
    
    console.log(`AI mode: Successfully processed ${transformedCreators.length} creators from page, total: ${totalCount}`);
    
    // Cache AI results for faster subsequent access
    const fallbackMetrics = calculateMetricsFromCreators(transformedCreators);
    const aiCacheData = {
      creators: transformedCreators,
      totalPages: Math.max(1, Math.ceil((totalCount || 0) / itemsPerPageCount)),
      totalCount: totalCount || transformedCreators.length,
      metrics: aiMetrics || fallbackMetrics,
      page: pageNum
    };
    
    // AI pages get longer cache duration - use same key format as lookup
    const aiCacheDuration = pageNum === 1 ? CACHE_DURATIONS.AI_PAGE_1 : CACHE_DURATIONS.AI_PAGES;
    // Use normalized cache key format (empty filters and default sort for AI mode)
    const aiMemoryCacheKey = `ai_creators_${JSON.stringify({})}_${pageNum}_${JSON.stringify({ field: 'followers', direction: 'desc' })}_${itemsPerPageCount}`;
    
    setCachedData(aiMemoryCacheKey, aiCacheData, aiCacheDuration);
    console.log(`✅ Cached AI page ${pageNum} for ${aiCacheDuration / 1000 / 60} minutes ${pageNum === 1 ? '(extended for page 1)' : ''}`);
    
    // Preloading temporarily disabled to prevent crashes
    // TODO: Re-implement preloading after fixing function definition
  };

  // Fetch paginated creators from Supabase
  const fetchPaginatedCreators = async (page: number, mode: CreatorListMode = currentMode, filters: DatabaseFilters = currentFilters, customItemsPerPage?: number, shouldUpdatePage: boolean = true) => {
    console.log(`🔍 DEBUG fetchPaginatedCreators START: page=${page}, mode=${mode}, shouldUpdatePage=${shouldUpdatePage}`);
    console.log(`🔍 DEBUG Current state: loading=${loading}, paginationLoading=${paginationLoading}, currentPage=${currentPage}`);
    
    // Ensure filters are normalized at call time too (when coming from restore/cache)
    if (filters.buzz_scores) {
      filters = { ...filters, buzz_scores: normalizeBuzzScoreLabels(filters.buzz_scores) };
    }
    
    // Use custom items per page if provided, otherwise use state
    const currentItemsPerPage = customItemsPerPage || itemsPerPage;
    
    // Check memory cache first for faster access (include mode and itemsPerPage in cache key)
    // For AI mode, always use empty filters and default sort since AI doesn't use filters
    const cacheFilters = mode === 'ai' ? {} : filters;
    const cacheSortState = mode === 'ai' ? { field: 'followers', direction: 'desc' } : sortState;
    const memoryCacheKey = `${mode}_creators_${JSON.stringify(cacheFilters)}_${page}_${JSON.stringify(cacheSortState)}_${currentItemsPerPage}`;
    const memoryCache = getCachedData(memoryCacheKey);
    
    if (memoryCache) {
      cacheStats.hits++;
      console.log(`⚡ Instant loading from memory cache for page ${page}, mode: ${mode} (Hit rate: ${cacheStats.hitRate}%)`);
      console.log('Memory cache data:', {
        page: memoryCache.page,
        totalPages: memoryCache.totalPages,
        creatorsCount: memoryCache.creators?.length,
        cacheAge: `${Math.round((Date.now() - memoryCache._cacheTimestamp) / 1000)}s old`
      });
      
      // Set mode-specific state
      if (mode === 'ai') {
        setAiRecommendedCreators(memoryCache.creators);
      } else {
        setAllCreators(memoryCache.creators);
      }
      
      // Set common state
      setCreators(memoryCache.creators);
      setFilteredCreators(memoryCache.creators);
      setPaginatedCreators(memoryCache.creators);
      
      if (shouldUpdatePage) {
        setCurrentPage(page);
        saveToLocalStorage('discover_currentPage', page);
      }
      
      setTotalPages(memoryCache.totalPages);
      setTotalFilteredCount(memoryCache.totalCount);
      
      // For AI mode, always use session-cached AI metrics instead of page metrics
      if (mode === 'ai') {
        const aiMetricsCacheKey = `ai_metrics_session_${(await supabase.auth.getUser()).data.user?.id}`;
        const cachedAIMetrics = getCachedData(aiMetricsCacheKey);
        if (cachedAIMetrics) {
          setMetrics(cachedAIMetrics);
        } else {
          setMetrics(memoryCache.metrics);
        }
      } else {
        setMetrics(memoryCache.metrics);
      }
      
      setLoading(false);
      setPaginationLoading(false);
      
      // Safe preloading: only preload next page on user actions
      setTimeout(() => {
        safePreloadAdjacentPages(page, memoryCache.totalPages, mode, filters, sortState, itemsPerPage, fetchPaginatedCreators, true);
      }, 200);
      
      return;
    }
    
    // Check localStorage cache as fallback
    const cachedBeforeFetch = loadCachedPage(filters, page, sortState, currentItemsPerPage, mode);
    const cacheKey = `${JSON.stringify(filters)}-${page}-${JSON.stringify(sortState)}`;
    
    // If we have cached data, use it immediately
    if (cachedBeforeFetch && cachedBeforeFetch.creators && cachedBeforeFetch.totalCount) {
      console.log(`Using localStorage cached data for page ${page}, mode: ${mode}`);
      
      // Safe preloading: only preload next page on user actions
      setTimeout(() => {
        safePreloadAdjacentPages(page, Math.ceil(cachedBeforeFetch.totalCount / itemsPerPage), mode, filters, sortState, itemsPerPage, fetchPaginatedCreators, true);
      }, 200);
      
      // Set the cached data to state
      const { creators: cachedCreators, totalCount } = cachedBeforeFetch;
      
      // Set mode-specific state
      if (mode === 'ai') {
        setAiRecommendedCreators(cachedCreators);
      } else {
        setAllCreators(cachedCreators);
      }
      
      setCreators(cachedCreators);
      setFilteredCreators(cachedCreators);
      setPaginatedCreators(cachedCreators);
      
      if (shouldUpdatePage) {
        setCurrentPage(page);
        saveToLocalStorage('discover_currentPage', page);
      }
      setTotalPages(Math.max(1, Math.ceil(totalCount / currentItemsPerPage)));
      setTotalFilteredCount(totalCount);
      setLoading(false);
      setPaginationLoading(false);
      
      // Preloading temporarily disabled to prevent crashes
      // TODO: Re-implement preloading after fixing function definition
      
      return;
    }
    
    // Smart loading states - only show skeleton if no cached data available
    const hasAnyCachedData = cachedBeforeFetch || memoryCache;
    setLoading(!hasAnyCachedData);
    setPaginationLoading(true);
    setError(null);
    
    if (!hasAnyCachedData) {
      cacheStats.misses++;
    }
    console.log(`🔄 Loading page ${page} (${mode} mode) - fresh load (Hit rate: ${cacheStats.hitRate}%)`);
    
    try {
      const startIndex = (page - 1) * currentItemsPerPage;
      const endIndex = startIndex + currentItemsPerPage - 1;
      
      // Handle AI mode differently - use API instead of direct database query
      if (mode === 'ai') {
        console.log(`fetchPaginatedCreators: AI mode - calling /api/ai-matches for page ${page}`);
        
        const response = await fetch(`/api/ai-matches?page=${page}&limit=${currentItemsPerPage}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI matches API error:', response.status, errorText);
          throw new Error(`AI matches API failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('AI API response:', {
          success: data.success,
          matchesCount: data.matches?.length,
          totalMatches: data.total_matches,
          page: data.page,
          limit: data.limit
        });
        
        if (data.success && data.matches) {
          // Transform AI matches
          const transformedCreators = await Promise.all(
            data.matches.map(async (match: any) => {
              const creator = match.creatordata;
              const transformedCreator = await transformCreatorData(creator);
              return {
                ...transformedCreator,
                match_score: match.match_score,
                match_explanation: match.match_explanation
              };
            })
          );
          
          // Use total_matches from API response for correct pagination
          const totalCount = data.total_matches;
          console.log(`AI mode: Got ${transformedCreators.length} creators, total: ${totalCount}`);
          
          // Process AI mode results using the common processing logic
          await processAIResults(transformedCreators, totalCount, page, currentItemsPerPage, shouldUpdatePage);
          return;
        } else {
          throw new Error('AI matches API returned invalid data');
        }
      }
      
      // For 'all' mode, continue with direct database queries
      // Determine which table to use
      const { table, nicheField } = await getTableAndField();
      console.log(`🔍 Using table: ${table}, nicheField: ${nicheField}`);
      
      // Map frontend field names to database column names
      const getDatabaseField = (field: SortField): string => {
        switch (field) {
          case 'match_score':
            return 'buzz_score'; // Use buzz_score as proxy for match_score
          case 'followers':
            return 'followers_count';
          case 'avg_views':
            return 'average_views';
          case 'engagement':
            return 'engagement_rate';
          default:
            return 'followers_count';
        }
      };

      // Use current sort state or default to followers_count descending
      const sortField = sortState.field ? getDatabaseField(sortState.field) : 'followers_count';
      const sortDirection = sortState.field ? sortState.direction === 'asc' : false;
      
      // First, get the total count of all matching records (without range)
      let countQuery = supabase
        .from(table)
        .select('*', { count: 'planned', head: true });
      
      // Apply the same filters to the count query
      if (filters.niches?.length) {
        countQuery = countQuery.in(nicheField, filters.niches);
      }
      if (filters.platforms?.length) {
        countQuery = countQuery.or(buildPlatformOrClause(filters.platforms));
      }
      if (filters.followers_min !== undefined) {
        countQuery = countQuery.gte('followers_count', filters.followers_min);
      }
      if (filters.followers_max !== undefined) {
        countQuery = countQuery.lte('followers_count', filters.followers_max);
      }
      if (filters.engagement_min !== undefined) {
        countQuery = countQuery.gte('engagement_rate', filters.engagement_min);
      }
      if (filters.engagement_max !== undefined) {
        if (filters.engagement_max < 500) {
          countQuery = countQuery.lte('engagement_rate', filters.engagement_max);
        }
      }
      if (filters.avg_views_min !== undefined) {
        countQuery = countQuery.gte('average_views', filters.avg_views_min);
      }
      if (filters.avg_views_max !== undefined) {
        if (filters.avg_views_max < 1000000) {
          countQuery = countQuery.lte('average_views', filters.avg_views_max);
        }
      }
      if (filters.buzz_scores?.length) {
        // Build buzz score range conditions for count query (use OR over buckets)
        const toClause = (label: string): string | null => {
          switch (label) {
            case '90%+':
              return 'buzz_score.gte.90';
            case '70-90%':
              return 'and(buzz_score.gte.70,buzz_score.lt.90)';
            case '50-70%':
              return 'and(buzz_score.gte.50,buzz_score.lt.70)';
            case '30-50%':
              return 'and(buzz_score.gte.30,buzz_score.lt.50)';
            case 'Less than 30%':
              return 'buzz_score.lt.30';
            default:
              return null;
          }
        };
        const clauses = filters.buzz_scores
          .map(toClause)
          .filter((c): c is string => !!c);
        if (clauses.length > 0) {
          countQuery = countQuery.or(clauses.join(','));
        }
      }
      if (filters.locations?.length) {
        countQuery = countQuery.in('location', filters.locations);
      }
      
      // Email filter for count query
      if (filters.email_required !== undefined) {
        if (filters.email_required) {
          // Count only creators with valid email (contains @ symbol)
          countQuery = countQuery.like('email', '%@%');
        } else {
          // Count only creators without email
          countQuery = countQuery.or('email.is.null,email.eq.,email.not.like.%@%');
        }
      }
      
      // Try cached count first
      const countHash = getFilterHash(filters);
      let totalCount = getCachedCount(countHash);
      if (totalCount === null) {
        const { count } = await countQuery;
        totalCount = typeof count === 'number' ? count : 0;
        setCachedCount(countHash, totalCount);
      }
      
      // Instant UI already handled by cachedBeforeFetch

      // Get paginated data - optimized for speed
      let query = supabase
        .from(table)
        .select('*')
        .order(sortField, { ascending: sortDirection })
        .range(startIndex, endIndex);
      
      // Apply the same filters to the data query
      if (filters.niches?.length) {
        query = query.in(nicheField, filters.niches);
      }
      if (filters.platforms?.length) {
        query = query.or(buildPlatformOrClause(filters.platforms));
      }
      if (filters.followers_min !== undefined) {
        query = query.gte('followers_count', filters.followers_min);
      }
      if (filters.followers_max !== undefined) {
        query = query.lte('followers_count', filters.followers_max);
      }
      if (filters.engagement_min !== undefined) {
        query = query.gte('engagement_rate', filters.engagement_min);
      }
      if (filters.engagement_max !== undefined) {
        if (filters.engagement_max < 500) {
          query = query.lte('engagement_rate', filters.engagement_max);
        }
      }
      if (filters.avg_views_min !== undefined) {
        query = query.gte('average_views', filters.avg_views_min);
      }
      if (filters.avg_views_max !== undefined) {
        if (filters.avg_views_max < 1000000) {
          query = query.lte('average_views', filters.avg_views_max);
        }
      }
      if (filters.buzz_scores?.length) {
        // Build buzz score range conditions for data query (use OR over buckets)
        const toClause = (label: string): string | null => {
          switch (label) {
            case '90%+':
              return 'buzz_score.gte.90';
            case '70-90%':
              return 'and(buzz_score.gte.70,buzz_score.lt.90)';
            case '50-70%':
              return 'and(buzz_score.gte.50,buzz_score.lt.70)';
            case '30-50%':
              return 'and(buzz_score.gte.30,buzz_score.lt.50)';
            case 'Less than 30%':
              return 'buzz_score.lt.30';
            default:
              return null;
          }
        };
        const clauses = filters.buzz_scores
          .map(toClause)
          .filter((c): c is string => !!c);
        if (clauses.length > 0) {
          query = query.or(clauses.join(','));
        }
      }
      if (filters.locations?.length) {
        query = query.in('location', filters.locations);
      }
      
      // Email filter for data query
      if (filters.email_required !== undefined) {
        if (filters.email_required) {
          // Show only creators with valid email (contains @ symbol)
          query = query.like('email', '%@%');
        } else {
          // Show only creators without email
          query = query.or('email.is.null,email.eq.,email.not.like.%@%');
        }
      }
      
      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      
      // Transform creators with error handling
      let transformedCreators: Creator[] = [];
      try {
        transformedCreators = await Promise.all((data || []).map(transformCreatorData));
      } catch (transformError) {
        // Error transforming creators - return empty array to prevent crash
        transformedCreators = [];
      }
      
      // Check if we got fewer creators than expected and supplement if needed
      const expectedResults = Math.min(currentItemsPerPage, (totalCount || 0) - startIndex);
      if (transformedCreators.length < expectedResults && transformedCreators.length < currentItemsPerPage) {
        console.log(`🔄 All mode: Got ${transformedCreators.length} creators, expected ${expectedResults}. Fetching additional creators...`);
        
        // Calculate how many more we need
        const additionalNeeded = Math.min(expectedResults - transformedCreators.length, currentItemsPerPage - transformedCreators.length);
        const nextStartIndex = startIndex + (data?.length || 0);
        const nextEndIndex = nextStartIndex + additionalNeeded - 1;
        
        // Build supplemental query with same filters and sorting
        let supplementQuery = supabase
          .from(table)
          .select('*')
          .order(sortField, { ascending: sortDirection })
          .range(nextStartIndex, nextEndIndex);
        
        // Apply the same filters to the supplemental query
        if (filters.niches?.length) {
          supplementQuery = supplementQuery.in(nicheField, filters.niches);
        }
        if (filters.platforms?.length) {
          supplementQuery = supplementQuery.or(buildPlatformOrClause(filters.platforms));
        }
        if (filters.followers_min !== undefined) {
          supplementQuery = supplementQuery.gte('followers_count', filters.followers_min);
        }
        if (filters.followers_max !== undefined) {
          supplementQuery = supplementQuery.lte('followers_count', filters.followers_max);
        }
        if (filters.engagement_min !== undefined) {
          supplementQuery = supplementQuery.gte('engagement_rate', filters.engagement_min);
        }
        if (filters.engagement_max !== undefined) {
          if (filters.engagement_max < 500) {
            supplementQuery = supplementQuery.lte('engagement_rate', filters.engagement_max);
          }
        }
        if (filters.avg_views_min !== undefined) {
          supplementQuery = supplementQuery.gte('average_views', filters.avg_views_min);
        }
        if (filters.avg_views_max !== undefined) {
          if (filters.avg_views_max < 1000000) {
            supplementQuery = supplementQuery.lte('average_views', filters.avg_views_max);
          }
        }
        if (filters.buzz_scores?.length) {
          const toClause = (label: string): string | null => {
            switch (label) {
              case '90%+':
                return 'buzz_score.gte.90';
              case '70-90%':
                return 'and(buzz_score.gte.70,buzz_score.lt.90)';
              case '50-70%':
                return 'and(buzz_score.gte.50,buzz_score.lt.70)';
              case '30-50%':
                return 'and(buzz_score.gte.30,buzz_score.lt.50)';
              case 'Less than 30%':
                return 'buzz_score.lt.30';
              default:
                return null;
            }
          };
          const clauses = filters.buzz_scores
            .map(toClause)
            .filter((c): c is string => !!c);
          if (clauses.length > 0) {
            supplementQuery = supplementQuery.or(clauses.join(','));
          }
        }
        if (filters.locations?.length) {
          supplementQuery = supplementQuery.in('location', filters.locations);
        }
        
        // Email filter for supplement query
        if (filters.email_required !== undefined) {
          if (filters.email_required) {
            // Show only creators with valid email (contains @ symbol)
            supplementQuery = supplementQuery.like('email', '%@%');
          } else {
            // Show only creators without email
            supplementQuery = supplementQuery.or('email.is.null,email.eq.,email.not.like.%@%');
          }
        }
        
        try {
          const { data: supplementData, error: supplementError } = await supplementQuery;
          if (!supplementError && supplementData) {
            console.log(`📋 All mode: Fetching additional ${supplementData.length} creators...`);
            
            // Transform additional creators
            const additionalTransformed = await Promise.all(supplementData.map(transformCreatorData));
            transformedCreators = [...transformedCreators, ...additionalTransformed];
            
            console.log(`✅ All mode: Final result ${transformedCreators.length} creators after supplementation`);
          }
        } catch (supplementError) {
          console.warn('⚠️ All mode: Failed to fetch supplemental creators:', supplementError);
        }
      }
      
      // AI mode is handled separately above, this is only for 'all' mode
      console.log('fetchPaginatedCreators: Processing All mode with', transformedCreators.length, 'creators');
      
      // Set state variables for 'all' mode (AI mode handled separately above)
      setAllCreators(transformedCreators);
      setCreators(transformedCreators);
      setFilteredCreators(transformedCreators);
      setPaginatedCreators(transformedCreators);
      
      if (shouldUpdatePage) {
      setCurrentPage(page);
      saveToLocalStorage('discover_currentPage', page);
      }
      
      // Set total pages based on the total count of all matching records
      if (typeof totalCount === 'number') {
        const totalPages = Math.max(1, Math.ceil(totalCount / currentItemsPerPage));
        setTotalPages(totalPages);
      }

      // Update metrics for 'all' mode (AI mode metrics handled separately above)
      let finalMetrics;
      if (mode === 'all') {
        try {
          const allModeMetrics = await fetchCreatorMetrics(filters, setTotalFilteredCount);
          setMetrics(allModeMetrics);
          finalMetrics = allModeMetrics;
          console.log('All mode metrics updated from database:', allModeMetrics);
        } catch (error) {
          console.error('Error fetching all mode metrics:', error);
          // Fallback to calculating from current page data
          const fallbackMetrics = calculateMetricsFromCreators(transformedCreators);
          setMetrics(fallbackMetrics);
          setTotalFilteredCount(totalCount || transformedCreators.length);
          finalMetrics = fallbackMetrics;
          console.log('All mode metrics fallback:', fallbackMetrics);
        }
      }

      // Cache the successful result in memory for faster subsequent access
      const cacheData = {
        creators: transformedCreators,
        totalPages: Math.max(1, Math.ceil((totalCount || 0) / currentItemsPerPage)),
        totalCount: totalCount || transformedCreators.length,
        metrics: finalMetrics,
        page: page
      };
      
      // Intelligent cache duration: Page 1 cached longer, others for shorter periods
      let cacheDuration = CACHE_DURATIONS.ALL_CREATORS; // Default 5 minutes
      if (page === 1) {
        cacheDuration = (mode as string) === 'ai' ? CACHE_DURATIONS.AI_PAGE_1 : CACHE_DURATIONS.ALL_CREATORS_PAGE_1; // 24 hours for page 1
      } else if ((mode as string) === 'ai') {
        cacheDuration = CACHE_DURATIONS.AI_PAGES; // 15 minutes for AI pages
      }
      
      setCachedData(memoryCacheKey, cacheData, cacheDuration);
      console.log(`✅ Cached ${mode} page ${page} for ${cacheDuration / 1000 / 60} minutes ${page === 1 ? '(extended for page 1)' : ''}`);

      // Save page cache to localStorage
      saveCachedPage(filters, page, sortState, transformedCreators, totalCount, currentItemsPerPage, mode);
      
      // Preloading temporarily disabled to prevent infinite loops
      // TODO: Implement safe preloading with proper stop conditions
    } catch (err) {
      // Only surface error if there is no visible data
      const hasVisibleData = Array.isArray(paginatedCreators) && paginatedCreators.length > 0;
      if (!hasVisibleData) {
        setError(err instanceof Error ? err.message : 'Failed to load creators');
      }
    } finally {
      console.log(`🔍 DEBUG: Clearing loading states for ${mode} page ${page}`);
      setLoading(false);
      setPaginationLoading(false);
      console.log(`🔍 DEBUG: Loading states cleared - loading: false, paginationLoading: false`);
      console.log(`🔍 DEBUG fetchPaginatedCreators END: page=${page}, mode=${mode}`);
    }
  };

  // Implement smart preloading strategy
  triggerSmartPreloading = async (
    currentPage: number, 
    currentMode: CreatorListMode, 
    filters: DatabaseFilters, 
    sortState: SortState, 
    itemsPerPage: number
  ) => {
    console.log(`🚀 Smart preloading triggered for ${currentMode} page ${currentPage}`);
    
    const preloadTasks: Promise<void>[] = [];
    
    // 1. Preload next 2 pages
    for (let i = 1; i <= 2; i++) {
      const nextPage = currentPage + i;
      preloadTasks.push(
        fetchPaginatedCreators(nextPage, currentMode, filters, itemsPerPage, false)
          .catch(() => console.log(`Preload failed: ${currentMode} page ${nextPage}`))
      );
    }
    
    // 2. Preload previous 2 pages (if they exist)
    for (let i = 1; i <= 2; i++) {
      const prevPage = currentPage - i;
      if (prevPage >= 1) {
        preloadTasks.push(
          fetchPaginatedCreators(prevPage, currentMode, filters, itemsPerPage, false)
            .catch(() => console.log(`Preload failed: ${currentMode} page ${prevPage}`))
        );
      }
    }
    
    // 3. Cross-mode preloading: Always preload page 1 of the opposite mode
    const oppositeMode: CreatorListMode = currentMode === 'ai' ? 'all' : 'ai';
    preloadTasks.push(
      fetchPaginatedCreators(1, oppositeMode, {}, itemsPerPage, false)
        .catch(() => console.log(`Cross-mode preload failed: ${oppositeMode} page 1`))
    );
    
    // Execute all preloading tasks
    Promise.all(preloadTasks).then(() => {
      console.log(`✅ Smart preloading completed for ${currentMode} page ${currentPage}`);
    });
  };

  // Load niches from database
  const loadNiches = async () => {
    try {
      // Clear cache to force fresh data check
      const cacheKey = 'niches_list';
      console.log('🔄 Clearing niches cache in useCreatorData');
      if (typeof window !== 'undefined') {
        localStorage.removeItem(cacheKey);
      }
      
      // Check cache first (should be empty now)
      const cachedNiches = getCachedData(cacheKey);
      if (cachedNiches) {
        console.log('✅ Using cached niches data');
        setNiches(cachedNiches);
        return;
      }
      
      // Try healthwellness table first, fallback to creatordata
      let { data, error: queryError } = await supabase
        .from('healthwellness')
        .select('secondary_niche');
      
      console.log('🔍 useCreatorData loadNiches - healthwellness query:', { 
        error: queryError, 
        dataLength: data?.length,
        sampleData: data?.slice(0, 3)
      });
      
      // If healthwellness table is empty or has no data, try creatordata table
      if (queryError || !data || data.length === 0) {
        console.log('Healthwellness table empty, trying creatordata table...');
        const fallbackQuery = await supabase
          .from('creatordata')
          .select('secondary_niche');
        
        if (!fallbackQuery.error && fallbackQuery.data) {
          // Use secondary_niche field from creatordata
          const nicheSet = new Set<string>();
          fallbackQuery.data.forEach(creator => {
            if (creator.secondary_niche) nicheSet.add(creator.secondary_niche);
          });
          
          const uniqueNiches: Niche[] = Array.from(nicheSet).map(name => ({
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            created_at: new Date().toISOString()
          }));
          
          setNiches(uniqueNiches);
          setCachedData(cacheKey, uniqueNiches, CACHE_DURATIONS.NICHES);
          console.log(`✅ Cached ${uniqueNiches.length} niches from creatordata fallback`);
          return;
        }
      }
      
      if (queryError) throw queryError;
      
      // Extract unique secondary niches only
      const nicheSet = new Set<string>();
      data?.forEach(creator => {
        if (creator.secondary_niche) nicheSet.add(creator.secondary_niche);
      });
      
      // Convert to Niche objects
      const uniqueNiches: Niche[] = Array.from(nicheSet).map(name => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        created_at: new Date().toISOString()
      }));
      
      setNiches(uniqueNiches);
      
      // Cache the niches for future use
      setCachedData(cacheKey, uniqueNiches, CACHE_DURATIONS.NICHES);
      console.log(`✅ Cached ${uniqueNiches.length} niches for ${CACHE_DURATIONS.NICHES / 1000 / 60} minutes`);
      
    } catch (err) {
      // Fallback to empty array
      setNiches([]);
    }
  };

  // Metrics are now updated directly in switchMode to prevent conflicts

  // Calculate metrics from a list of creators (for AI mode)
  const calculateMetricsFromCreators = (creators: Creator[]): any => {
    if (!creators || creators.length === 0) {
      return {
        total_creators: 0,
        avg_followers: 0,
        avg_views: 0,
        avg_engagement: 0,
        change_percentage: 0,
        change_type: 'positive'
      };
    }
    
    const totalCreators = creators.length;
    const avgFollowers = Math.round(creators.reduce((sum, c) => sum + (c.followers || 0), 0) / totalCreators);
    const avgViews = Math.round(creators.reduce((sum, c) => sum + (c.avg_views || 0), 0) / totalCreators);
    const avgEngagement = Math.round((creators.reduce((sum, c) => sum + (c.engagement || 0), 0) / totalCreators) * 100) / 100;
    
    return {
      total_creators: totalCreators,
      avg_followers: avgFollowers,
      avg_views: avgViews,
      avg_engagement: avgEngagement,
      change_percentage: 0,
      change_type: 'positive'
    };
  };

  // Load locations from database
  // Regions are now fixed - no need to load them dynamically

  // On mount, fetch metrics and load appropriate data based on current mode
  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        console.log('Initial load - currentMode:', currentMode);
        
        // Always start on page 1 to avoid pagination issues
        setCurrentPage(1);
        saveToLocalStorage('discover_currentPage', '1');
        
        // Load appropriate data based on current mode first
        if (currentMode === 'ai') {
          await loadPersonalizedAIRecommendations();
          
          // After loading AI recommendations, apply any saved filters
          const hasFilters = Object.keys(currentFilters).some(key => {
            const value = currentFilters[key as keyof DatabaseFilters];
            return Array.isArray(value) ? value.length > 0 : value !== undefined;
          });
          
          if (hasFilters) {
            console.log('Applying saved filters to AI recommendations:', currentFilters);
            await applyFilters(currentFilters, 'ai');
          }
        } else {
          // For 'all' mode, load with saved filters and pagination
          console.log('Loading initial all creators data with saved state...');
          
          // Check if we have saved filters or are on a different page
          const hasFilters = Object.keys(currentFilters).some(key => {
            const value = currentFilters[key as keyof DatabaseFilters];
            return Array.isArray(value) ? value.length > 0 : value !== undefined;
          });
          
          if (hasFilters) {
            console.log('Restoring saved filters:', { filters: currentFilters });
            await fetchPaginatedCreators(1, 'all', currentFilters);
          } else {
            // Load first page without filters for new users
            await fetchPaginatedCreators(1, 'all', {});
          }
        }
        
        // Don't update metrics here - let switchMode handle it to prevent conflicts
      } catch (err) {
        console.error('Error in initial load:', err);
        setError(err instanceof Error ? err.message : 'Failed to load creators');
      } finally {
        setLoading(false);
      }
    })();
    loadNiches();
  }, []); // Remove currentMode dependency to avoid infinite loops, but ensure AI mode is loaded initially

  // Handle mode changes separately to avoid infinite loops
  React.useEffect(() => {
    // Only handle initial AI recommendations loading, not metrics updates
    if (currentMode === 'ai' && aiRecommendedCreators.length === 0) {
      console.log('Mode changed to AI, loading recommendations...');
      loadPersonalizedAIRecommendations();
    }
    
    // Don't update metrics here - it's handled in switchMode to prevent conflicts
  }, [currentMode]); // Only depend on currentMode changes

  // Apply saved filters when AI recommendations are loaded
  React.useEffect(() => {
    if (currentMode === 'ai' && aiRecommendedCreators.length > 0) {
      const hasFilters = Object.keys(currentFilters).some(key => {
        const value = currentFilters[key as keyof DatabaseFilters];
        return Array.isArray(value) ? value.length > 0 : value !== undefined;
      });
      
      if (hasFilters) {
        console.log('Applying saved filters to newly loaded AI recommendations:', currentFilters);
        applyFilters(currentFilters, 'ai');
      }
    }
  }, [aiRecommendedCreators.length, currentMode]); // Trigger when AI recommendations are loaded

  // Ensure metrics are always correct for the current mode
  React.useEffect(() => {
    const ensureCorrectMetrics = async () => {
      if (currentMode === 'ai' && aiRecommendedCreators.length > 0) {
        // For AI mode, ensure metrics reflect the AI recommendations
        const aiMetrics = calculateMetricsFromCreators(aiRecommendedCreators);
        setMetrics(aiMetrics);
        setTotalFilteredCount(aiRecommendedCreators.length);
        console.log('AI mode metrics ensured:', aiMetrics);
      } else if (currentMode === 'all' && allCreators.length > 0) {
        // For all mode, use database metrics for accurate representation of all influencers
        try {
          const allMetrics = await fetchCreatorMetrics({}, setTotalFilteredCount);
          setMetrics(allMetrics);
          console.log('All mode metrics ensured from database:', allMetrics);
        } catch (error) {
          console.error('Error ensuring all mode metrics:', error);
          // Fallback to calculating from cached data
          const fallbackMetrics = calculateMetricsFromCreators(allCreators);
          setMetrics(fallbackMetrics);
          setTotalFilteredCount(allCreators.length);
          console.log('All mode metrics fallback ensured:', fallbackMetrics);
        }
      }
    };
    
    ensureCorrectMetrics();
  }, [currentMode, aiRecommendedCreators.length, allCreators.length]);

  // Extract location keywords from target audience description
  const extractLocationKeywords = (targetAudience: string): string[] => {
    if (!targetAudience) return [];
    
    const text = targetAudience.toLowerCase();
    const locationKeywords: string[] = [];
    
    // Country mappings
    const countryMappings: { [key: string]: string[] } = {
      'united states': ['us', 'usa', 'united states', 'america', 'american'],
      'canada': ['canada', 'canadian'],
      'united kingdom': ['uk', 'britain', 'british', 'england', 'scotland', 'wales'],
      'australia': ['australia', 'australian', 'aussie'],
      'germany': ['germany', 'german', 'deutschland'],
      'france': ['france', 'french'],
      'italy': ['italy', 'italian'],
      'spain': ['spain', 'spanish'],
      'brazil': ['brazil', 'brazilian'],
      'india': ['india', 'indian'],
      'japan': ['japan', 'japanese'],
      'korea': ['korea', 'korean', 'south korea'],
      'china': ['china', 'chinese'],
      'mexico': ['mexico', 'mexican'],
      'netherlands': ['netherlands', 'dutch', 'holland'],
    };

    // City/State mappings
    const cityMappings: { [key: string]: string[] } = {
      'new york': ['new york', 'nyc', 'ny', 'manhattan', 'brooklyn'],
      'los angeles': ['los angeles', 'la', 'california', 'hollywood'],
      'chicago': ['chicago', 'illinois'],
      'miami': ['miami', 'florida'],
      'london': ['london'],
      'paris': ['paris'],
      'toronto': ['toronto'],
      'sydney': ['sydney'],
      'berlin': ['berlin'],
      'tokyo': ['tokyo'],
    };

    // Check for location matches
    Object.entries({ ...countryMappings, ...cityMappings }).forEach(([location, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        locationKeywords.push(location);
      }
    });

    return locationKeywords;
  };

  // Calculate personalized match score based on user onboarding data
  const calculatePersonalizedMatchScore = (creator: Creator, userNiches: string[], targetAudience?: string): number => {
    let score = 0;
    let maxScore = 0;

    // Extract location preferences from target audience
    const locationKeywords = extractLocationKeywords(targetAudience || '');

    // 1. Niche alignment (40% of score - MUCH higher importance for exact niche matching)
    const nicheWeight = 40;
    maxScore += nicheWeight;
    
    // Get primary and secondary niches from creator.niches array
    const primaryNiche = creator.niches?.find(n => n.type === 'primary')?.name;
    const secondaryNiche = creator.niches?.find(n => n.type === 'secondary')?.name;
    
    if (primaryNiche && userNiches.includes(primaryNiche)) {
      score += nicheWeight; // FULL SCORE for primary niche match - this is exactly what user wants
    } else if (secondaryNiche && userNiches.includes(secondaryNiche)) {
      score += nicheWeight * 0.3; // Lower score for secondary niche match
    }

    // 2. Location targeting (30% of score - HIGHEST PRIORITY when location is specified!)
    const locationWeight = 30;
    maxScore += locationWeight;
    
    if (locationKeywords.length > 0 && creator.location) {
      const creatorLocationLower = creator.location.toLowerCase();
      let locationMatchScore = 0;
      
      // Check if creator location matches any target locations
      for (const targetLocation of locationKeywords) {
        const targetLower = targetLocation.toLowerCase();
        
        if (targetLower === 'united states' || targetLower === 'usa' || targetLower === 'america') {
          // US matching logic
          if (['us', 'usa', 'united states', 'america'].some(term => creatorLocationLower.includes(term)) ||
              ['california', 'new york', 'texas', 'florida', 'illinois', 'pennsylvania', 'ohio', 'georgia', 'north carolina', 'michigan'].some(state => creatorLocationLower.includes(state))) {
            locationMatchScore = Math.max(locationMatchScore, 1.0); // Perfect US match
            break;
          }
        } else if (targetLower === 'united kingdom' || targetLower === 'uk' || targetLower === 'britain') {
          // UK matching logic
          if (['uk', 'britain', 'england', 'scotland', 'wales', 'london', 'manchester', 'birmingham'].some(term => creatorLocationLower.includes(term))) {
            locationMatchScore = Math.max(locationMatchScore, 1.0); // Perfect UK match
            break;
          }
        } else {
          // Direct location match - check for exact city/region matches
          if (creatorLocationLower.includes(targetLower) || targetLower.includes(creatorLocationLower.split(',')[0])) {
            locationMatchScore = Math.max(locationMatchScore, 1.0); // Perfect direct match
            break;
          }
          // Check for partial matches (city in different format)
          const creatorCity = creatorLocationLower.split(',')[0].trim();
          const targetWords = targetLower.split(/\s+/);
          if (targetWords.some(word => word.length > 2 && creatorCity.includes(word))) {
            locationMatchScore = Math.max(locationMatchScore, 0.8); // Good partial match
          }
        }
      }
      
      if (locationMatchScore > 0) {
        score += locationWeight * locationMatchScore; // Weighted location match
      } else if (creator.location) {
        score += locationWeight * 0.1; // Has location but doesn't match target
      }
    } else if (creator.location) {
      score += locationWeight * 0.5; // Has location data when none specified
    }

    // 3. Hashtag relevance (15% of score) - Enhanced matching
    const hashtagWeight = 15;
    maxScore += hashtagWeight;
    
    if (creator.hashtags && creator.hashtags.length > 0) {
      const creatorHashtags = creator.hashtags.map(tag => tag.toLowerCase().replace('#', ''));
      let hashtagScore = 0;
      
      // Enhanced niche-related hashtag matching
      const nicheKeywords = userNiches.map(niche => niche.toLowerCase());
      const nicheMatches = creatorHashtags.filter(tag => 
        nicheKeywords.some(niche => tag.includes(niche) || niche.includes(tag))
      ).length;
      
      // Bonus for multiple niche hashtags
      const nicheHashtagBonus = Math.min(nicheMatches / Math.max(nicheKeywords.length, 1), 1);
      hashtagScore += nicheHashtagBonus * 0.5;
      
      // Bonus for hashtag volume (more hashtags = more content categorization)
      const hashtagVolumeBonus = Math.min(creatorHashtags.length / 20, 1) * 0.2;
      hashtagScore += hashtagVolumeBonus;
      
      // Enhanced target audience keyword matching in hashtags
      if (targetAudience) {
        const audienceKeywords = targetAudience.toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 3)
          .filter(word => !['with', 'that', 'this', 'from', 'they', 'have', 'will', 'been', 'were', 'and', 'the', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word));
        
        const audienceMatches = creatorHashtags.filter(tag => 
          audienceKeywords.some(keyword => tag.includes(keyword) || keyword.includes(tag))
        ).length;
        
        const audienceHashtagScore = Math.min(audienceMatches / Math.max(audienceKeywords.length, 1), 1);
        hashtagScore += audienceHashtagScore * 0.3;
      }
      
      score += hashtagScore * hashtagWeight;
    }

    // 4. Performance metrics (20% of score) - Enhanced with buzz score
    const performanceWeight = 20;
    maxScore += performanceWeight;
    
    // Engagement rate scoring (0-10% engagement rate) - 40% of performance score
    const engagementDecimal = (creator.engagement || 0) / 100;
    const engagementScore = Math.min(engagementDecimal * 10, 1) * 0.4;
    
    // Follower count scoring (logarithmic scale) - 25% of performance score
    const followerScore = creator.followers 
      ? Math.min(Math.log10(creator.followers / 1000) / 4, 1) * 0.25
      : 0;
    
    // Average views scoring (relative to followers) - 20% of performance score
    const viewsToFollowersRatio = creator.followers > 0 
      ? (creator.avg_views || 0) / creator.followers
      : 0;
    const viewsScore = Math.min(viewsToFollowersRatio * 10, 1) * 0.2;
    
    // Buzz Score - 15% of performance score (high buzz = high quality creator)
    const buzzScore = creator.buzz_score || 0;
    const normalizedBuzzScore = Math.min(buzzScore / 100, 1) * 0.15;
    
    score += (engagementScore + followerScore + viewsScore + normalizedBuzzScore) * performanceWeight;

    // 5. Bio and content relevance (15% of score) - Enhanced analysis
    const contentWeight = 15;
    maxScore += contentWeight;
    
    if (targetAudience && creator.bio) {
      const audienceKeywords = targetAudience.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !['with', 'that', 'this', 'from', 'they', 'have', 'will', 'been', 'were', 'and', 'the', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word));
      
      const bioLower = creator.bio.toLowerCase();
      let bioScore = 0;
      
      // Exact keyword matches (60% of bio score)
      const exactMatches = audienceKeywords.filter(keyword => bioLower.includes(keyword)).length;
      const exactMatchScore = Math.min(exactMatches / Math.max(audienceKeywords.length, 1), 1) * 0.6;
      bioScore += exactMatchScore;
      
      // Partial matches (bio words containing audience keywords) - 30% of bio score
      const bioWords = bioLower.split(/\s+/);
      const partialMatches = audienceKeywords.filter(keyword => 
        bioWords.some(bioWord => bioWord.includes(keyword) || keyword.includes(bioWord))
      ).length;
      const partialMatchScore = Math.min(partialMatches / Math.max(audienceKeywords.length, 1), 1) * 0.3;
      bioScore += partialMatchScore;
      
      // Bio quality bonus (10% of bio score) - longer, more detailed bios score higher
      const bioLength = creator.bio.length;
      const bioQualityBonus = Math.min(bioLength / 200, 1) * 0.1; // 200+ chars = full score
      bioScore += bioQualityBonus;
      
      score += bioScore * contentWeight;
    } else if (creator.bio) {
      // Has bio but no target audience - give moderate score based on bio quality
      const bioLength = creator.bio.length;
      const bioQualityScore = Math.min(bioLength / 200, 1) * 0.5;
      score += bioQualityScore * contentWeight;
    } else {
      score += contentWeight * 0.2; // No bio = low score
    }

    // Convert to percentage (65-98 range for realistic matching)
    const percentage = Math.max(65, Math.min(98, (score / maxScore) * 100));
    return percentage;
  };

  // Calculate general match score for fallback (performance-based with content quality)
  const calculateGeneralMatchScore = (creator: Creator): number => {
    let score = 0;

    // Engagement rate (0-30 points) - most important metric
    const engagementDecimal = (creator.engagement || 0) / 100;
    const engagementPoints = Math.min(engagementDecimal * 300, 30);
    
    // Buzz Score (0-25 points) - high buzz = high quality creator
    const buzzScore = creator.buzz_score || 0;
    const buzzPoints = Math.min(buzzScore * 0.25, 25);
    
    // Follower count (0-20 points, logarithmic)
    const followerPoints = creator.followers 
      ? Math.min(Math.log10(creator.followers / 1000) * 5, 20)
      : 0;
    
    // Average views relative to followers (0-15 points)
    const viewsRatio = creator.followers > 0 
      ? (creator.avg_views || 0) / creator.followers
      : 0;
    const viewsPoints = Math.min(viewsRatio * 150, 15);
    
    // Platform bonus (0-10 points)
    const platforms = creator.social_media?.map(sm => sm.platform) || [];
    const platformBonus = platforms.some(platform => ['instagram', 'tiktok', 'youtube'].includes(platform.toLowerCase())) ? 10 : 5;

    // Enhanced content quality indicators (0-15 points)
    let contentQuality = 0;
    
    // Has hashtags (shows they tag their content) - 4 points
    if (creator.hashtags && creator.hashtags.length > 0) {
      contentQuality += Math.min(creator.hashtags.length / 5, 1) * 4; // More hashtags = better
    }
    
    // Has detailed bio (shows professionalism) - 4 points
    if (creator.bio && creator.bio.length > 50) {
      contentQuality += Math.min(creator.bio.length / 200, 1) * 4; // Longer bio = better
    }
    
    // Has location (shows they're open about their presence) - 3 points
    if (creator.location) {
      contentQuality += 3;
    }
    
    // Has email (contactable for business) - 2 points
    if (creator.email) {
      contentQuality += 2;
    }
    
    // Has profile picture (completeness) - 2 points
    if (creator.profile_pic) {
      contentQuality += 2;
    }

    score = engagementPoints + buzzPoints + followerPoints + viewsPoints + platformBonus + contentQuality;
    
    // Convert to 70-95 range for general recommendations - ROUNDED TO AVOID DECIMALS
    return Math.round(Math.max(70, Math.min(95, score + 25)));
  };

  // Generate detailed match explanation
  const generateMatchExplanation = (creator: Creator, userNiches: string[], targetAudience?: string): string => {
    const reasons = [];
    const locationKeywords = extractLocationKeywords(targetAudience || '');
    
    // Niche match (highest priority)
    const primaryNiche = creator.niches?.find(n => n.type === 'primary')?.name;
    const secondaryNiche = creator.niches?.find(n => n.type === 'secondary')?.name;
    
    if (primaryNiche && userNiches.includes(primaryNiche)) {
      reasons.push(`specializes in ${primaryNiche}`);
    } else if (secondaryNiche && userNiches.includes(secondaryNiche)) {
      reasons.push(`creates ${secondaryNiche} content`);
    }

    // Location match (high priority explanation)
    if (locationKeywords.length > 0 && creator.location) {
      const creatorLocationLower = creator.location.toLowerCase();
      let locationMatch = false;
      
      for (const targetLocation of locationKeywords) {
        if (targetLocation === 'united states') {
          if (['us', 'usa', 'united states', 'america'].some(term => creatorLocationLower.includes(term)) ||
              ['california', 'new york', 'texas', 'florida', 'illinois'].some(state => creatorLocationLower.includes(state))) {
            reasons.unshift(`based in ${creator.location} (matches your US target)`); // Add to beginning
            locationMatch = true;
            break;
          }
        } else if (targetLocation === 'united kingdom') {
          if (['uk', 'britain', 'england', 'scotland', 'wales', 'london'].some(term => creatorLocationLower.includes(term))) {
            reasons.unshift(`based in ${creator.location} (matches your UK target)`);
            locationMatch = true;
            break;
          }
        } else if (creatorLocationLower.includes(targetLocation)) {
          reasons.unshift(`based in ${creator.location} (perfect location match)`);
          locationMatch = true;
          break;
        }
      }
      
      if (!locationMatch && creator.location) {
        reasons.push(`based in ${creator.location}`);
      }
    } else if (creator.location) {
      reasons.push(`based in ${creator.location}`);
    }
    
    // Bio relevance
    if (targetAudience && creator.bio) {
      const audienceKeywords = targetAudience.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !['with', 'that', 'this', 'from', 'they', 'have', 'will', 'been', 'were', 'and', 'the', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word));
      
      const bioLower = creator.bio.toLowerCase();
      const bioMatches = audienceKeywords.filter(keyword => bioLower.includes(keyword));
      
      if (bioMatches.length > 0) {
        reasons.push(`bio mentions "${bioMatches.slice(0, 2).join(', ')}"`);
      }
    }
    
    // Hashtag relevance
    if (creator.hashtags && creator.hashtags.length > 0) {
      const creatorHashtags = creator.hashtags.map(tag => tag.toLowerCase().replace('#', ''));
      const nicheKeywords = userNiches.map(niche => niche.toLowerCase());
      const nicheHashtagMatches = creatorHashtags.filter(tag => 
        nicheKeywords.some(niche => tag.includes(niche) || niche.includes(tag))
      );
      
      if (nicheHashtagMatches.length > 0) {
        reasons.push(`uses relevant hashtags (#${nicheHashtagMatches.slice(0, 2).join(', #')})`);
      }
      
      // Target audience hashtag matches
      if (targetAudience) {
        const audienceKeywords = targetAudience.toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 3)
          .filter(word => !['with', 'that', 'this', 'from', 'they', 'have', 'will', 'been', 'were', 'and', 'the', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word));
        
        const audienceHashtagMatches = creatorHashtags.filter(tag => 
          audienceKeywords.some(keyword => tag.includes(keyword) || keyword.includes(tag))
        );
        
        if (audienceHashtagMatches.length > 0) {
          reasons.push(`hashtags align with your audience interests`);
        }
      }
    }
    
    // Performance highlights
    if ((creator.engagement || 0) > 5) {
      reasons.push(`${(creator.engagement || 0).toFixed(1)}% engagement rate`);
    }
    
    // Buzz Score highlight (high buzz = high quality)
    if ((creator.buzz_score || 0) >= 80) {
      reasons.push(`excellent ${creator.buzz_score}% buzz score`);
    } else if ((creator.buzz_score || 0) >= 70) {
      reasons.push(`strong ${creator.buzz_score}% buzz score`);
    }
    
    if (creator.followers >= 1000000) {
      reasons.push(`${(creator.followers / 1000000).toFixed(1)}M followers`);
    } else if (creator.followers >= 100000) {
      reasons.push(`${(creator.followers / 1000).toFixed(0)}K followers`);
    }
    
    // Bio content relevance
    if (targetAudience && creator.bio) {
      const audienceKeywords = targetAudience.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !['with', 'that', 'this', 'from', 'they', 'have', 'will', 'been', 'were'].includes(word));
      
      const bioLower = creator.bio.toLowerCase();
      const matchedKeywords = audienceKeywords.filter(keyword => bioLower.includes(keyword));
      
      if (matchedKeywords.length > 0) {
        reasons.push(`bio mentions "${matchedKeywords.slice(0, 2).join(', ')}"`);
      }
    }
    
    // Construct explanation with priority order
    if (reasons.length > 0) {
      const topReasons = reasons.slice(0, 4); // Show top 4 reasons
      return `Perfect match: ${topReasons.join(', ')}`;
    } else {
      return `Recommended based on strong performance metrics and audience engagement`;
    }
  };

  return {
    creators: paginatedCreators, // Return paginated creators instead of all filtered creators
    allCreators: creators,
    filteredCreators, // Keep full filtered list for metrics
    currentMode,
    currentPage,
    totalPages,
    totalCreators: totalFilteredCount,
    itemsPerPage,
    niches,
    metrics,
    loading,
    paginationLoading, // NEW: Dedicated pagination loading state
    error,
    applyFilters,
    switchMode,
    loadCreators,
    loadNiches,
    handlePageChange,
    handleItemsPerPageChange,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    sortState,
    handleSort
  };
};


