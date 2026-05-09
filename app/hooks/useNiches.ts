import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Niche } from '../types/database';

// Cache configuration
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const CACHE_KEY = 'niches_list';

// Helper functions for caching
const getCachedData = (key: string) => {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
};

const setCachedData = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch {
    // Ignore cache errors
  }
};

export function useNiches() {
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNiches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear cache to force fresh data check
      console.log('🔄 Clearing niches cache to force fresh data check');
      localStorage.removeItem(CACHE_KEY);
      
      // Check cache first (should be empty now)
      const cachedNiches = getCachedData(CACHE_KEY);
      if (cachedNiches) {
        console.log('✅ Using cached niches data');
        setNiches(cachedNiches);
        setLoading(false);
        return cachedNiches;
      }
      
      // Try healthwellness table first, fallback to creatordata
      let { data, error: queryError } = await supabase
        .from('healthwellness')
        .select('secondary_niche');
      
      console.log('🔍 Healthwellness query result:', { 
        error: queryError, 
        dataLength: data?.length, 
        hasData: data && data.length > 0 
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
          
          const uniqueNiches: Niche[] = Array.from(nicheSet)
            .sort()
            .map(name => ({
              id: name.toLowerCase().replace(/\s+/g, '-'),
              name,
              created_at: new Date().toISOString()
            }));
          
          setNiches(uniqueNiches);
          setCachedData(CACHE_KEY, uniqueNiches);
          console.log(`✅ Loaded ${uniqueNiches.length} niches from creatordata fallback`);
          return uniqueNiches;
        }
      }
      
      if (queryError) throw queryError;
      
      // Extract unique secondary niches only
      const nicheSet = new Set<string>();
      data?.forEach(creator => {
        if (creator.secondary_niche) nicheSet.add(creator.secondary_niche);
      });
      
      // Convert to Niche objects and sort alphabetically
      const uniqueNiches: Niche[] = Array.from(nicheSet)
        .sort()
        .map(name => ({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          created_at: new Date().toISOString()
        }));
      
      setNiches(uniqueNiches);
      
      // Cache the niches for future use
      setCachedData(CACHE_KEY, uniqueNiches);
      console.log(`✅ Loaded and cached ${uniqueNiches.length} niches`);
      
      return uniqueNiches;
      
    } catch (err) {
      console.error('Error loading niches:', err);
      setError(err instanceof Error ? err.message : 'Failed to load niches');
      // Fallback to empty array
      setNiches([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Load niches on mount
  useEffect(() => {
    loadNiches();
  }, []);

  // Return niche names as string array for compatibility with existing code
  const nicheNames = niches.map(niche => niche.name);

  return {
    niches,
    nicheNames,
    loading,
    error,
    loadNiches,
    refresh: loadNiches
  };
}
