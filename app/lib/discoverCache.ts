/**
 * Discover Page Caching System
 * Provides intelligent caching and preloading for the discover page
 */

import { Creator, DatabaseFilters, CreatorMetrics, SortState, CreatorListMode } from '@/types/database';

// Cache configuration
const CACHE_KEYS = {
  PAGE_DATA: 'discover_page_',
  METRICS: 'discover_metrics_',
  FILTERS: 'discover_filters_',
  PRELOAD_QUEUE: 'discover_preload_queue',
  USER_BEHAVIOR: 'discover_user_behavior'
} as const;

const CACHE_DURATIONS = {
  PAGE_DATA: 5 * 60 * 1000, // 5 minutes
  METRICS: 10 * 60 * 1000, // 10 minutes
  FILTERS: 30 * 60 * 1000, // 30 minutes
  USER_BEHAVIOR: 24 * 60 * 60 * 1000, // 24 hours
} as const;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

interface PageCacheData {
  creators: Creator[];
  totalCount: number;
  totalPages: number;
  page: number;
  sortState: SortState;
  filters: DatabaseFilters;
  mode: CreatorListMode;
  itemsPerPage: number;
}

interface UserBehavior {
  mostUsedFilters: Record<string, number>;
  commonSortFields: Record<string, number>;
  frequentPages: Record<number, number>;
  sessionStartTime: number;
  totalSessions: number;
}

interface PreloadItem {
  key: string;
  priority: number;
  filters: DatabaseFilters;
  page: number;
  sortState: SortState;
  mode: CreatorListMode;
  itemsPerPage: number;
}

// In-memory cache with localStorage backup
class DiscoverCache {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private preloadQueue: PreloadItem[] = [];
  private isPreloading = false;

  // Generate cache key
  private generateKey(prefix: string, filters: DatabaseFilters, page?: number, sortState?: SortState, mode?: CreatorListMode, itemsPerPage?: number): string {
    const filterHash = this.hashFilters(filters);
    const sortKey = sortState ? `${sortState.field}:${sortState.direction}` : 'default';
    const pageKey = page ? `p${page}` : '';
    const modeKey = mode ? `m${mode}` : '';
    const itemsKey = itemsPerPage ? `i${itemsPerPage}` : '';
    
    return `${prefix}${filterHash}_${sortKey}_${pageKey}_${modeKey}_${itemsKey}`;
  }

  // Hash filters for consistent cache keys
  private hashFilters(filters: DatabaseFilters): string {
    const normalized = {
      niches: filters.niches?.sort() || [],
      platforms: filters.platforms?.sort() || [],
      locations: filters.locations?.sort() || [],
      buzz_scores: filters.buzz_scores?.sort() || [],
      followers_min: filters.followers_min,
      followers_max: filters.followers_max,
      engagement_min: filters.engagement_min,
      engagement_max: filters.engagement_max,
      avg_views_min: filters.avg_views_min,
      avg_views_max: filters.avg_views_max
    };
    
    const str = JSON.stringify(normalized);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Get cached data
  private get<T>(key: string): T | null {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && Date.now() < memoryEntry.expiresAt) {
      memoryEntry.accessCount++;
      memoryEntry.lastAccessed = Date.now();
      return memoryEntry.data;
    }

    // Check localStorage cache
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored);
          if (Date.now() < entry.expiresAt) {
            // Restore to memory cache
            entry.accessCount++;
            entry.lastAccessed = Date.now();
            this.memoryCache.set(key, entry);
            return entry.data;
          } else {
            // Expired, remove from localStorage
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.warn('Discover cache read error:', error);
      }
    }

    // Clean up expired memory cache entry
    if (memoryEntry) {
      this.memoryCache.delete(key);
    }

    return null;
  }

  // Set cached data
  private set<T>(key: string, data: T, duration: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);

    // Store in localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(entry));
      } catch (error) {
        console.warn('Discover cache write error:', error);
        // If localStorage is full, clean up old entries
        this.cleanupOldEntries();
        try {
          localStorage.setItem(key, JSON.stringify(entry));
        } catch (retryError) {
          console.warn('Discover cache write retry failed:', retryError);
        }
      }
    }
  }

  // Clean up old entries when storage is full
  private cleanupOldEntries(): void {
    if (typeof window === 'undefined') return;

    try {
      const entries: Array<{ key: string; entry: CacheEntry<any> }> = [];
      
      // Collect all discover cache entries
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('discover_')) {
          try {
            const entry = JSON.parse(localStorage.getItem(key) || '');
            entries.push({ key, entry });
          } catch (e) {
            // Remove invalid entries
            localStorage.removeItem(key);
          }
        }
      }

      // Sort by last accessed time (oldest first)
      entries.sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);

      // Remove oldest 25% of entries
      const toRemove = Math.ceil(entries.length * 0.25);
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(entries[i].key);
        this.memoryCache.delete(entries[i].key);
      }

      console.log(`🧹 Cleaned up ${toRemove} old discover cache entries`);
    } catch (error) {
      console.warn('Error cleaning up cache entries:', error);
    }
  }

  // Page data caching
  getCachedPageData(filters: DatabaseFilters, page: number, sortState: SortState, mode: CreatorListMode, itemsPerPage: number): PageCacheData | null {
    const key = this.generateKey(CACHE_KEYS.PAGE_DATA, filters, page, sortState, mode, itemsPerPage);
    const cached = this.get<PageCacheData>(key);
    
    if (cached) {
      console.log(`📄 Using cached page data for page ${page}`);
      this.trackUserBehavior('page_cache_hit', { page, filters, sortState });
    }
    
    return cached;
  }

  setCachedPageData(filters: DatabaseFilters, page: number, sortState: SortState, mode: CreatorListMode, itemsPerPage: number, data: PageCacheData): void {
    const key = this.generateKey(CACHE_KEYS.PAGE_DATA, filters, page, sortState, mode, itemsPerPage);
    console.log(`💾 Caching page data for page ${page}`);
    this.set(key, data, CACHE_DURATIONS.PAGE_DATA);
    
    // Add adjacent pages to preload queue
    this.queueAdjacentPages(filters, page, sortState, mode, itemsPerPage, data.totalPages);
  }

  // Metrics caching
  getCachedMetrics(filters: DatabaseFilters): CreatorMetrics | null {
    const key = this.generateKey(CACHE_KEYS.METRICS, filters);
    const cached = this.get<CreatorMetrics>(key);
    
    if (cached) {
      console.log('📊 Using cached metrics data');
    }
    
    return cached;
  }

  setCachedMetrics(filters: DatabaseFilters, metrics: CreatorMetrics): void {
    const key = this.generateKey(CACHE_KEYS.METRICS, filters);
    console.log('💾 Caching metrics data');
    this.set(key, metrics, CACHE_DURATIONS.METRICS);
  }

  // User behavior tracking
  private trackUserBehavior(action: string, data: any): void {
    try {
      const behavior = this.getUserBehavior();
      
      switch (action) {
        case 'page_visit':
          behavior.frequentPages[data.page] = (behavior.frequentPages[data.page] || 0) + 1;
          break;
        case 'filter_use':
          Object.keys(data.filters).forEach(filterKey => {
            if (data.filters[filterKey]) {
              behavior.mostUsedFilters[filterKey] = (behavior.mostUsedFilters[filterKey] || 0) + 1;
            }
          });
          break;
        case 'sort_use':
          if (data.sortState?.field) {
            behavior.commonSortFields[data.sortState.field] = (behavior.commonSortFields[data.sortState.field] || 0) + 1;
          }
          break;
        case 'page_cache_hit':
          // Track successful cache hits for optimization
          break;
      }
      
      this.setUserBehavior(behavior);
    } catch (error) {
      console.warn('Error tracking user behavior:', error);
    }
  }

  private getUserBehavior(): UserBehavior {
    const cached = this.get<UserBehavior>(CACHE_KEYS.USER_BEHAVIOR);
    return cached || {
      mostUsedFilters: {},
      commonSortFields: {},
      frequentPages: {},
      sessionStartTime: Date.now(),
      totalSessions: 1
    };
  }

  private setUserBehavior(behavior: UserBehavior): void {
    this.set(CACHE_KEYS.USER_BEHAVIOR, behavior, CACHE_DURATIONS.USER_BEHAVIOR);
  }

  // Intelligent preloading
  private queueAdjacentPages(filters: DatabaseFilters, currentPage: number, sortState: SortState, mode: CreatorListMode, itemsPerPage: number, totalPages: number): void {
    const behavior = this.getUserBehavior();
    
    // Queue next page (high priority)
    if (currentPage < totalPages) {
      this.addToPreloadQueue({
        key: this.generateKey(CACHE_KEYS.PAGE_DATA, filters, currentPage + 1, sortState, mode, itemsPerPage),
        priority: 10,
        filters,
        page: currentPage + 1,
        sortState,
        mode,
        itemsPerPage
      });
    }

    // Queue previous page (medium priority)
    if (currentPage > 1) {
      this.addToPreloadQueue({
        key: this.generateKey(CACHE_KEYS.PAGE_DATA, filters, currentPage - 1, sortState, mode, itemsPerPage),
        priority: 7,
        filters,
        page: currentPage - 1,
        sortState,
        mode,
        itemsPerPage
      });
    }

    // Queue frequently visited pages (low priority)
    const frequentPages = Object.entries(behavior.frequentPages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([page]) => parseInt(page));

    frequentPages.forEach(page => {
      if (page !== currentPage && page <= totalPages) {
        this.addToPreloadQueue({
          key: this.generateKey(CACHE_KEYS.PAGE_DATA, filters, page, sortState, mode, itemsPerPage),
          priority: 3,
          filters,
          page,
          sortState,
          mode,
          itemsPerPage
        });
      }
    });

    this.processPreloadQueue();
  }

  private addToPreloadQueue(item: PreloadItem): void {
    // Check if already cached
    if (this.get(item.key)) return;

    // Check if already in queue
    if (this.preloadQueue.some(queued => queued.key === item.key)) return;

    this.preloadQueue.push(item);
    
    // Sort by priority (highest first)
    this.preloadQueue.sort((a, b) => b.priority - a.priority);
    
    // Limit queue size
    if (this.preloadQueue.length > 10) {
      this.preloadQueue = this.preloadQueue.slice(0, 10);
    }
  }

  private async processPreloadQueue(): Promise<void> {
    if (this.isPreloading || this.preloadQueue.length === 0) return;

    this.isPreloading = true;

    try {
      // Process one item at a time to avoid overwhelming the system
      const item = this.preloadQueue.shift();
      if (!item) return;

      console.log(`🚀 Preloading page ${item.page} (priority: ${item.priority})`);

      // Use requestIdleCallback if available, otherwise setTimeout
      const schedulePreload = (callback: () => void) => {
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          (window as any).requestIdleCallback(callback, { timeout: 2000 });
        } else {
          setTimeout(callback, 100);
        }
      };

      schedulePreload(async () => {
        try {
          // This would be called by the actual data fetching function
          // For now, we just mark the slot as reserved
          console.log(`⏳ Preload slot reserved for page ${item.page}`);
          
          // Continue processing queue
          setTimeout(() => {
            this.isPreloading = false;
            this.processPreloadQueue();
          }, 500);
        } catch (error) {
          console.warn('Preload error:', error);
          this.isPreloading = false;
        }
      });
    } catch (error) {
      console.warn('Error processing preload queue:', error);
      this.isPreloading = false;
    }
  }

  // Public method to trigger preloading with actual data fetcher
  async preloadPage(
    filters: DatabaseFilters, 
    page: number, 
    sortState: SortState, 
    mode: CreatorListMode, 
    itemsPerPage: number,
    dataFetcher: (filters: DatabaseFilters, page: number, sortState: SortState, mode: CreatorListMode, itemsPerPage: number) => Promise<PageCacheData>
  ): Promise<void> {
    const key = this.generateKey(CACHE_KEYS.PAGE_DATA, filters, page, sortState, mode, itemsPerPage);
    
    // Skip if already cached
    if (this.get(key)) return;

    try {
      console.log(`🔄 Fetching data for preload: page ${page}`);
      const data = await dataFetcher(filters, page, sortState, mode, itemsPerPage);
      this.setCachedPageData(filters, page, sortState, mode, itemsPerPage, data);
      console.log(`✅ Preloaded page ${page}`);
    } catch (error) {
      console.warn(`❌ Failed to preload page ${page}:`, error);
    }
  }

  // Cache invalidation
  invalidatePageCache(filters?: DatabaseFilters): void {
    console.log('🗑️ Invalidating page cache');
    
    if (filters) {
      const filterHash = this.hashFilters(filters);
      this.clearByPattern(`${CACHE_KEYS.PAGE_DATA}${filterHash}`);
    } else {
      this.clearByPattern(CACHE_KEYS.PAGE_DATA);
    }
  }

  invalidateMetricsCache(filters?: DatabaseFilters): void {
    console.log('🗑️ Invalidating metrics cache');
    
    if (filters) {
      const filterHash = this.hashFilters(filters);
      this.clearByPattern(`${CACHE_KEYS.METRICS}${filterHash}`);
    } else {
      this.clearByPattern(CACHE_KEYS.METRICS);
    }
  }

  invalidateAll(): void {
    console.log('🗑️ Clearing all discover cache');
    this.clearByPattern('discover_');
    this.preloadQueue = [];
  }

  private clearByPattern(pattern: string): void {
    // Clear memory cache
    const keysToDelete: string[] = [];
    this.memoryCache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.memoryCache.delete(key));

    // Clear localStorage
    if (typeof window !== 'undefined') {
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.includes(pattern)) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.warn('Error clearing localStorage cache:', error);
      }
    }
  }

  // Get cache statistics
  getCacheStats(): { 
    memoryEntries: number; 
    localStorageEntries: number; 
    preloadQueueSize: number;
    topFilters: Array<{ filter: string; count: number }>;
    topPages: Array<{ page: number; count: number }>;
  } {
    let memoryEntries = 0;
    this.memoryCache.forEach((_, key) => {
      if (key.startsWith('discover_')) {
        memoryEntries++;
      }
    });

    let localStorageEntries = 0;
    if (typeof window !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('discover_')) {
            localStorageEntries++;
          }
        }
      } catch (error) {
        // Ignore localStorage errors
      }
    }

    const behavior = this.getUserBehavior();
    const topFilters = Object.entries(behavior.mostUsedFilters)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([filter, count]) => ({ filter, count }));

    const topPages = Object.entries(behavior.frequentPages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([page, count]) => ({ page: parseInt(page), count }));

    return { 
      memoryEntries, 
      localStorageEntries, 
      preloadQueueSize: this.preloadQueue.length,
      topFilters,
      topPages
    };
  }

  // Track user interactions for better preloading
  trackPageVisit(page: number, filters: DatabaseFilters, sortState: SortState): void {
    this.trackUserBehavior('page_visit', { page });
    this.trackUserBehavior('filter_use', { filters });
    this.trackUserBehavior('sort_use', { sortState });
  }
}

// Export singleton instance
export const discoverCache = new DiscoverCache();

// Export cache management functions
export const DiscoverCacheManager = {
  // Page data caching
  getCachedPageData: (filters: DatabaseFilters, page: number, sortState: SortState, mode: CreatorListMode, itemsPerPage: number) => 
    discoverCache.getCachedPageData(filters, page, sortState, mode, itemsPerPage),
  
  setCachedPageData: (filters: DatabaseFilters, page: number, sortState: SortState, mode: CreatorListMode, itemsPerPage: number, data: PageCacheData) => 
    discoverCache.setCachedPageData(filters, page, sortState, mode, itemsPerPage, data),

  // Metrics caching
  getCachedMetrics: (filters: DatabaseFilters) => discoverCache.getCachedMetrics(filters),
  setCachedMetrics: (filters: DatabaseFilters, metrics: CreatorMetrics) => discoverCache.setCachedMetrics(filters, metrics),

  // Preloading
  preloadPage: (filters: DatabaseFilters, page: number, sortState: SortState, mode: CreatorListMode, itemsPerPage: number, dataFetcher: any) => 
    discoverCache.preloadPage(filters, page, sortState, mode, itemsPerPage, dataFetcher),

  // User behavior tracking
  trackPageVisit: (page: number, filters: DatabaseFilters, sortState: SortState) => 
    discoverCache.trackPageVisit(page, filters, sortState),

  // Cache invalidation
  invalidatePageCache: (filters?: DatabaseFilters) => discoverCache.invalidatePageCache(filters),
  invalidateMetricsCache: (filters?: DatabaseFilters) => discoverCache.invalidateMetricsCache(filters),
  invalidateAll: () => discoverCache.invalidateAll(),

  // Utilities
  getCacheStats: () => discoverCache.getCacheStats()
};

export type { PageCacheData, UserBehavior, PreloadItem };
