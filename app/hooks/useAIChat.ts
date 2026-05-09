import { useState, useEffect, useCallback, useRef } from 'react'
import { generateSimpleQuery, CreatorQuery } from '@/lib/ai/queryGenerator'
import { createClient } from '@supabase/supabase-js'
import { useCreatorState } from '@/store/useCreatorState'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
}

interface CreatorRecommendation {
  id: string
  creator_id: number
  handle: string
  display_name: string
  bio: string
  primary_niche: string
  secondary_niche: string
  followers_count: number
  average_views: number
  engagement_rate: number
  buzz_score: number
  hashtags: string[]
  location: string
  location_region: string
  platform: string
  brand_tags: string
  bio_links: string
  email: string
  past_ad_placements: string[]
  profile_image_url: string | null
  semantic_score: number
  metadata_score: number
  final_score: number
}

interface ChatSession {
  id: string
  title: string
  lastMessage: string
  lastUpdated: string
  messageCount: number
}

interface CreatorResult {
  prompt: string
  promptHash: string
  creators: CreatorRecommendation[]
  totalCount: number
  timestamp: string
  aiResponse: string
}

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Generate SHA256 hash for prompt
const generatePromptHash = async (prompt: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(prompt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

interface UseAIChatOptions {
  listId?: string;
  listName?: string;
}

export const useAIChat = (options: UseAIChatOptions = {}) => {
  const { listId, listName } = options;
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState(false)
  const [creatorResults, setCreatorResults] = useState<CreatorResult[]>([])
  const [isLoadingCreators, setIsLoadingCreators] = useState(false)
  const inFlightPromptHashesRef = useRef<Set<string>>(new Set())
  
  // Get Zustand store functions
  const { collapsePreviousLists } = useCreatorState()

  // Initialize session with proper UUID
  useEffect(() => {
    if (!sessionId) {
      setSessionId(generateUUID())
    }
  }, [sessionId])

  // Load chat history from server-side API
  const loadChatHistory = useCallback(async () => {
      try {
      console.log('Loading chat history from server API...')
      
      const response = await fetch('/api/chat-history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error('Failed to load chat history:', response.status)
          return
        }

      const data = await response.json()
      
      if (data.chatHistory) {
        console.log('Chat history loaded successfully:', data.chatHistory.length, 'sessions')
        setChatHistory(data.chatHistory)
      }
      } catch (error) {
        console.error('Error loading chat history:', error)
      }
  }, [])

  // Load chat history when component mounts
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true)
      loadChatHistory()
    }
  }, [isInitialized, loadChatHistory])

  // Smart detection: Should we fetch creator recommendations for this prompt?
  const shouldFetchCreators = useCallback((prompt: string): boolean => {
    const lowerPrompt = prompt.toLowerCase().trim()
    
    // Clear intent to find/get/show creators
    const creatorKeywords = [
      'find', 'show', 'get', 'suggest', 'recommend', 'looking for', 'need', 'want',
      'influencer', 'creator', 'creators', 'influencers', 'people', 'users', 'accounts'
    ]
    
    // Niches and demographics that indicate creator search
    const nicheKeywords = [
      'beauty', 'fashion', 'fitness', 'food', 'travel', 'tech', 'gaming', 'lifestyle',
      'crypto', 'finance', 'music', 'art', 'sports', 'business', 'wellness', 'parenting'
    ]
    
    // Platform and location indicators
    const platformKeywords = ['instagram', 'tiktok', 'youtube', 'twitter', 'x']
    const locationKeywords = ['in', 'from', 'based', 'located', 'miami', 'new york', 'la', 'california']
    
    // General question indicators (should NOT fetch creators)
    const generalQuestionKeywords = [
      'what is', 'how do', 'how to', 'why', 'when', 'where can i', 'how much',
      'what are', 'tell me about', 'explain', 'difference between', 'best practices',
      'tips', 'strategy', 'trend', 'industry', 'market'
    ]
    
    // Check for general questions first (override creator search)
    const isGeneralQuestion = generalQuestionKeywords.some(keyword => 
      lowerPrompt.includes(keyword)
    )
    
    if (isGeneralQuestion) {
      return false
    }
    
    // Check for creator search intent
    const hasCreatorIntent = creatorKeywords.some(keyword => lowerPrompt.includes(keyword))
    const hasNicheContext = nicheKeywords.some(keyword => lowerPrompt.includes(keyword))
    const hasPlatformContext = platformKeywords.some(keyword => lowerPrompt.includes(keyword))
    const hasLocationContext = locationKeywords.some(keyword => lowerPrompt.includes(keyword))
    
    // Strong indicators for creator search
    if (hasCreatorIntent && (hasNicheContext || hasPlatformContext || hasLocationContext)) {
      return true
    }
    
    // Direct creator mentions
    if (lowerPrompt.includes('influencer') || lowerPrompt.includes('creator')) {
      return true
    }
    
    // Follower count or metrics mentioned (likely looking for creators)
    if (lowerPrompt.includes('followers') || lowerPrompt.includes('engagement') || lowerPrompt.includes('views')) {
      return true
    }
    
    // Default to not fetching creators for ambiguous prompts
    return false
  }, [])

  // Fetch creator recommendations with smart limits
  const fetchCreatorRecommendations = useCallback(async (prompt: string, limit: number = 50): Promise<CreatorRecommendation[]> => {
    try {
      console.log('Fetching creator recommendations for prompt:', prompt, 'with limit:', limit)
      
      // Generate query using simple keyword-based extraction
      const query = generateSimpleQuery(prompt)
      // Set smart limit - default to 5 for initial load
      query.limit = limit
      console.log('Generated query:', query)

      // Call the recommendation API
      const response = await fetch('/api/creator-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query)
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch recommendations')
      }

      console.log('Creator recommendations fetched:', data.data.length, 'creators')
      return data.data || []

    } catch (error) {
      console.error('Error fetching creator recommendations:', error)
      return []
    }
  }, [])

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return

    // Compute prompt hash up front and prevent duplicates
    const promptHash = await generatePromptHash(message)
    if (inFlightPromptHashesRef.current.has(promptHash)) {
      console.log('Duplicate prompt in-flight, skipping')
      return
    }
    if (creatorResults.some(r => r.promptHash === promptHash)) {
      console.log('Duplicate prompt detected (already have results), skipping')
      return
    }
    if (messages.some(m => m.content === `CREATOR_RESULTS:${promptHash}`)) {
      console.log('Duplicate prompt marker already exists, skipping')
      return
    }
    inFlightPromptHashesRef.current.add(promptHash)

    const userMessage: Message = {
      id: generateUUID(),
      content: message,
      role: 'user',
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setStreamingMessage('')

    try {
      // Only send sessionId if we have a real session from the API
      const requestBody: any = { message }
      if (currentSessionId) {
        requestBody.sessionId = currentSessionId
      }
      
      // Add list context if available
      if (listId && listName) {
        requestBody.listId = listId
        requestBody.listName = listName
      }

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      // Check if the response includes a new session ID
      const sessionIdHeader = response.headers.get('X-Session-ID')
      if (sessionIdHeader && !currentSessionId) {
        setCurrentSessionId(sessionIdHeader)
        console.log('New session created with ID:', sessionIdHeader)
      }
      // Use a stable session id for downstream saves in this call to avoid race with async state update
      const effectiveSessionId = sessionIdHeader || currentSessionId

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      let accumulatedText = ''
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        accumulatedText += chunk
        setStreamingMessage(accumulatedText)
      }

      const assistantMessage: Message = {
        id: generateUUID(),
        content: accumulatedText,
        role: 'assistant',
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])
      setStreamingMessage('')

      // Only fetch creator recommendations if the prompt indicates user wants creators
      const shouldFetch = shouldFetchCreators(message)
      console.log('Should fetch creators for prompt "' + message + '":', shouldFetch)
      
      if (shouldFetch) {
        setIsLoadingCreators(true)
        try {
          const creators = await fetchCreatorRecommendations(message)
          
          if (creators.length > 0) {
          const creatorResult: CreatorResult = {
            prompt: message,
            promptHash,
            creators,
            totalCount: creators.length,
            timestamp: new Date().toISOString(),
            aiResponse: accumulatedText
          }
          
          // Save creator results to database (use effectiveSessionId to avoid stale state)
          try {
            const saveResponse = await fetch('/api/chat-creator-results', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sessionId: effectiveSessionId,
                promptHash,
                prompt: message,
                creatorsData: creators,
                totalCount: creators.length
              })
            })
            
            if (!saveResponse.ok) {
              console.error('Failed to save creator results:', saveResponse.status)
            }
          } catch (error) {
            console.error('Error saving creator results:', error)
          }
          
          // Add new result and collapse previous lists
          setCreatorResults(prev => [...prev, creatorResult])
          
          // Collapse all previous expanded rows, keeping only the new prompt hash
          collapsePreviousLists(promptHash)
          
          // Ensure the new list starts expanded
          setTimeout(() => {
            // This will be handled by the Zustand store to expand the new list
            // and collapse all others
          }, 100)
          
          // Add a special message to mark where the creator results should appear
          const creatorMessage: Message = {
            id: generateUUID(),
            content: `CREATOR_RESULTS:${promptHash}`, // Special marker
            role: 'assistant',
            timestamp: new Date().toISOString()
          }
          
          setMessages(prev => [...prev, creatorMessage])
          }
        } catch (error) {
          console.error('Error fetching creators:', error)
        } finally {
          setIsLoadingCreators(false)
        }
      } else {
        console.log('Skipping creator recommendations for general question')
      }
      
      // Clean up in-flight tracking
      inFlightPromptHashesRef.current.delete(promptHash)

      // Don't automatically refresh chat history to prevent duplication
      // loadChatHistory()

    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: generateUUID(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
      setStreamingMessage('')
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, currentSessionId, loadChatHistory, fetchCreatorRecommendations, collapsePreviousLists, creatorResults, messages])

  const clearMessages = useCallback(() => {
    setMessages([])
    setCreatorResults([])
    setSessionId(generateUUID())
    setCurrentSessionId('')
    setStreamingMessage('')
  }, [])

  const removeChat = useCallback(async (chatId: string) => {
    try {
      console.log('Deleting chat session:', chatId)
      
      const response = await fetch('/api/chat-history/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId })
      })

      if (!response.ok) {
        console.error('Failed to delete chat session:', response.status)
        return
      }

      const data = await response.json()
      
      if (data.success) {
        console.log('Chat session deleted successfully:', chatId)
        // Remove from local state
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId))
      }
    } catch (error) {
      console.error('Error removing chat:', error)
    }
  }, [])

  const clearHistory = useCallback(async () => {
    try {
      console.log('Clearing all chat history...')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('No user found for clearing history')
        return
      }

      const response = await fetch('/api/chat-history/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id })
      })

      if (response.ok) {
        console.log('Chat history cleared successfully')
        // Clear local state
        setMessages([])
        setCreatorResults([])
        setCurrentSessionId('')
        // Refresh chat history to update the UI
        await loadChatHistory()
      } else {
        console.error('Failed to clear chat history:', response.status)
      }
    } catch (error) {
      console.error('Error clearing chat history:', error)
    }
  }, [])

  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return diffInMinutes === 0 ? 'Just now' : `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }, [])

  const loadChatSession = useCallback(async (chatId: string) => {
    try {
      console.log('Loading chat session from server API:', chatId)
      
      const response = await fetch('/api/chat-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: chatId })
      })

      if (!response.ok) {
        console.error('Failed to load chat session:', response.status)
        return
      }

      const data = await response.json()
      
      if (data.session && data.messages) {
        // Set the current session ID and messages immediately
        setCurrentSessionId(data.session.id)
        setMessages(data.messages)
        
        // Fetch creator results for this session
        try {
          const creatorResponse = await fetch(`/api/chat-creator-results?sessionId=${data.session.id}`)
          if (creatorResponse.ok) {
            const creatorData = await creatorResponse.json()
            if (creatorData.success && creatorData.data) {
              // Convert database format back to CreatorResult format
              const restoredCreatorResults: CreatorResult[] = creatorData.data.map((item: any) => ({
                prompt: item.prompt,
                promptHash: item.prompt_hash,
                creators: item.creators_data,
                totalCount: item.total_count,
                timestamp: item.created_at,
                aiResponse: '' // This would need to be stored separately if needed
              }))
              
              setCreatorResults(restoredCreatorResults)
              console.log('Restored', restoredCreatorResults.length, 'creator results')
            }
          }
        } catch (error) {
          console.error('Error loading creator results:', error)
        }
        
        console.log('Chat session loaded successfully:', data.session.id, 'with', data.messages.length, 'messages')
      }
    } catch (error) {
      console.error('Error loading chat session:', error)
    }
  }, [])

  const refreshChatHistory = useCallback(async () => {
    console.log('Refreshing chat history...')
    await loadChatHistory()
  }, [loadChatHistory])

  return {
    messages,
    isLoading,
    streamingMessage,
    chatHistory,
    sendMessage,
    clearMessages,
    removeChat,
    clearHistory,
    creatorResults,
    isLoadingCreators,
    formatTimestamp,
    refreshChatHistory,
    loadChatSession
  }
} 