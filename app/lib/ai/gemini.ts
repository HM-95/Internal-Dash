import { GoogleGenerativeAI } from '@google/generative-ai'
import type { GeminiResponse } from './types'
import { SYSTEM_PROMPTS } from './prompts/system-prompts'
import { CONTEXT_TEMPLATES } from './prompts/context-templates'
import { RESPONSE_FORMATS } from './prompts/response-formats'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

// Interface for Gemini AI response generation options - includes listContext for list-specific searches
export interface GenerateAIResponseOptions {
  prompt: string
  systemPromptName?: string
  context?: {
    stats?: any
    creators?: any[]
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
    searchQuery?: string
    filters?: any
    listContext?: { listId: string; listName: string } | null
  }
  responseFormat?: 'default' | 'creator_list' | 'creator_detailed' | 'analytics_summary'
}

export async function generateAIResponse(options: GenerateAIResponseOptions): Promise<GeminiResponse> {
  try {
    const {
      prompt,
      systemPromptName = 'buzzberry_default',
      context = {},
      responseFormat = 'default'
    } = options

    // Get system prompt
    const systemPrompt = SYSTEM_PROMPTS[systemPromptName as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.BUZZBERRY_DEFAULT

    // Build full prompt with context
    let fullPrompt = systemPrompt.template + '\n\n'

    // Add database stats if available
    if (context.stats) {
      fullPrompt += CONTEXT_TEMPLATES.DATABASE_STATS(context.stats) + '\n\n'
    }

    // Add relevant creators if available
    if (context.creators && context.creators.length > 0) {
      fullPrompt += CONTEXT_TEMPLATES.RELEVANT_CREATORS(context.creators) + '\n\n'
    }

    // Add conversation history if available
    if (context.history && context.history.length > 0) {
      fullPrompt += CONTEXT_TEMPLATES.CONVERSATION_HISTORY(context.history) + '\n\n'
    }

    // Add search context if available
    if (context.searchQuery) {
      fullPrompt += CONTEXT_TEMPLATES.SEARCH_CONTEXT(context.searchQuery, context.filters || {}) + '\n\n'
    }

    // Add list context if searching within a specific list
    if (context.listContext) {
      fullPrompt += `IMPORTANT: You are searching within the user's specific list called "${context.listContext.listName}". All recommendations and responses should be limited to creators from this list only. The user has chosen to focus on this curated collection of creators.\n\n`
    }

    // Add user prompt
    fullPrompt += `User: ${prompt}\n\nAssistant:`

    // Generate response
    const result = await geminiModel.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()
    
    return { content: text }
  } catch (error) {
    console.error('Gemini API error:', error)
    return { 
      content: 'I apologize, but I encountered an error processing your request. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Helper to format influencer data for Gemini prompt
function formatInfluencerList(creators: any[], max = 5): string {
  if (!creators || creators.length === 0) return 'No influencer data available.';
  return creators.slice(0, max).map((inf, i) => {
    // Format hashtags
    const hashtags = Array.isArray(inf.hashtags) ? inf.hashtags.filter(Boolean).map((h: string) => `#${h}`).join(', ') : '';
    // Format recent post (show title or hashtags if available)
    let recentPost = '';
    if (inf.recent_post_1) {
      if (typeof inf.recent_post_1 === 'object') {
        if (inf.recent_post_1.caption) recentPost += `"${inf.recent_post_1.caption}"`;
        if (inf.recent_post_1.hashtags && Array.isArray(inf.recent_post_1.hashtags)) {
          recentPost += ` (hashtags: ${inf.recent_post_1.hashtags.map((h: string) => `#${h}`).join(', ')})`;
        }
      } else if (typeof inf.recent_post_1 === 'string') {
        recentPost += inf.recent_post_1;
      }
    }
    return (
      `${i + 1}. @${inf.handle}${inf.display_name ? ` (${inf.display_name})` : ''} [${inf.platform || 'N/A'}]\n` +
      `   Location: ${inf.location_region || inf.location || 'N/A'}\n` +
      `   Niche: ${inf.primary_niche || ''}${inf.secondary_niche ? ` / ${inf.secondary_niche}` : ''}\n` +
      `   Followers: ${inf.followers_count?.toLocaleString?.() || inf.followers_count || 'N/A'} | Engagement: ${inf.engagement_rate ? (inf.engagement_rate * 100).toFixed(2) + '%' : 'N/A'}\n` +
      (hashtags ? `   Top Hashtags: ${hashtags}\n` : '') +
      (inf.bio ? `   Bio: ${inf.bio.slice(0, 120)}${inf.bio.length > 120 ? '...' : ''}\n` : '') +
      (typeof inf.buzz_score !== 'undefined' ? `   Buzz Score: ${inf.buzz_score}\n` : '') +
      (recentPost ? `   Recent Post: ${recentPost}\n` : '')
    );
  }).join('\n\n');
}

// Streaming Gemini response (NEW)
export async function* generateAIResponseStream(options: GenerateAIResponseOptions): AsyncGenerator<string, void, unknown> {
  const {
    prompt,
    systemPromptName = 'buzzberry_default',
    context = {},
    responseFormat = 'default'
  } = options

  // Get system prompt
  const systemPrompt = SYSTEM_PROMPTS[systemPromptName as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.BUZZBERRY_DEFAULT

  // Build full prompt with context
  let fullPrompt = systemPrompt.template + '\n\n'
  if (context.stats) {
    fullPrompt += CONTEXT_TEMPLATES.DATABASE_STATS(context.stats) + '\n\n'
  }
  if (context.creators && context.creators.length > 0) {
    fullPrompt += 'Influencer Recommendations (Top Results):\n' + formatInfluencerList(context.creators, 5) + '\n\n';
  }
  if (context.history && context.history.length > 0) {
    fullPrompt += CONTEXT_TEMPLATES.CONVERSATION_HISTORY(context.history) + '\n\n'
  }
  if (context.searchQuery) {
    fullPrompt += CONTEXT_TEMPLATES.SEARCH_CONTEXT(context.searchQuery, context.filters || {}) + '\n\n'
  }
  if (context.listContext) {
    fullPrompt += `IMPORTANT: You are searching within the user's specific list called "${context.listContext.listName}". All recommendations and responses should be limited to creators from this list only. The user has chosen to focus on this curated collection of creators.\n\n`
  }
  fullPrompt += `User: ${prompt}\n\nAssistant:`

  // Use Gemini streaming API
  const stream = await geminiModel.generateContentStream(fullPrompt)
  for await (const chunk of stream.stream) {
    if (chunk.text) {
      yield typeof chunk.text === 'function' ? chunk.text() : chunk.text
    }
  }
}

// Specialized function for influencer analysis
export async function generateInfluencerAnalysis(
  influencers: any[],
  userQuery: string,
  context?: any
): Promise<GeminiResponse> {
  try {
    const influencerData = influencers.map(inf => `
Creator: ${inf.display_name} (@${inf.handle})
- Platform: ${inf.platform}
- Followers: ${inf.followers_count.toLocaleString()}
- Engagement Rate: ${inf.engagement_rate.toFixed(2)}%
- Primary Niche: ${inf.primary_niche}
- Location: ${inf.location || 'N/A'}
- Buzz Score: ${inf.buzz_score}
- Bio: ${inf.bio || 'N/A'}
- Recent Performance: ${inf.followers_change > 0 ? '+' : ''}${inf.followers_change} followers, ${inf.engagement_rate_change > 0 ? '+' : ''}${inf.engagement_rate_change}% engagement change
`).join('\n')

    const fullPrompt = `${SYSTEM_PROMPTS.BUZZBERRY_ANALYST.template}

CREATOR DATA:
${influencerData}

USER QUERY: ${userQuery}

Please provide a detailed analysis including:
1. Relevance to the query
2. Key strengths and opportunities
3. Potential campaign fit
4. Estimated reach and engagement potential
5. Budget recommendations
6. Any concerns or considerations

Be specific, data-driven, and actionable in your response.`

    const result = await geminiModel.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()
    
    return { content: text }
  } catch (error) {
    console.error('Gemini influencer analysis error:', error)
    return { 
      content: 'I apologize, but I encountered an error analyzing the creators. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Helper function to format responses
export function formatResponse(format: string, data: any): string {
  switch (format) {
    case 'creator_list':
      return RESPONSE_FORMATS.CREATOR_LIST(data)
    case 'creator_detailed':
      return RESPONSE_FORMATS.CREATOR_DETAILED(data)
    case 'analytics_summary':
      return RESPONSE_FORMATS.ANALYTICS_SUMMARY(data.stats, data.creators)
    case 'error':
      return RESPONSE_FORMATS.ERROR_RESPONSE(data)
    default:
      return data
  }
} 