/**
 * Enhanced Creator Data Hook with Advanced Caching and Preloading
 * This is an enhanced version of useCreatorData with intelligent caching
 */

import React from 'react';
import { supabase } from '../lib/supabaseClient';
import { Creator, DatabaseFilters, CreatorListMode, SortField, SortDirection, SortState, Niche, CreatorMetrics } from '../types/database';
import { parseLocationManually, getDisplayLocation } from '../utils/locationParser';
import { useDiscoverCacheWithFetcher } from './useDiscoverCache';
import { DiscoverCacheManager, PageCacheData } from '@/lib/discoverCache';

// Configuration
const DEFAULT_CREATORS_PER_PAGE = 24;

// Transform Supabase data to match UI expectations
const transformCreatorData = async (dbCreator: any): Promise<Creator> => {
  try {
    // Extract recent posts and create thumbnails array
    const validThumbnails: string[] = [];
    const validShareUrls: string[] = [];

    for (let i = 1; i <= 12 && validThumbnails.length < 4; i++) {
      // Try wellness post first, fallback to regular post
      let post = dbCreator[`recent_wellness_post_${i}`] || dbCreator[`recent_post_${i}`];
      
      if (post && typeof post === 'string') {
        try {
          post = JSON.parse(post);
        } catch (e) {
          continue;
        }
      }
      
      if (post && typeof post === 'object') {
        let thumbnailUrl = '';
        
        if (post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 0) {
          thumbnailUrl = post.media_urls[0];
        } else if (post.video_url) {
          thumbnailUrl = post.video_url;
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
      url: dbCreator.profile_url || ''
    }];

    // Parse location with fallback
    const locationData = parseLocationManually(dbCreator.location);
    const displayLocation = getDisplayLocation(locationData);

    // Create niches array from wellness niches with fallback to old fields
    const niches = [];
    const primaryNiche = dbCreator.primary_wellness_niche || dbCreator.primary_niche;
    const secondaryNiche = dbCreator.secondary_wellness_niche || dbCreator.secondary_niche;
    
    if (primaryNiche) {
      niches.push({ name: primaryNiche, type: 'primary' as const });
    }
    if (secondaryNiche) {
      niches.push({ name: secondaryNiche, type: 'secondary' as const });
    }

    return {
      id: dbCreator.id?.toString() || '',
      profile_pic: dbCreator.profile_image_url || '/placeholder.png',
      match_score: dbCreator.match_score || dbCreator.buzz_score || 0,
      buzz_score: dbCreator.buzz_score || 0,
      username: dbCreator.display_name || dbCreator.handle || '',
      username_tag: `@${dbCreator.handle || 'unknown'}`,
      social_media: socialMedia,
      bio: dbCreator.bio || '',
      followers: dbCreator.followers_count || 0,
      followers_change: dbCreator.followers_change || 0,
      followers_change_type: (dbCreator.followers_change_type as 'positive' | 'negative') || 'positive',
      engagement: dbCreator.engagement_rate || 0,
      engagement_change: dbCreator.engagement_rate_change || 0,
      engagement_change_type: (dbCreator.engagement_rate_change_type as 'positive' | 'negative') || 'positive',
      avg_views: dbCreator.average_views || 0,
      avg_views_change: dbCreator.average_views_change || 0,
      avg_views_change_type: (dbCreator.average_views_change_type as 'positive' | 'negative') || 'positive',
      avg_likes: dbCreator.average_likes || 0,
      avg_likes_change: dbCreator.average_likes_change || 0,
      avg_likes_change_type: (dbCreator.average_likes_change_type as 'positive' | 'negative') || 'positive',
      avg_comments: dbCreator.average_comments || 0,
      avg_comments_change: dbCreator.average_comments_change || 0,
      avg_comments_change_type: (dbCreator.average_comments_change_type as 'positive' | 'negative') || 'positive',
      niches: niches,
      hashtags: dbCreator.hashtags || [],
      thumbnails: validThumbnails.slice(0, 3), // Card thumbnails (max 3)
      expanded_thumbnails: validThumbnails.slice(0, 4), // Expanded overlay thumbnails (max 4)
      share_urls: validShareUrls.slice(0, 4), // Share URLs for TikTok posts (max 4)
      location: displayLocation,
      email: dbCreator.email || '',
      created_at: dbCreator.created_at || new Date().toISOString(),
      updated_at: dbCreator.created_at || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error transforming creator data:', error);
    // Return a minimal creator object to prevent crashes
    return {
      id: dbCreator.id?.toString() || '',
      profile_pic: dbCreator.profile_image_url || '/placeholder.png',
      match_score: dbCreator.match_score || dbCreator.buzz_score || 0,
      buzz_score: dbCreator.buzz_score || 0,
      username: dbCreator.display_name || dbCreator.handle || 'Unknown Creator',
      username_tag: `@${dbCreator.handle || 'unknown'}`,
      social_media: [{
        platform: (dbCreator.platform || 'instagram').toLowerCase(),
        username: dbCreator.handle || '',
        url: dbCreator.profile_url || `https://${(dbCreator.platform || 'instagram').toLowerCase()}.com/${dbCreator.handle || ''}`
      }],
      bio: dbCreator.bio || '',
      followers: dbCreator.followers_count || 0,
      followers_change: dbCreator.followers_change || 0,
      followers_change_type: 'positive' as const,
      engagement: dbCreator.engagement_rate || 0,
      engagement_change: dbCreator.engagement_rate_change || 0,
      engagement_change_type: 'positive' as const,
      avg_views: dbCreator.average_views || 0,
      avg_views_change: dbCreator.average_views_change || 0,
      avg_views_change_type: 'positive' as const,
      avg_likes: dbCreator.average_likes || 0,
      avg_likes_change: dbCreator.average_likes_change || 0,
      avg_likes_change_type: 'positive' as const,
      avg_comments: dbCreator.average_comments || 0,
      avg_comments_change: dbCreator.average_comments_change || 0,
      avg_comments_change_type: 'positive' as const,
      niches: [],
      hashtags: dbCreator.hashtags || [],
      thumbnails: [],
      expanded_thumbnails: [],
      share_urls: [],
      location: dbCreator.location || 'Unknown',
      email: dbCreator.email || '',
      created_at: dbCreator.created_at || new Date().toISOString(),
      updated_at: dbCreator.created_at || new Date().toISOString()
    };
  }
};

// Fetch creator metrics
const fetchCreatorMetrics = async (filters: DatabaseFilters, mode: CreatorListMode): Promise<CreatorMetrics> => {
  try {
    let query = supabase.from('healthwellness').select('followers_count, average_views, engagement_rate');

    // Apply filters
    if (filters.niches?.length) {
      query = query.in('secondary_wellness_niche', filters.niches);
    }
    if (filters.platforms?.length) {
      const platformConditions = filters.platforms.map(platform => {
        const lowerPlatform = platform.toLowerCase();
        if (lowerPlatform === 'instagram') return 'platform.ilike.instagram';
        if (lowerPlatform === 'tiktok') return 'platform.ilike.tiktok';
        if (lowerPlatform === 'youtube') return 'platform.ilike.youtube';
        if (lowerPlatform === 'x' || lowerPlatform === 'twitter') return 'platform.ilike.twitter';
        return `platform.ilike.${platform}`;
      });
      query = query.or(platformConditions.join(','));
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
    if (filters.engagement_max !== undefined && filters.engagement_max < 500) {
      query = query.lte('engagement_rate', filters.engagement_max);
    }
    if (filters.avg_views_min !== undefined) {
      query = query.gte('average_views', filters.avg_views_min);
    }
    if (filters.avg_views_max !== undefined && filters.avg_views_max < 1000000) {
      query = query.lte('average_views', filters.avg_views_max);
    }
    if (filters.buzz_scores?.length) {
      const conditions: string[] = [];
      filters.buzz_scores.forEach(scoreRange => {
        switch (scoreRange) {
          case '90%+':
            conditions.push('buzz_score.gte.90');
            break;
          case '70-90%':
            conditions.push('and(buzz_score.gte.70,buzz_score.lt.90)');
            break;
          case '50-70%':
            conditions.push('and(buzz_score.gte.50,buzz_score.lt.70)');
            break;
          case '30-50%':
            conditions.push('and(buzz_score.gte.30,buzz_score.lt.50)');
            break;
          case 'Less than 30%':
            conditions.push('buzz_score.lt.30');
            break;
        }
      });
      if (conditions.length > 0) {
        query = query.or(conditions.join(','));
      }
    }
    if (filters.locations?.length) {
      query = query.in('location', filters.locations);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        total_creators: 0,
        avg_followers: 0,
        avg_views: 0,
        avg_engagement: 0,
        change_percentage: 0,
        change_type: 'positive'
      };
    }

    const totalCreators = data.length;
    const avgFollowers = Math.round(data.reduce((sum, c) => sum + (c.followers_count || 0), 0) / totalCreators);
    const avgViews = Math.round(data.reduce((sum, c) => sum + (c.average_views || 0), 0) / totalCreators);
    const avgEngagement = Math.round((data.reduce((sum, c) => sum + (c.engagement_rate || 0), 0) / totalCreators) * 100) / 100;

    return {
      total_creators: totalCreators,
      avg_followers: avgFollowers,
      avg_views: avgViews,
      avg_engagement: avgEngagement,
      change_percentage: Math.floor(Math.random() * 20) - 10, // Mock change
      change_type: Math.random() > 0.5 ? 'positive' : 'negative'
    };
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return {
      total_creators: 0,
      avg_followers: 0,
      avg_views: 0,
      avg_engagement: 0,
      change_percentage: 0,
      change_type: 'positive'
    };
  }
};

// Enhanced data fetcher that integrates with caching
const createDataFetcher = () => {
  return async (
    filters: DatabaseFilters,
    page: number,
    sortState: SortState,
    mode: CreatorListMode,
    itemsPerPage: number
  ): Promise<PageCacheData> => {
    console.log(`🔄 Fetching page ${page} data (${mode} mode)`);

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage - 1;

    // Build query based on mode
    let query = supabase.from('healthwellness').select('*');

    if (mode === 'ai') {
      // For AI mode, we would integrate with AI matching logic here
      // For now, use the same query but could be enhanced with AI scoring
      console.log('Using AI mode query');
    }

    // Apply sorting
    const getDatabaseField = (field: SortField): string => {
      switch (field) {
        case 'match_score':
          return 'buzz_score';
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

    const dataSortField = sortState.field ? getDatabaseField(sortState.field) : 'followers_count';
    const dataSortAscending = sortState.field ? sortState.direction === 'asc' : false;

    query = query.order(dataSortField, { ascending: dataSortAscending }).range(startIndex, endIndex);

    // Apply filters
    if (filters.niches?.length) {
      query = query.in('secondary_wellness_niche', filters.niches);
    }
    if (filters.platforms?.length) {
      const platformConditions = filters.platforms.map(platform => {
        const lowerPlatform = platform.toLowerCase();
        if (lowerPlatform === 'instagram') return 'platform.ilike.instagram';
        if (lowerPlatform === 'tiktok') return 'platform.ilike.tiktok';
        if (lowerPlatform === 'youtube') return 'platform.ilike.youtube';
        if (lowerPlatform === 'x' || lowerPlatform === 'twitter') return 'platform.ilike.twitter';
        return `platform.ilike.${platform}`;
      });
      query = query.or(platformConditions.join(','));
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
    if (filters.engagement_max !== undefined && filters.engagement_max < 500) {
      query = query.lte('engagement_rate', filters.engagement_max);
    }
    if (filters.avg_views_min !== undefined) {
      query = query.gte('average_views', filters.avg_views_min);
    }
    if (filters.avg_views_max !== undefined && filters.avg_views_max < 1000000) {
      query = query.lte('average_views', filters.avg_views_max);
    }
    if (filters.buzz_scores?.length) {
      const conditions: string[] = [];
      filters.buzz_scores.forEach(scoreRange => {
        switch (scoreRange) {
          case '90%+':
            conditions.push('buzz_score.gte.90');
            break;
          case '70-90%':
            conditions.push('and(buzz_score.gte.70,buzz_score.lt.90)');
            break;
          case '50-70%':
            conditions.push('and(buzz_score.gte.50,buzz_score.lt.70)');
            break;
          case '30-50%':
            conditions.push('and(buzz_score.gte.30,buzz_score.lt.50)');
            break;
          case 'Less than 30%':
            conditions.push('buzz_score.lt.30');
            break;
        }
      });
      if (conditions.length > 0) {
        query = query.or(conditions.join(','));
      }
    }
    if (filters.locations?.length) {
      query = query.in('location', filters.locations);
    }

    // Get total count for pagination
    let countQuery = supabase.from('healthwellness').select('*', { count: 'planned', head: true });
    
    // Apply same filters to count query
    if (filters.niches?.length) {
      countQuery = countQuery.in('primary_niche', filters.niches);
    }
    if (filters.platforms?.length) {
      const platformConditions = filters.platforms.map(platform => {
        const lowerPlatform = platform.toLowerCase();
        if (lowerPlatform === 'instagram') return 'platform.ilike.instagram';
        if (lowerPlatform === 'tiktok') return 'platform.ilike.tiktok';
        if (lowerPlatform === 'youtube') return 'platform.ilike.youtube';
        if (lowerPlatform === 'x' || lowerPlatform === 'twitter') return 'platform.ilike.twitter';
        return `platform.ilike.${platform}`;
      });
      countQuery = countQuery.or(platformConditions.join(','));
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
    if (filters.engagement_max !== undefined && filters.engagement_max < 500) {
      countQuery = countQuery.lte('engagement_rate', filters.engagement_max);
    }
    if (filters.avg_views_min !== undefined) {
      countQuery = countQuery.gte('average_views', filters.avg_views_min);
    }
    if (filters.avg_views_max !== undefined && filters.avg_views_max < 1000000) {
      countQuery = countQuery.lte('average_views', filters.avg_views_max);
    }
    if (filters.buzz_scores?.length) {
      const conditions: string[] = [];
      filters.buzz_scores.forEach(scoreRange => {
        switch (scoreRange) {
          case '90%+':
            conditions.push('buzz_score.gte.90');
            break;
          case '70-90%':
            conditions.push('and(buzz_score.gte.70,buzz_score.lt.90)');
            break;
          case '50-70%':
            conditions.push('and(buzz_score.gte.50,buzz_score.lt.70)');
            break;
          case '30-50%':
            conditions.push('and(buzz_score.gte.30,buzz_score.lt.50)');
            break;
          case 'Less than 30%':
            conditions.push('buzz_score.lt.30');
            break;
        }
      });
      if (conditions.length > 0) {
        countQuery = countQuery.or(conditions.join(','));
      }
    }
    if (filters.locations?.length) {
      countQuery = countQuery.in('location', filters.locations);
    }

    // Execute queries
    const [{ data, error }, { count, error: countError }] = await Promise.all([
      query,
      countQuery
    ]);

    if (error) throw error;
    if (countError) throw countError;

    // Transform creators
    const creators: Creator[] = await Promise.all((data || []).map(transformCreatorData));
    const totalCount = typeof count === 'number' ? count : 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

    return {
      creators,
      totalCount,
      totalPages,
      page,
      sortState,
      filters,
      mode,
      itemsPerPage
    };
  };
};

export const useEnhancedCreatorData = () => {
  // Initialize data fetcher
  const dataFetcher = React.useMemo(() => createDataFetcher(), []);
  
  // Initialize cache with data fetcher
  const cache = useDiscoverCacheWithFetcher(dataFetcher, {
    enablePreloading: true,
    preloadAdjacent: true,
    trackUserBehavior: true
  });

  // State management
  const [creators, setCreators] = React.useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = React.useState<Creator[]>([]);
  const [paginatedCreators, setPaginatedCreators] = React.useState<Creator[]>([]);
  const [aiRecommendedCreators, setAiRecommendedCreators] = React.useState<Creator[]>([]);
  const [allCreators, setAllCreators] = React.useState<Creator[]>([]);
  
  const [currentMode, setCurrentMode] = React.useState<CreatorListMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('discover_currentMode');
      if (!saved) {
        localStorage.setItem('discover_currentMode', 'ai');
        return 'ai';
      }
      return saved as CreatorListMode;
    }
    return 'ai';
  });
  
  const [currentPage, setCurrentPage] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('discover_currentPage');
      const parsedPage = saved ? parseInt(saved, 10) : 1;
      return Math.max(1, parsedPage);
    }
    return 1;
  });
  
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalFilteredCount, setTotalFilteredCount] = React.useState(0);
  const [niches, setNiches] = React.useState<Niche[]>([]);
  const [metrics, setMetrics] = React.useState<CreatorMetrics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [paginationLoading, setPaginationLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const [itemsPerPage, setItemsPerPage] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('discover_itemsPerPage');
      return saved ? parseInt(saved, 10) : DEFAULT_CREATORS_PER_PAGE;
    }
    return DEFAULT_CREATORS_PER_PAGE;
  });
  
  const [isModeSwitching, setIsModeSwitching] = React.useState(false);
  
  const [currentFilters, setCurrentFilters] = React.useState<DatabaseFilters>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('discover_currentFilters');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  
  const [sortState, setSortState] = React.useState<SortState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('discover_sortState');
      return saved ? JSON.parse(saved) : { field: null, direction: 'desc' };
    }
    return { field: null, direction: 'desc' };
  });

  // Enhanced load creators function with caching
  const loadCreators = React.useCallback(async (
    mode: CreatorListMode = currentMode,
    page: number = currentPage,
    shouldUpdatePage: boolean = true
  ) => {
    try {
      setError(null);
      
      // Check cache first
      const cachedData = cache.getCachedPage(currentFilters, page, sortState, mode, itemsPerPage);
      
      if (cachedData) {
        console.log(`🎯 Using cached data for page ${page}`);
        
        // Set state from cache
        const { creators: cachedCreators } = cachedData;
        
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
          localStorage.setItem('discover_currentPage', page.toString());
        }
        
        setTotalPages(cachedData.totalPages);
        setTotalFilteredCount(cachedData.totalCount);
        setLoading(false);
        setPaginationLoading(false);
        
        // Load metrics from cache or fetch
        const cachedMetrics = cache.getCachedMetrics(currentFilters);
        if (cachedMetrics) {
          setMetrics(cachedMetrics);
        } else {
          // Fetch metrics in background
          fetchCreatorMetrics(currentFilters, mode).then(metricsData => {
            setMetrics(metricsData);
            cache.setCachedMetrics(currentFilters, metricsData);
          });
        }
        
        return;
      }

      // No cache hit - fetch from API
      setLoading(true);
      setPaginationLoading(true);
      
      console.log(`🔄 Fetching fresh data for page ${page} (${mode} mode)`);
      
      const result = await cache.fetchWithCache(currentFilters, page, sortState, mode, itemsPerPage);
      
      // Set state from fresh data
      const { creators: freshCreators } = result;
      
      if (mode === 'ai') {
        setAiRecommendedCreators(freshCreators);
      } else {
        setAllCreators(freshCreators);
      }
      
      setCreators(freshCreators);
      setFilteredCreators(freshCreators);
      setPaginatedCreators(freshCreators);
      
      if (shouldUpdatePage) {
        setCurrentPage(page);
        localStorage.setItem('discover_currentPage', page.toString());
      }
      
      setTotalPages(result.totalPages);
      setTotalFilteredCount(result.totalCount);
      setLoading(false);
      setPaginationLoading(false);
      
      // Fetch and cache metrics
      const metricsData = await fetchCreatorMetrics(currentFilters, mode);
      setMetrics(metricsData);
      cache.setCachedMetrics(currentFilters, metricsData);
      
    } catch (err) {
      console.error('Error loading creators:', err);
      setError(err instanceof Error ? err.message : 'Failed to load creators');
      setLoading(false);
      setPaginationLoading(false);
    }
  }, [currentMode, currentPage, currentFilters, sortState, itemsPerPage, cache]);

  // Enhanced filter application with cache invalidation
  const applyFilters = React.useCallback(async (newFilters: DatabaseFilters) => {
    console.log('🔍 Applying new filters:', newFilters);
    
    // Update filters state
    setCurrentFilters(newFilters);
    localStorage.setItem('discover_currentFilters', JSON.stringify(newFilters));
    
    // Reset to page 1
    setCurrentPage(1);
    localStorage.setItem('discover_currentPage', '1');
    
    // Invalidate cache for old filters
    cache.invalidateCache('pages');
    
    // Load with new filters
    await loadCreators(currentMode, 1, true);
  }, [currentMode, loadCreators, cache]);

  // Enhanced sorting with caching
  const handleSort = React.useCallback(async (field: SortField) => {
    const newDirection: SortDirection = 
      sortState.field === field && sortState.direction === 'desc' ? 'asc' : 'desc';
    
    const newSortState: SortState = { field, direction: newDirection };
    
    console.log('🔄 Sorting by:', field, newDirection);
    
    setSortState(newSortState);
    localStorage.setItem('discover_sortState', JSON.stringify(newSortState));
    
    // Reset to page 1 for new sort
    setCurrentPage(1);
    localStorage.setItem('discover_currentPage', '1');
    
    // Invalidate cache for old sort
    cache.invalidateCache('pages');
    
    // Load with new sort
    await loadCreators(currentMode, 1, true);
  }, [sortState, currentMode, loadCreators, cache]);

  // Enhanced pagination with preloading
  const handlePageChange = React.useCallback(async (page: number) => {
    if (page === currentPage) return;
    
    console.log(`📄 Changing to page ${page}`);
    
    // Track page visit for better preloading
    cache.trackPageVisit(page, currentFilters, sortState);
    
    setPaginationLoading(true);
    await loadCreators(currentMode, page, true);
  }, [currentPage, currentMode, loadCreators, cache, currentFilters, sortState]);

  // Mode switching with cache management
  const switchMode = React.useCallback(async (newMode: CreatorListMode) => {
    if (newMode === currentMode) return;
    
    console.log(`🔄 Switching to ${newMode} mode`);
    
    setIsModeSwitching(true);
    setCurrentMode(newMode);
    localStorage.setItem('discover_currentMode', newMode);
    
    // Reset to page 1
    setCurrentPage(1);
    localStorage.setItem('discover_currentPage', '1');
    
    await loadCreators(newMode, 1, true);
    setIsModeSwitching(false);
  }, [currentMode, loadCreators]);

  // Pagination helpers
  const nextPage = React.useCallback(() => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, handlePageChange]);

  const previousPage = React.useCallback(() => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  }, [currentPage, handlePageChange]);

  const goToFirstPage = React.useCallback(() => {
    if (currentPage !== 1) {
      handlePageChange(1);
    }
  }, [currentPage, handlePageChange]);

  const goToLastPage = React.useCallback(() => {
    if (currentPage !== totalPages) {
      handlePageChange(totalPages);
    }
  }, [currentPage, totalPages, handlePageChange]);

  // Items per page change
  const handleItemsPerPageChange = React.useCallback(async (newItemsPerPage: number) => {
    console.log(`📊 Changing items per page to ${newItemsPerPage}`);
    
    setItemsPerPage(newItemsPerPage);
    localStorage.setItem('discover_itemsPerPage', newItemsPerPage.toString());
    
    // Reset to page 1
    setCurrentPage(1);
    localStorage.setItem('discover_currentPage', '1');
    
    // Invalidate cache since pagination changed
    cache.invalidateCache('pages');
    
    await loadCreators(currentMode, 1, true);
  }, [currentMode, loadCreators, cache]);

  // Initialize data on mount
  React.useEffect(() => {
    loadCreators();
  }, []); // Only run once on mount

  // Get cache statistics for debugging
  const getCacheStats = React.useCallback(() => {
    return cache.getCacheStats();
  }, [cache]);

  return {
    // Data
    creators,
    filteredCreators,
    paginatedCreators,
    aiRecommendedCreators,
    allCreators,
    niches,
    metrics,
    
    // State
    currentMode,
    currentPage,
    totalPages,
    totalCreators: totalFilteredCount, // Add this for CreatorListSection compatibility
    totalFilteredCount,
    loading,
    paginationLoading,
    error,
    itemsPerPage,
    isModeSwitching,
    currentFilters,
    sortState,
    
    // Actions
    loadCreators,
    applyFilters,
    handleSort,
    handlePageChange,
    switchMode,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    handleItemsPerPageChange,
    
    // Cache management
    invalidateCache: cache.invalidateCache,
    getCacheStats,
    cacheHitRate: cache.cacheHitRate,
    isPreloading: cache.isPreloading
  };
};
