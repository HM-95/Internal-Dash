// AI System Types
export interface ChatSession {
  id: string
  user_id: string
  title: string
  subtitle: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  chat_session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface AISystemPrompt {
  id: string
  name: string
  description: string
  prompt_template: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ChatSessionSettings {
  id: string
  chat_session_id: string
  system_prompt_id?: string
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ChatHistoryItem {
  id: string
  title: string
  lastMessage: string
  lastUpdated: string
  messageCount: number
}

export interface InfluencerSearchFilters {
  platform?: string
  primary_niche?: string
  min_followers?: number
  max_followers?: number
  min_engagement_rate?: number
  location?: string
  hashtags?: string[]
}

export interface InfluencerStats {
  total: number
  platforms: string[]
  niches: string[]
  avgEngagement: number
  avgFollowers: number
  avgViews: number
  totalViews: number
  topPlatform: string
  topNiche: string
}

export interface GeminiResponse {
  content: string
  error?: string
}

export interface StreamingChatResponse {
  message: string
  sessionId: string
  messageId?: string
  relevantCreators?: any[]
} 