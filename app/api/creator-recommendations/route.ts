import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { embedText } from '@/lib/ai/embeddings'
import OpenAI from 'openai'

// Available options for filtering
const AVAILABLE_PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Twitter', 'Facebook', 'LinkedIn', 'Twitch', 'Snapchat', 'Pinterest']
const AVAILABLE_LOCATIONS = ['Global', 'United States', 'Europe', 'Asia', 'Africa', 'Australia', 'South America', 'North America']
const AVAILABLE_NICHES = [
  'Crypto', 'Finance', 'Technology', 'Lifestyle', 'Fashion', 'Beauty', 'Fitness', 'Food', 'Travel', 'Education',
  'Entertainment', 'Gaming', 'Business', 'Marketing', 'Health', 'Parenting', 'DIY', 'Art', 'Music', 'Sports',
  'Comedy', 'News', 'Politics', 'Science', 'Environment', 'Automotive', 'Real Estate', 'Pets', 'Books', 'Movies'
]

// Types
interface CreatorQuery {
  prompt: string
  filters?: {
    platform?: string[]
    location?: string[]
    location_region?: string[]
    primary_niche?: string[]
    secondary_niche?: string[]
    primary_wellness_niche?: string[]
    secondary_wellness_niche?: string[]
    wellness_specialties?: string[]
    health_credentials?: string[]
    service_types?: string[]
    min_followers?: number
    max_followers?: number
    min_engagement_rate?: number
    max_engagement_rate?: number
    min_buzz_score?: number
    past_ad_placements?: string[]
    brand_tags?: string[]
    email_required?: boolean
  }
  limit?: number
  sort_by?: 'buzz_score' | 'engagement_rate' | 'followers_count' | 'semantic_score'
  sort_order?: 'asc' | 'desc'
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
  semantic_score: number
  metadata_score: number
  final_score: number
}

// Configuration
const DEFAULT_LIMIT = 20
const VECTOR_SIMILARITY_WEIGHT = 0.6
const METADATA_RELEVANCE_WEIGHT = 0.4
const SEMANTIC_SIMILARITY_THRESHOLD = 0.3

/**
 * Extract filters from user prompt using GPT (server-side only)
 */
async function extractFiltersFromPrompt(prompt: string, openai: OpenAI): Promise<CreatorQuery> {
  try {
    const systemPrompt = `You are an expert at analyzing user requests for creator recommendations and extracting comprehensive filters to find the most relevant influencers.

IMPORTANT: Be expansive and creative in your interpretation to help find all relevant creators in our database.

Available platforms: ${AVAILABLE_PLATFORMS.join(', ')}
Available locations: ${AVAILABLE_LOCATIONS.join(', ')}  
Available niches: ${AVAILABLE_NICHES.join(', ')}

Guidelines for filter extraction:
- Be inclusive with niches (if they ask for "food", also consider "lifestyle")
- Expand locations (if they say "Miami", include "United States" and "North America") 
- Interpret engagement terms ("high engagement" = min 3%, "excellent" = min 5%)
- Follower ranges: "micro" = 10K-100K, "mid-tier" = 100K-1M, "macro" = 1M+
- Brand adjacency: consider related industries (beauty → lifestyle → fashion)

Extract filters from the user's prompt and return a JSON object:
{
  "filters": {
    "platform": ["expand to all relevant platforms"],
    "location": ["include broader geographic areas"],
    "location_region": ["specific regions/countries/cities"],
    "primary_niche": ["primary content categories"],
    "secondary_niche": ["related/adjacent content areas"],
    "min_followers": number or null,
    "max_followers": number or null,
    "min_engagement_rate": number (as decimal: 3% = 0.03),
    "max_engagement_rate": number or null,
    "min_buzz_score": number (1-100 scale),
    "past_ad_placements": ["brand names for experience"],
    "brand_tags": ["industry categories"],
    "email_required": boolean
  },
  "sort_by": "semantic_score" | "buzz_score" | "engagement_rate" | "followers_count",
  "sort_order": "desc" | "asc",
  "limit": number (default 5, max 20)
}

Guidelines:
- Only include filters that are explicitly mentioned or strongly implied
- For followers, look for terms like "large following", "micro-influencer", "macro-influencer", specific numbers
- For engagement, look for terms like "high engagement", "active audience", specific percentages
- For email requirement, look for terms like "email", "contact", "reach out", "DM"
- For brand tags, look for terms like "luxury", "budget", "sustainable", "tech", "fashion", etc.
- Default sort_by to "semantic_score" and sort_order to "desc" unless specified otherwise
- Default limit to 10 unless specified otherwise
- If no specific filters are found, return empty filters object

Examples:
- "Find crypto creators on TikTok" → {"filters": {"platform": ["TikTok"], "primary_niche": ["Crypto"]}}
- "Show me fashion influencers with over 100k followers" → {"filters": {"primary_niche": ["Fashion"], "min_followers": 100000}}
- "Find tech creators in Europe with email" → {"filters": {"primary_niche": ["Technology"], "location": ["Europe"], "email_required": true}}
- "Crypto influencers with 40K to 60K followers and >5% engagement" → {"filters": {"primary_niche": ["Crypto"], "min_followers": 40000, "max_followers": 60000, "min_engagement_rate": 5.0}}

Return only the JSON object, no additional text.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 1000
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from GPT')
    }

    // Parse the JSON response
    const extractedData = JSON.parse(content.trim())
    
    // Validate and clean the extracted data
    const query: CreatorQuery = {
      prompt,
      filters: extractedData.filters || {},
      sort_by: extractedData.sort_by || 'semantic_score',
      sort_order: extractedData.sort_order || 'desc',
      limit: extractedData.limit || 10
    }

    // Clean up filters - remove null/undefined values and validate arrays
    if (query.filters) {
      Object.keys(query.filters).forEach(key => {
        const value = query.filters![key as keyof typeof query.filters]
        if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
          delete query.filters![key as keyof typeof query.filters]
        }
      })
    }

    // If no filters were extracted, remove the filters object entirely
    if (query.filters && Object.keys(query.filters).length === 0) {
      delete query.filters
    }

    return query

  } catch (error) {
    console.error('Error extracting filters from prompt:', error)
    
    // Fallback: return basic query without filters
    return {
      prompt,
      sort_by: 'semantic_score',
      sort_order: 'desc',
      limit: 10
    }
  }
}

/**
 * Generate query embedding for semantic search
 */
async function generateQueryEmbedding(prompt: string): Promise<number[]> {
  try {
    return await embedText(prompt)
  } catch (error) {
    console.error('Error generating query embedding:', error)
    return new Array(1536).fill(0) // Return zero vector on error
  }
}

/**
 * Build SQL filters from query parameters
 */
function buildFilters(filters?: CreatorQuery['filters']): { sql: string; params: any[] } {
  if (!filters) return { sql: '', params: [] }

  const conditions: string[] = []
  const params: any[] = []
  let paramIndex = 1

  // Platform filter
  if (filters.platform && filters.platform.length > 0) {
    conditions.push(`platform = ANY($${paramIndex})`)
    params.push(filters.platform)
    paramIndex++
  }

  // Location filter
  if (filters.location && filters.location.length > 0) {
    conditions.push(`location = ANY($${paramIndex})`)
    params.push(filters.location)
    paramIndex++
  }

  // Location region filter
  if (filters.location_region && filters.location_region.length > 0) {
    conditions.push(`location_region = ANY($${paramIndex})`)
    params.push(filters.location_region)
    paramIndex++
  }

  // Secondary wellness niche filter
  if (filters.primary_niche && filters.primary_niche.length > 0) {
    conditions.push(`secondary_wellness_niche = ANY($${paramIndex})`)
    params.push(filters.primary_niche)
    paramIndex++
  }

  // Secondary niche filter
  if (filters.secondary_niche && filters.secondary_niche.length > 0) {
    conditions.push(`secondary_niche = ANY($${paramIndex})`)
    params.push(filters.secondary_niche)
    paramIndex++
  }

  // Followers range
  if (filters.min_followers !== undefined) {
    conditions.push(`followers_count >= $${paramIndex}`)
    params.push(filters.min_followers)
    paramIndex++
  }
  if (filters.max_followers !== undefined) {
    conditions.push(`followers_count <= $${paramIndex}`)
    params.push(filters.max_followers)
    paramIndex++
  }

  // Engagement rate range
  if (filters.min_engagement_rate !== undefined) {
    conditions.push(`engagement_rate >= $${paramIndex}`)
    params.push(filters.min_engagement_rate)
    paramIndex++
  }
  if (filters.max_engagement_rate !== undefined) {
    conditions.push(`engagement_rate <= $${paramIndex}`)
    params.push(filters.max_engagement_rate)
    paramIndex++
  }

  // Buzz score minimum
  if (filters.min_buzz_score !== undefined) {
    conditions.push(`buzz_score >= $${paramIndex}`)
    params.push(filters.min_buzz_score)
    paramIndex++
  }

  // Email requirement
  if (filters.email_required) {
    conditions.push(`email IS NOT NULL AND email != ''`)
  }

  // Brand tags filter (using GIN index)
  if (filters.brand_tags && filters.brand_tags.length > 0) {
    conditions.push(`brand_tags ILIKE ANY($${paramIndex})`)
    params.push(filters.brand_tags.map(tag => `%${tag}%`))
    paramIndex++
  }

  // Past ad placements filter (using GIN index)
  if (filters.past_ad_placements && filters.past_ad_placements.length > 0) {
    conditions.push(`past_ad_placements && $${paramIndex}`)
    params.push(filters.past_ad_placements)
    paramIndex++
  }

  const sql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  return { sql, params }
}

/**
 * Calculate metadata relevance score
 */
function calculateMetadataScore(creator: any, filters?: CreatorQuery['filters']): number {
  if (!filters) return 1.0

  let score = 0
  let totalFactors = 0

  // Platform match
  if (filters.platform && filters.platform.length > 0) {
    if (filters.platform.includes(creator.platform)) {
      score += 1
    }
    totalFactors++
  }

  // Location match
  if (filters.location && filters.location.length > 0) {
    if (filters.location.includes(creator.location)) {
      score += 1
    }
    totalFactors++
  }

  // Location region match
  if (filters.location_region && filters.location_region.length > 0) {
    if (filters.location_region.includes(creator.location_region)) {
      score += 1
    }
    totalFactors++
  }

  // Secondary wellness niche match
  if (filters.primary_niche && filters.primary_niche.length > 0) {
    if (filters.primary_niche.includes(creator.secondary_wellness_niche)) {
      score += 1
    }
    totalFactors++
  }

  // Secondary niche match
  if (filters.secondary_niche && filters.secondary_niche.length > 0) {
    if (filters.secondary_niche.includes(creator.secondary_niche)) {
      score += 1
    }
    totalFactors++
  }

  // Email availability bonus
  if (filters.email_required && creator.email) {
    score += 0.5
    totalFactors += 0.5
  }

  // Brand tags match
  if (filters.brand_tags && filters.brand_tags.length > 0) {
    const creatorTags = creator.brand_tags?.toLowerCase() || ''
    const matches = filters.brand_tags.filter(tag => 
      creatorTags.includes(tag.toLowerCase())
    ).length
    score += matches / filters.brand_tags.length
    totalFactors++
  }

  // Past ad placements match
  if (filters.past_ad_placements && filters.past_ad_placements.length > 0) {
    const creatorPlacements = creator.past_ad_placements || []
    const matches = filters.past_ad_placements.filter(placement => 
      creatorPlacements.includes(placement)
    ).length
    score += matches / filters.past_ad_placements.length
    totalFactors++
  }

  return totalFactors > 0 ? score / totalFactors : 1.0
}

/**
 * Main recommendation function
 */
async function getCreatorRecommendations(query: CreatorQuery, openai: OpenAI, supabase: any): Promise<CreatorRecommendation[]> {
  const {
    prompt,
    filters,
    limit = DEFAULT_LIMIT,
    sort_by = 'semantic_score',
    sort_order = 'desc'
  } = query

  try {
    // If no filters provided, try AI-powered extraction
    let enhancedQuery = query
    if (!filters || Object.keys(filters).length === 0) {
      try {
        console.log('No filters provided, attempting AI-powered extraction...')
        enhancedQuery = await extractFiltersFromPrompt(prompt, openai)
        console.log('AI-enhanced query:', enhancedQuery)
      } catch (error) {
        console.warn('AI extraction failed, using original query:', error)
      }
    }

    // Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(prompt)
    
    // Try to get results with original filters
    let results = await executeCreatorQuery(enhancedQuery, queryEmbedding, limit, sort_by, sort_order, supabase)
    
    // If no results and we have numeric filters, try with loosened thresholds
    if (results.length === 0 && enhancedQuery.filters) {
      console.log('No results found, trying with loosened filters...')
      const loosenedQuery = loosenNumericFilters(enhancedQuery)
      results = await executeCreatorQuery(loosenedQuery, queryEmbedding, limit, sort_by, sort_order, supabase)
      
      if (results.length > 0) {
        console.log(`Found ${results.length} results with loosened filters`)
      }
    }

    // Final fallback: keyword search on location fields (handles prompts like "miami influencers")
    if (results.length === 0) {
      const tokens = extractLocationTokensFromPrompt(prompt)
      if (tokens.length > 0) {
        console.log('No results after semantic search, attempting keyword location fallback with tokens:', tokens)
        const { data: kwCreators, error: kwError } = await supabase
          .from('healthwellness')
          .select('*')
          .or(tokens.map(t => `location_region.ilike.%${t}%,location.ilike.%${t}%`).join(','))
          .limit(limit * 3)

        if (!kwError && kwCreators && kwCreators.length > 0) {
          // Score and sort like the main path
          const scoredCreators: CreatorRecommendation[] = kwCreators.map((creator: any) => {
            const recentContentSimilarity = creator.recent_content_embedding ? calculateCosineSimilarity(queryEmbedding, creator.recent_content_embedding) : 0
            const bioSimilarity = creator.bio_embedding ? calculateCosineSimilarity(queryEmbedding, creator.bio_embedding) : 0
            const hashtagsSimilarity = creator.hashtags_embedding ? calculateCosineSimilarity(queryEmbedding, creator.hashtags_embedding) : 0
            const semanticScore = (recentContentSimilarity * 0.4) + (bioSimilarity * 0.4) + (hashtagsSimilarity * 0.2)
            const metadataScore = calculateMetadataScore(creator, enhancedQuery.filters)
            const finalScore = (semanticScore * VECTOR_SIMILARITY_WEIGHT) + (metadataScore * METADATA_RELEVANCE_WEIGHT)
            return {
              id: creator.id,
              creator_id: creator.creator_id,
              handle: creator.handle,
              display_name: creator.display_name,
              bio: creator.bio,
              primary_niche: creator.primary_niche,
              secondary_niche: creator.secondary_niche,
              followers_count: creator.followers_count,
              average_views: creator.average_views,
              engagement_rate: creator.engagement_rate,
              buzz_score: creator.buzz_score,
              hashtags: creator.hashtags || [],
              location: creator.location,
              location_region: creator.location_region,
              platform: creator.platform,
              brand_tags: creator.brand_tags,
              bio_links: creator.bio_links,
              email: creator.email,
              past_ad_placements: creator.past_ad_placements || [],
              profile_image_url: creator.profile_image_url, // FIX: Include profile image in fallback search too
              semantic_score: semanticScore,
              metadata_score: metadataScore,
              final_score: finalScore
            }
          })
          scoredCreators.sort((a, b) => b.final_score - a.final_score)
          results = scoredCreators.slice(0, limit)
          console.log(`Keyword fallback found ${results.length} results`)
        }
      }
    }

    return results

  } catch (error) {
    console.error('Error in getCreatorRecommendations:', error)
    throw error
  }
}

/**
 * Execute the actual creator query with given filters
 */
async function executeCreatorQuery(
  query: CreatorQuery, 
  queryEmbedding: number[], 
  limit: number, 
  sort_by: string, 
  sort_order: string,
  supabase: any
): Promise<CreatorRecommendation[]> {
  
  // Build the main query using direct Supabase methods - use healthwellness table
  let supabaseQuery = supabase
    .from('healthwellness')
    .select('*')
    .limit(Math.max(1000, limit * 20)) // Search much broader database for highest quality matches

  // Apply basic filters first
  if (query.filters) {
    if (query.filters.platform?.length) {
      supabaseQuery = supabaseQuery.in('platform', query.filters.platform)
    }
    if (query.filters.location?.length) {
      supabaseQuery = supabaseQuery.in('location', query.filters.location)
    }
    if (query.filters.location_region?.length) {
      supabaseQuery = supabaseQuery.in('location_region', query.filters.location_region)
    }
    if (query.filters.primary_wellness_niche?.length) {
      supabaseQuery = supabaseQuery.in('primary_wellness_niche', query.filters.primary_wellness_niche)
    }
    if (query.filters.secondary_wellness_niche?.length) {
      supabaseQuery = supabaseQuery.in('secondary_wellness_niche', query.filters.secondary_wellness_niche)
    }
    if (query.filters.wellness_specialties?.length) {
      supabaseQuery = supabaseQuery.overlaps('wellness_specialties', query.filters.wellness_specialties)
    }
    if (query.filters.health_credentials?.length) {
      supabaseQuery = supabaseQuery.overlaps('health_credentials', query.filters.health_credentials)
    }
    if (query.filters.service_types?.length) {
      supabaseQuery = supabaseQuery.overlaps('service_types', query.filters.service_types)
    }
    if (query.filters.min_followers) {
      supabaseQuery = supabaseQuery.gte('followers_count', query.filters.min_followers)
    }
    if (query.filters.max_followers) {
      supabaseQuery = supabaseQuery.lte('followers_count', query.filters.max_followers)
    }
    if (query.filters.min_engagement_rate) {
      supabaseQuery = supabaseQuery.gte('engagement_rate', query.filters.min_engagement_rate)
    }
    if (query.filters.max_engagement_rate) {
      supabaseQuery = supabaseQuery.lte('engagement_rate', query.filters.max_engagement_rate)
    }
    if (query.filters.min_buzz_score) {
      supabaseQuery = supabaseQuery.gte('buzz_score', query.filters.min_buzz_score)
    }
    if (query.filters.email_required) {
      supabaseQuery = supabaseQuery.not('email', 'is', null)
    }
  }

  const { data: creators, error } = await supabaseQuery

  if (error) {
    console.error('Database query error:', error)
    throw new Error(`Database query failed: ${error.message}`)
  }

  if (!creators || creators.length === 0) {
    return []
  }

  // Apply additional filters in memory if needed
  let filteredCreators = creators
  if (query.filters) {
    filteredCreators = creators.filter((creator: any) => {
      if (query.filters?.platform?.length && !query.filters.platform.includes(creator.platform)) {
        return false
      }
      if (query.filters?.location?.length && !query.filters.location.includes(creator.location)) {
        return false
      }
      if (query.filters?.location_region?.length && !query.filters.location_region.includes(creator.location_region)) {
        return false
      }
      if (query.filters?.primary_niche?.length && !query.filters.primary_niche.includes(creator.secondary_wellness_niche)) {
        return false
      }
      if (query.filters?.min_followers && creator.followers_count < query.filters.min_followers) {
        return false
      }
      if (query.filters?.max_followers && creator.followers_count > query.filters.max_followers) {
        return false
      }
      if (query.filters?.min_engagement_rate && creator.engagement_rate < query.filters.min_engagement_rate) {
        return false
      }
      if (query.filters?.max_engagement_rate && creator.engagement_rate > query.filters.max_engagement_rate) {
        return false
      }
      if (query.filters?.min_buzz_score && creator.buzz_score < query.filters.min_buzz_score) {
        return false
      }
      if (query.filters?.email_required && !creator.email) {
        return false
      }
      return true
    })
  }

  // Calculate final scores and sort
  const scoredCreators: CreatorRecommendation[] = filteredCreators.map((creator: any) => {
    // Calculate semantic similarity scores
    const recentContentSimilarity = creator.recent_content_embedding ? calculateCosineSimilarity(queryEmbedding, creator.recent_content_embedding) : 0
    const bioSimilarity = creator.bio_embedding ? calculateCosineSimilarity(queryEmbedding, creator.bio_embedding) : 0
    const hashtagsSimilarity = creator.hashtags_embedding ? calculateCosineSimilarity(queryEmbedding, creator.hashtags_embedding) : 0
    
    // Weighted semantic score (balanced approach for better discovery)
    const semanticScore = (recentContentSimilarity * 0.4) + (bioSimilarity * 0.4) + (hashtagsSimilarity * 0.2)
    
    // Calculate metadata relevance score
    const metadataScore = calculateMetadataScore(creator, query.filters)
    
    // Final weighted score
    const finalScore = (semanticScore * VECTOR_SIMILARITY_WEIGHT) + 
                      (metadataScore * METADATA_RELEVANCE_WEIGHT)

    return {
      id: creator.id,
      creator_id: creator.creator_id,
      handle: creator.handle,
      display_name: creator.display_name,
      bio: creator.bio,
      primary_niche: creator.primary_niche,
      secondary_niche: creator.secondary_niche,
      followers_count: creator.followers_count,
      average_views: creator.average_views,
      engagement_rate: creator.engagement_rate,
      buzz_score: creator.buzz_score,
      hashtags: creator.hashtags || [],
      location: creator.location,
      location_region: creator.location_region,
      platform: creator.platform,
      brand_tags: creator.brand_tags,
      bio_links: creator.bio_links,
      email: creator.email,
      past_ad_placements: creator.past_ad_placements || [],
      profile_image_url: creator.profile_image_url, // FIX: Include profile image in response
      semantic_score: semanticScore,
      metadata_score: metadataScore,
      final_score: finalScore
    }
  })

  // Sort by the requested field
  const sortField = sort_by === 'semantic_score' ? 'final_score' : sort_by
  scoredCreators.sort((a, b) => {
    const aValue = a[sortField as keyof CreatorRecommendation] as number
    const bValue = b[sortField as keyof CreatorRecommendation] as number
    return sort_order === 'desc' ? bValue - aValue : aValue - bValue
  })

  // Return top results
  return scoredCreators.slice(0, limit)
}

/**
 * Loosen numeric filters by ±10% for fallback search
 */
function loosenNumericFilters(query: CreatorQuery): CreatorQuery {
  const loosenedQuery = { ...query }
  
  if (loosenedQuery.filters) {
    // Loosen follower count filters
    if (loosenedQuery.filters.min_followers) {
      loosenedQuery.filters.min_followers = Math.floor(loosenedQuery.filters.min_followers * 0.9)
    }
    if (loosenedQuery.filters.max_followers) {
      loosenedQuery.filters.max_followers = Math.ceil(loosenedQuery.filters.max_followers * 1.1)
    }
    
    // Loosen engagement rate filters
    if (loosenedQuery.filters.min_engagement_rate) {
      loosenedQuery.filters.min_engagement_rate = Math.max(0, loosenedQuery.filters.min_engagement_rate - 0.5)
    }
    if (loosenedQuery.filters.max_engagement_rate) {
      loosenedQuery.filters.max_engagement_rate = Math.min(100, loosenedQuery.filters.max_engagement_rate + 0.5)
    }
    
    // Loosen buzz score filters
    if (loosenedQuery.filters.min_buzz_score) {
      loosenedQuery.filters.min_buzz_score = Math.max(0, loosenedQuery.filters.min_buzz_score - 1)
    }
  }
  
  return loosenedQuery
}

/**
 * Calculate cosine similarity between two vectors
 */
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0
  }
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }
  
  if (normA === 0 || normB === 0) {
    return 0
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * GET handler for creator recommendations
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize OpenAI client inside the handler
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    // Initialize Supabase client inside the handler
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const prompt = searchParams.get('prompt') || ''
    const limit = parseInt(searchParams.get('limit') || DEFAULT_LIMIT.toString())
    const sort_by = searchParams.get('sort_by') as CreatorQuery['sort_by'] || 'semantic_score'
    const sort_order = searchParams.get('sort_order') as 'asc' | 'desc' || 'desc'
    
    // Parse filters
    const filters: CreatorQuery['filters'] = {}
    
    if (searchParams.get('platform')) {
      filters.platform = searchParams.get('platform')!.split(',')
    }
    if (searchParams.get('location')) {
      filters.location = searchParams.get('location')!.split(',')
    }
    if (searchParams.get('location_region')) {
      filters.location_region = searchParams.get('location_region')!.split(',')
    }
    if (searchParams.get('primary_niche')) {
      filters.primary_niche = searchParams.get('primary_niche')!.split(',')
    }
    if (searchParams.get('secondary_niche')) {
      filters.secondary_niche = searchParams.get('secondary_niche')!.split(',')
    }
    if (searchParams.get('min_followers')) {
      filters.min_followers = parseInt(searchParams.get('min_followers')!)
    }
    if (searchParams.get('max_followers')) {
      filters.max_followers = parseInt(searchParams.get('max_followers')!)
    }
    if (searchParams.get('min_engagement_rate')) {
      filters.min_engagement_rate = parseFloat(searchParams.get('min_engagement_rate')!)
    }
    if (searchParams.get('max_engagement_rate')) {
      filters.max_engagement_rate = parseFloat(searchParams.get('max_engagement_rate')!)
    }
    if (searchParams.get('min_buzz_score')) {
      filters.min_buzz_score = parseInt(searchParams.get('min_buzz_score')!)
    }
    if (searchParams.get('brand_tags')) {
      filters.brand_tags = searchParams.get('brand_tags')!.split(',')
    }
    if (searchParams.get('past_ad_placements')) {
      filters.past_ad_placements = searchParams.get('past_ad_placements')!.split(',')
    }
    if (searchParams.get('email_required')) {
      filters.email_required = searchParams.get('email_required') === 'true'
    }

    const query: CreatorQuery = {
      prompt,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      limit,
      sort_by,
      sort_order
    }

    const recommendations = await getCreatorRecommendations(query, openai, supabase)

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      query: {
        prompt,
        filters,
        limit,
        sort_by,
        sort_order
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get creator recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST handler for creator recommendations (for complex queries)
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize OpenAI client inside the handler
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    // Initialize Supabase client inside the handler
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const body: CreatorQuery = await request.json()
    
    if (!body.prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const recommendations = await getCreatorRecommendations(body, openai, supabase)

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      query: body
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get creator recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 

// Extract simple location tokens from a prompt (e.g., 'miami', 'london', 'new york')
function extractLocationTokensFromPrompt(prompt: string): string[] {
  const lowered = prompt.toLowerCase()
  // Remove obvious non-location words
  const blacklist = new Set(['find', 'me', 'influencer', 'influencers', 'creators', 'creator', 'in', 'the', 'and', 'of', 'with', 'for', 'on'])
  // Split on non-letters
  const rawTokens = lowered.split(/[^a-z]+/g).filter(Boolean)
  const tokens = rawTokens.filter(t => t.length > 2 && !blacklist.has(t))
  // Special-case multi-word cities
  const joined = lowered
  const multi: string[] = []
  if (joined.includes('new york')) multi.push('new york')
  if (joined.includes('los angeles')) multi.push('los angeles')
  if (joined.includes('san francisco')) multi.push('san francisco')
  if (joined.includes('miami')) multi.push('miami')
  const unique = Array.from(new Set([...tokens, ...multi]))
  return unique
} 