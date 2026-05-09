// Types
export interface CreatorQuery {
  prompt: string
  filters?: {
    platform?: string[]
    location?: string[]
    location_region?: string[]
    primary_niche?: string[]
    secondary_niche?: string[]
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

// Available options for filtering
const AVAILABLE_PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Twitter', 'Facebook', 'LinkedIn', 'Twitch', 'Snapchat', 'Pinterest']
const AVAILABLE_LOCATIONS = ['Global', 'United States', 'Europe', 'Asia', 'Africa', 'Australia', 'South America', 'North America']
const AVAILABLE_NICHES = [
  'Crypto', 'Finance', 'Technology', 'Lifestyle', 'Fashion', 'Beauty', 'Fitness', 'Food', 'Travel', 'Education',
  'Entertainment', 'Gaming', 'Business', 'Marketing', 'Health', 'Parenting', 'DIY', 'Art', 'Music', 'Sports',
  'Comedy', 'News', 'Politics', 'Science', 'Environment', 'Automotive', 'Real Estate', 'Pets', 'Books', 'Movies'
]

/**
 * Generate a simple query without AI processing (for client-side use)
 */
export function generateSimpleQuery(prompt: string): CreatorQuery {
  const query: CreatorQuery = {
    prompt,
    sort_by: 'semantic_score',
    sort_order: 'desc',
    limit: 50  // Show all relevant matches, let pagination handle display
  }

  // Simple keyword-based filter extraction
  const lowerPrompt = prompt.toLowerCase()
  
  // Platform detection
  const platforms: string[] = []
  if (lowerPrompt.includes('tiktok')) platforms.push('TikTok')
  if (lowerPrompt.includes('instagram')) platforms.push('Instagram')
  if (lowerPrompt.includes('youtube')) platforms.push('YouTube')
  if (lowerPrompt.includes('twitter')) platforms.push('Twitter')
  if (lowerPrompt.includes('facebook')) platforms.push('Facebook')
  if (lowerPrompt.includes('linkedin')) platforms.push('LinkedIn')
  
  // Niche detection
  const niches: string[] = []
  if (lowerPrompt.includes('crypto') || lowerPrompt.includes('bitcoin') || lowerPrompt.includes('blockchain')) {
    niches.push('Crypto')
  }
  if (lowerPrompt.includes('finance') || lowerPrompt.includes('money') || lowerPrompt.includes('investment')) {
    niches.push('Finance')
  }
  if (lowerPrompt.includes('tech') || lowerPrompt.includes('technology')) {
    niches.push('Technology')
  }
  if (lowerPrompt.includes('fashion') || lowerPrompt.includes('style')) {
    niches.push('Fashion')
  }
  if (lowerPrompt.includes('fitness') || lowerPrompt.includes('workout')) {
    niches.push('Fitness')
  }
  if (lowerPrompt.includes('food') || lowerPrompt.includes('cooking')) {
    niches.push('Food')
  }
  if (lowerPrompt.includes('travel')) {
    niches.push('Travel')
  }
  if (lowerPrompt.includes('gaming') || lowerPrompt.includes('game')) {
    niches.push('Gaming')
  }
  if (lowerPrompt.includes('business') || lowerPrompt.includes('entrepreneur')) {
    niches.push('Business')
  }
  if (lowerPrompt.includes('lifestyle')) {
    niches.push('Lifestyle')
  }

  // Location detection
  const locations: string[] = []
  if (lowerPrompt.includes('europe') || lowerPrompt.includes('european')) {
    locations.push('Europe')
  }
  if (lowerPrompt.includes('asia') || lowerPrompt.includes('asian')) {
    locations.push('Asia')
  }
  if (lowerPrompt.includes('united states') || lowerPrompt.includes('us') || lowerPrompt.includes('usa')) {
    locations.push('United States')
  }
  if (lowerPrompt.includes('global') || lowerPrompt.includes('worldwide')) {
    locations.push('Global')
  }

  // Email requirement detection
  const emailRequired = lowerPrompt.includes('email') || lowerPrompt.includes('contact') || lowerPrompt.includes('reach out')

  // Follower count detection with ranges
  let minFollowers: number | undefined
  let maxFollowers: number | undefined
  
  // Patterns for follower ranges: "40k to 60k", "between 100k and 200k", "50k-100k"
  const followerRangePatterns = [
    /(\d+(?:\.\d+)?)\s*k\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*k/gi,
    /between\s+(\d+(?:\.\d+)?)\s*k\s+and\s+(\d+(?:\.\d+)?)\s*k/gi,
    /(\d+(?:\.\d+)?)\s*k\s*-\s*(\d+(?:\.\d+)?)\s*k/gi
  ]
  
  for (const pattern of followerRangePatterns) {
    const match = pattern.exec(lowerPrompt)
    if (match) {
      minFollowers = Math.floor(parseFloat(match[1]) * 1000)
      maxFollowers = Math.floor(parseFloat(match[2]) * 1000)
      break
    }
  }
  
  // Single follower thresholds: "over 100k", "more than 50k", "at least 200k"
  if (!minFollowers && !maxFollowers) {
    const overPattern = /(?:over|more than|at least|minimum|min)\s+(\d+(?:\.\d+)?)\s*k/gi
    const underPattern = /(?:under|less than|maximum|max)\s+(\d+(?:\.\d+)?)\s*k/gi
    
    const overMatch = overPattern.exec(lowerPrompt)
    const underMatch = underPattern.exec(lowerPrompt)
    
    if (overMatch) {
      minFollowers = Math.floor(parseFloat(overMatch[1]) * 1000)
    }
    if (underMatch) {
      maxFollowers = Math.floor(parseFloat(underMatch[1]) * 1000)
    }
  }

  // Engagement rate detection
  let minEngagement: number | undefined
  let maxEngagement: number | undefined
  
  // Patterns for engagement ranges: "5% to 10%", "between 3% and 8%"
  const engagementRangePatterns = [
    /(\d+(?:\.\d+)?)\s*%\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*%/gi,
    /between\s+(\d+(?:\.\d+)?)\s*%\s+and\s+(\d+(?:\.\d+)?)\s*%/gi
  ]
  
  for (const pattern of engagementRangePatterns) {
    const match = pattern.exec(lowerPrompt)
    if (match) {
      minEngagement = parseFloat(match[1])
      maxEngagement = parseFloat(match[2])
      break
    }
  }
  
  // Single engagement thresholds: "over 5%", "more than 3%"
  if (!minEngagement && !maxEngagement) {
    const overPattern = /(?:over|more than|at least|minimum|min)\s+(\d+(?:\.\d+)?)\s*%/gi
    const underPattern = /(?:under|less than|maximum|max)\s+(\d+(?:\.\d+)?)\s*%/gi
    
    const overMatch = overPattern.exec(lowerPrompt)
    const underMatch = underPattern.exec(lowerPrompt)
    
    if (overMatch) {
      minEngagement = parseFloat(overMatch[1])
    }
    if (underMatch) {
      maxEngagement = parseFloat(underMatch[1])
    }
  }

  // Build filters if any were detected
  if (platforms.length > 0 || niches.length > 0 || locations.length > 0 || 
      emailRequired || minFollowers || maxFollowers || minEngagement || maxEngagement) {
    query.filters = {}
    if (platforms.length > 0) query.filters.platform = platforms
    if (niches.length > 0) query.filters.primary_niche = niches
    if (locations.length > 0) query.filters.location = locations
    if (emailRequired) query.filters.email_required = true
    if (minFollowers) query.filters.min_followers = minFollowers
    if (maxFollowers) query.filters.max_followers = maxFollowers
    if (minEngagement) query.filters.min_engagement_rate = minEngagement
    if (maxEngagement) query.filters.max_engagement_rate = maxEngagement
  }

  return query
}

/**
 * Get available filter options for UI
 */
export function getAvailableFilterOptions() {
  return {
    platforms: AVAILABLE_PLATFORMS,
    locations: AVAILABLE_LOCATIONS,
    niches: AVAILABLE_NICHES
  }
} 