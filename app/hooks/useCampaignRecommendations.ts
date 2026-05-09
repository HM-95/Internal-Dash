import { useState, useCallback } from 'react'
import { Creator, CampaignRecommendation } from '../types/database';

interface UseCampaignRecommendationsReturn {
  recommendations: CampaignRecommendation[]
  isLoading: boolean
  error: string | null
  createRecommendation: (
    sessionId: string,
    influencerIds: string[],
    chatContext: string,
    estimatedReach?: number,
    estimatedEngagementRate?: number,
    budgetRange?: { min: number; max: number; currency: string }
  ) => Promise<CampaignRecommendation | null>
  getRecommendations: (sessionId: string) => Promise<void>
  clearRecommendations: () => void
}

export function useCampaignRecommendations(): UseCampaignRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<CampaignRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createRecommendation = useCallback(async (
    sessionId: string,
    influencerIds: string[],
    chatContext: string,
    estimatedReach = 0,
    estimatedEngagementRate = 0,
    budgetRange = { min: 0, max: 0, currency: 'USD' }
  ): Promise<CampaignRecommendation | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/campaigns/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          influencerIds,
          chatContext,
          estimatedReach,
          estimatedEngagementRate,
          budgetRange
        })
      })

      const data = await response.json()

      if (response.ok) {
        setRecommendations((prev: CampaignRecommendation[]) => [data.recommendation, ...prev])
        return data.recommendation
      } else {
        setError(data.error || 'Failed to create campaign recommendation')
        return null
      }
    } catch (err) {
      setError('Failed to create campaign recommendation')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getRecommendations = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/campaigns/recommendations?sessionId=${sessionId}`)
      const data = await response.json()

      if (response.ok) {
        setRecommendations(data.recommendations)
      } else {
        setError(data.error || 'Failed to get campaign recommendations')
      }
    } catch (err) {
      setError('Failed to get campaign recommendations')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearRecommendations = useCallback(() => {
    setRecommendations([])
    setError(null)
  }, [])

  return {
    recommendations,
    isLoading,
    error,
    createRecommendation,
    getRecommendations,
    clearRecommendations
  }
} 