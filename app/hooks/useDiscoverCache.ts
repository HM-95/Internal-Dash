/**
 * Discover Cache Hook
 * Integrates the discover caching system with React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { DiscoverCacheManager, PageCacheData } from '@/lib/discoverCache';
import { Creator, DatabaseFilters, CreatorMetrics, SortState, CreatorListMode } from '@/types/database';

interface UseDiscoverCacheOptions {
  enablePreloading?: boolean;
  preloadAdjacent?: boolean;
  trackUserBehavior?: boolean;
}

interface UseDiscoverCacheReturn {
  // Cache operations
  getCachedPage: (filters: DatabaseFilters, page: number, sortState: SortState, mode: CreatorListMode, itemsPerPage: number) => PageCacheData | null;
  setCachedPage: (filters: DatabaseFilters, page: number, sortState: SortState, mode: CreatorListMode, itemsPerPage: number, data: PageCacheData) => void;
  getCachedMetrics: (filters: DatabaseFilters) => CreatorMetrics | null;
  setCachedMetrics: (filters: DatabaseFilters, metrics: CreatorMetrics) => void;
  
  // Preloading
  preloadPage: (filters: DatabaseFilters, page: number, sortState: SortState, mode: CreatorListMode, itemsPerPage: number, dataFetcher: any) => Promise<void>;
  preloadAdjacentPages: (filters: DatabaseFilters, currentPage: number, sortState: SortState, mode: CreatorListMode, itemsPerPage: number, totalPages: number, dataFetcher: any) => void;
  
  // User behavior tracking
  trackPageVisit: (page: number, filters: DatabaseFilters, sortState: SortState) => void;
  
  // Cache management
  invalidateCache: (type?: 'pages' | 'metrics' | 'all', filters?: DatabaseFilters) => void;
  getCacheStats: () => any;
  
  // State
  isPreloading: boolean;
  cacheHitRate: number;
}

export const useDiscoverCache = (options: UseDiscoverCacheOptions = {}): UseDiscoverCacheReturn => {
  const {
    enablePreloading = true,
    preloadAdjacent = true,
    trackUserBehavior = true
  } = options;

  const [isPreloading, setIsPreloading] = useState(false);
  const [cacheHitRate, setCacheHitRate] = useState(0);
  const cacheHits = useRef(0);
  const cacheMisses = useRef(0);

  // Update cache hit rate
  const updateCacheHitRate = useCallback(() => {
    const total = cacheHits.current + cacheMisses.current;
    if (total > 0) {
      setCacheHitRate((cacheHits.current / total) * 100);
    }
  }, []);

  // Get cached page data
  const getCachedPage = useCallback((
    filters: DatabaseFilters, 
    page: number, 
    sortState: SortState, 
    mode: CreatorListMode, 
    itemsPerPage: number
  ): PageCacheData | null => {
    const cached = DiscoverCacheManager.getCachedPageData(filters, page, sortState, mode, itemsPerPage);
    
    if (cached) {
      cacheHits.current++;
      console.log(`🎯 Cache hit for page ${page}`);
    } else {
      cacheMisses.current++;
      console.log(`❌ Cache miss for page ${page}`);
    }
    
    updateCacheHitRate();
    return cached;
  }, [updateCacheHitRate]);

  // Set cached page data
  const setCachedPage = useCallback((
    filters: DatabaseFilters, 
    page: number, 
    sortState: SortState, 
    mode: CreatorListMode, 
    itemsPerPage: number, 
    data: PageCacheData
  ) => {
    DiscoverCacheManager.setCachedPageData(filters, page, sortState, mode, itemsPerPage, data);
    console.log(`💾 Cached page ${page} data`);
  }, []);

  // Get cached metrics
  const getCachedMetrics = useCallback((filters: DatabaseFilters): CreatorMetrics | null => {
    const cached = DiscoverCacheManager.getCachedMetrics(filters);
    
    if (cached) {
      console.log('📊 Using cached metrics');
    }
    
    return cached;
  }, []);

  // Set cached metrics
  const setCachedMetrics = useCallback((filters: DatabaseFilters, metrics: CreatorMetrics) => {
    DiscoverCacheManager.setCachedMetrics(filters, metrics);
    console.log('💾 Cached metrics data');
  }, []);

  // Preload a specific page
  const preloadPage = useCallback(async (
    filters: DatabaseFilters, 
    page: number, 
    sortState: SortState, 
    mode: CreatorListMode, 
    itemsPerPage: number,
    dataFetcher: (filters: DatabaseFilters, page: number, sortState: SortState, mode: CreatorListMode, itemsPerPage: number) => Promise<PageCacheData>
  ) => {
    if (!enablePreloading) return;

    setIsPreloading(true);
    try {
      await DiscoverCacheManager.preloadPage(filters, page, sortState, mode, itemsPerPage, dataFetcher);
    } catch (error) {
      console.warn('Preload failed:', error);
    } finally {
      setIsPreloading(false);
    }
  }, [enablePreloading]);

  // Preload adjacent pages
  const preloadAdjacentPages = useCallback((
    filters: DatabaseFilters, 
    currentPage: number, 
    sortState: SortState, 
    mode: CreatorListMode, 
    itemsPerPage: number, 
    totalPages: number,
    dataFetcher: (filters: DatabaseFilters, page: number, sortState: SortState, mode: CreatorListMode, itemsPerPage: number) => Promise<PageCacheData>
  ) => {
    if (!enablePreloading || !preloadAdjacent) return;

    // Preload next page
    if (currentPage < totalPages) {
      setTimeout(() => {
        preloadPage(filters, currentPage + 1, sortState, mode, itemsPerPage, dataFetcher);
      }, 500); // Small delay to not interfere with current page loading
    }

    // Preload previous page
    if (currentPage > 1) {
      setTimeout(() => {
        preloadPage(filters, currentPage - 1, sortState, mode, itemsPerPage, dataFetcher);
      }, 1000); // Longer delay for previous page
    }
  }, [enablePreloading, preloadAdjacent, preloadPage]);

  // Track user page visit
  const trackPageVisit = useCallback((page: number, filters: DatabaseFilters, sortState: SortState) => {
    if (!trackUserBehavior) return;
    
    DiscoverCacheManager.trackPageVisit(page, filters, sortState);
  }, [trackUserBehavior]);

  // Cache invalidation
  const invalidateCache = useCallback((type?: 'pages' | 'metrics' | 'all', filters?: DatabaseFilters) => {
    switch (type) {
      case 'pages':
        DiscoverCacheManager.invalidatePageCache(filters);
        break;
      case 'metrics':
        DiscoverCacheManager.invalidateMetricsCache(filters);
        break;
      case 'all':
      default:
        DiscoverCacheManager.invalidateAll();
        break;
    }
    
    // Reset cache hit rate
    cacheHits.current = 0;
    cacheMisses.current = 0;
    setCacheHitRate(0);
    
    console.log(`🗑️ Invalidated ${type || 'all'} cache`);
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const stats = DiscoverCacheManager.getCacheStats();
    return {
      ...stats,
      cacheHitRate: cacheHitRate.toFixed(1) + '%',
      totalRequests: cacheHits.current + cacheMisses.current,
      cacheHits: cacheHits.current,
      cacheMisses: cacheMisses.current
    };
  }, [cacheHitRate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Optional: Could implement cleanup logic here
    };
  }, []);

  return {
    // Cache operations
    getCachedPage,
    setCachedPage,
    getCachedMetrics,
    setCachedMetrics,
    
    // Preloading
    preloadPage,
    preloadAdjacentPages,
    
    // User behavior tracking
    trackPageVisit,
    
    // Cache management
    invalidateCache,
    getCacheStats,
    
    // State
    isPreloading,
    cacheHitRate
  };
};

// Enhanced version that integrates with data fetching
export const useDiscoverCacheWithFetcher = (
  dataFetcher: (filters: DatabaseFilters, page: number, sortState: SortState, mode: CreatorListMode, itemsPerPage: number) => Promise<{
    creators: Creator[];
    totalCount: number;
    totalPages: number;
  }>,
  options: UseDiscoverCacheOptions = {}
) => {
  const cache = useDiscoverCache(options);
  
  // Enhanced fetch function that uses cache
  const fetchWithCache = useCallback(async (
    filters: DatabaseFilters, 
    page: number, 
    sortState: SortState, 
    mode: CreatorListMode, 
    itemsPerPage: number
  ): Promise<PageCacheData> => {
    // Check cache first
    const cached = cache.getCachedPage(filters, page, sortState, mode, itemsPerPage);
    if (cached) {
      // Trigger preloading of adjacent pages in background
      cache.preloadAdjacentPages(filters, page, sortState, mode, itemsPerPage, cached.totalPages, fetchWithCache);
      return cached;
    }

    // Fetch from API
    console.log(`🔄 Fetching page ${page} from API`);
    const result = await dataFetcher(filters, page, sortState, mode, itemsPerPage);
    
    // Create cache data
    const cacheData: PageCacheData = {
      creators: result.creators,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      page,
      sortState,
      filters,
      mode,
      itemsPerPage
    };
    
    // Cache the result
    cache.setCachedPage(filters, page, sortState, mode, itemsPerPage, cacheData);
    
    // Track user behavior
    cache.trackPageVisit(page, filters, sortState);
    
    // Trigger preloading of adjacent pages
    cache.preloadAdjacentPages(filters, page, sortState, mode, itemsPerPage, result.totalPages, fetchWithCache);
    
    return cacheData;
  }, [cache, dataFetcher]);

  return {
    ...cache,
    fetchWithCache
  };
};
