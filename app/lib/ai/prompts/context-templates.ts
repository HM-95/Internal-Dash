// Context Templates for AI Responses
export const CONTEXT_TEMPLATES = {
  DATABASE_STATS: (stats: any) => `
DATABASE STATS:
- Total creators: ${stats.total.toLocaleString()}
- Platforms: ${stats.platforms.join(', ')}
- Niches: ${stats.niches.slice(0, 15).join(', ')}${stats.niches.length > 15 ? ` and ${stats.niches.length - 15} more` : ''}
- Avg engagement rate: ${stats.avgEngagement.toFixed(2)}%
- Avg followers: ${stats.avgFollowers.toLocaleString()}
- Avg views: ${stats.avgViews.toLocaleString()}
- Total views: ${stats.totalViews.toLocaleString()}
- Top platform: ${stats.topPlatform}
- Top niche: ${stats.topNiche}`,

  RELEVANT_CREATORS: (creators: any[]) => `
RELEVANT CREATORS FROM DATABASE:
${creators.map(creator => `- **${creator.handle}** (${creator.platform}): ${creator.followers_count.toLocaleString()} followers, ${creator.engagement_rate.toFixed(2)}% engagement, ${creator.primary_niche}${creator.secondary_niche ? ` / ${creator.secondary_niche}` : ''}${creator.location_region ? `, ${creator.location_region}` : ''}${creator.hashtags && creator.hashtags.length > 0 ? `, hashtags: ${creator.hashtags.slice(0, 5).join(', ')}` : ''}`).join('\n')}`,

  CONVERSATION_HISTORY: (history: any[]) => `
CONVERSATION HISTORY (REMEMBER THIS CONTEXT):
${history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

IMPORTANT: Use this conversation history to understand what the user has already asked about and maintain context. If they reference previous creators, questions, or data points, incorporate that knowledge into your response.`,

  SEARCH_CONTEXT: (query: string, filters: any) => `
SEARCH CONTEXT:
- User Query: "${query}"
- Applied Filters: ${Object.keys(filters).length > 0 ? JSON.stringify(filters, null, 2) : 'None'}
- Search Strategy: Comprehensive database search across all fields`
} 