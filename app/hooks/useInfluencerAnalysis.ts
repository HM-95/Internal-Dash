import { useState, useCallback } from 'react'
import { Influencer } from '../types/database';

interface UseInfluencerAnalysisReturn {
  analysis: string
  isLoading: boolean
  error: string | null
  analyzeInfluencers: (influencerIds: string[], campaignGoals: string) => Promise<void>
  clearAnalysis: () => void
}

export function useInfluencerAnalysis(): UseInfluencerAnalysisReturn {
  const [analysis, setAnalysis] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeInfluencers = useCallback(async (influencerIds: string[], campaignGoals: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/influencers/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ influencerIds, campaignGoals })
      })

      const data = await response.json()

      if (response.ok) {
        setAnalysis(data.analysis)
      } else {
        setError(data.error || 'Failed to analyze influencers')
      }
    } catch (err) {
      setError('Failed to analyze influencers')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearAnalysis = useCallback(() => {
    setAnalysis('')
    setError(null)
  }, [])

  return {
    analysis,
    isLoading,
    error,
    analyzeInfluencers,
    clearAnalysis
  }
} 