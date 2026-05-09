import { useState, useCallback } from 'react'
import { Influencer, InfluencerSearchFilters } from '../types/database';

interface UseInfluencerSearchReturn {
  influencers: Influencer[]
  isLoading: boolean
  error: string | null
  stats: {
    total: number
    platforms: string[]
    niches: string[]
    avgEngagement: number
  } | null
  searchInfluencers: (query: string, filters?: InfluencerSearchFilters, includeAI?: boolean) => Promise<void>
  clearResults: () => void
}

export function useInfluencerSearch(): UseInfluencerSearchReturn {
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    total: number
    platforms: string[]
    niches: string[]
    avgEngagement: number
  } | null>(null)

  const searchInfluencers = useCallback(async (
    query: string, 
    filters: InfluencerSearchFilters = {}, 
    includeAI = false
  ) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/influencers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, filters, includeAI })
      })

      const data = await response.json()

      if (response.ok) {
        setInfluencers(data.influencers)
        setStats(data.stats)
      } else {
        setError(data.error || 'Failed to search influencers')
      }
    } catch (err) {
      setError('Failed to search influencers')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setInfluencers([])
    setError(null)
  }, [])

  return {
    influencers,
    isLoading,
    error,
    stats,
    searchInfluencers,
    clearResults
  }
} 