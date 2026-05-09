'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserPreferences, CreateUserPreferencesRequest, UpdateUserPreferencesRequest, UsageStats } from '@/types/userPreferences';

interface UseUserPreferencesReturn {
  preferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
  usageStats: UsageStats | null;
  createPreferences: (data: CreateUserPreferencesRequest) => Promise<boolean>;
  updatePreferences: (data: UpdateUserPreferencesRequest) => Promise<boolean>;
  incrementUsage: (action: 'import' | 'export' | 'ai_search') => Promise<boolean>;
  refreshPreferences: () => Promise<void>;
  refreshUsage: () => Promise<void>;
}

export function useUserPreferences(): UseUserPreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user-preferences');
      const result = await response.json();
      
      if (result.success) {
        setPreferences(result.data);
      } else {
        setError(result.error || 'Failed to fetch preferences');
      }
    } catch (err) {
      setError('Failed to fetch preferences');
      console.error('Error fetching preferences:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsageStats = useCallback(async () => {
    try {
      const response = await fetch('/api/user-preferences/usage');
      const result = await response.json();
      
      if (result.success) {
        setUsageStats(result.data);
      } else {
        console.error('Failed to fetch usage stats:', result.error);
      }
    } catch (err) {
      console.error('Error fetching usage stats:', err);
    }
  }, []);

  const createPreferences = useCallback(async (data: CreateUserPreferencesRequest): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch('/api/user-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPreferences(result.data);
        return true;
      } else {
        setError(result.error || 'Failed to create preferences');
        return false;
      }
    } catch (err) {
      setError('Failed to create preferences');
      console.error('Error creating preferences:', err);
      return false;
    }
  }, []);

  const updatePreferences = useCallback(async (data: UpdateUserPreferencesRequest): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch('/api/user-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPreferences(result.data);
        return true;
      } else {
        setError(result.error || 'Failed to update preferences');
        return false;
      }
    } catch (err) {
      setError('Failed to update preferences');
      console.error('Error updating preferences:', err);
      return false;
    }
  }, []);

  const incrementUsage = useCallback(async (action: 'import' | 'export' | 'ai_search'): Promise<boolean> => {
    try {
      const response = await fetch('/api/user-preferences/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh usage stats after incrementing
        await fetchUsageStats();
        return true;
      } else {
        console.error('Failed to increment usage:', result.error);
        return false;
      }
    } catch (err) {
      console.error('Error incrementing usage:', err);
      return false;
    }
  }, [fetchUsageStats]);

  const refreshPreferences = useCallback(async () => {
    await fetchPreferences();
  }, [fetchPreferences]);

  const refreshUsage = useCallback(async () => {
    await fetchUsageStats();
  }, [fetchUsageStats]);

  // Initial fetch
  useEffect(() => {
    fetchPreferences();
    fetchUsageStats();
  }, [fetchPreferences, fetchUsageStats]);

  return {
    preferences,
    loading,
    error,
    usageStats,
    createPreferences,
    updatePreferences,
    incrementUsage,
    refreshPreferences,
    refreshUsage,
  };
}
