// Response Format Templates
export const RESPONSE_FORMATS = {
  CREATOR_LIST: (creators: any[]) => `
**Found ${creators.length} creators matching your criteria:**

${creators.map((creator, index) => `${index + 1}. **${creator.handle}** (${creator.platform})
   - Followers: ${creator.followers_count.toLocaleString()}
   - Engagement: ${creator.engagement_rate.toFixed(2)}%
   - Niche: ${creator.primary_niche}${creator.secondary_niche ? ` / ${creator.secondary_niche}` : ''}
   - Location: ${creator.location_region || 'N/A'}
   - Buzz Score: ${creator.buzz_score}`).join('\n\n')}`,

  CREATOR_DETAILED: (creator: any) => `
**${creator.handle}** (${creator.platform})

**Stats:**
- Followers: ${creator.followers_count.toLocaleString()}
- Engagement Rate: ${creator.engagement_rate.toFixed(2)}%
- Average Views: ${creator.average_views ? creator.average_views.toLocaleString() : 'N/A'}
- Buzz Score: ${creator.buzz_score}

**Details:**
- Primary Niche: ${creator.primary_niche}
- Secondary Niche: ${creator.secondary_niche || 'N/A'}
- Location: ${creator.locationRegion || 'N/A'}
- Bio: ${creator.bio ? creator.bio.substring(0, 200) + '...' : 'N/A'}

**Performance Trends:**
- Followers Change: ${creator.followers_change > 0 ? '+' : ''}${creator.followers_change.toLocaleString()}
- Engagement Change: ${creator.engagement_rate_change > 0 ? '+' : ''}${creator.engagement_rate_change}%

**Hashtags:** ${creator.hashtags && creator.hashtags.length > 0 ? creator.hashtags.slice(0, 10).join(', ') : 'N/A'}`,

  ANALYTICS_SUMMARY: (stats: any, creators: any[]) => `
**Analytics Summary:**

**Database Overview:**
- Total Creators: ${stats.total.toLocaleString()}
- Average Engagement: ${stats.avgEngagement.toFixed(2)}%
- Average Followers: ${stats.avgFollowers.toLocaleString()}
- Top Platform: ${stats.topPlatform}
- Top Niche: ${stats.topNiche}

**Search Results:**
- Found ${creators.length} creators matching criteria
- Average engagement of results: ${(creators.reduce((sum, c) => sum + c.engagement_rate, 0) / creators.length).toFixed(2)}%
- Platform distribution: ${Object.entries(creators.reduce((acc, c) => { acc[c.platform] = (acc[c.platform] || 0) + 1; return acc; }, {} as Record<string, number>)).map(([p, c]) => `${p}: ${c}`).join(', ')}`,

  ERROR_RESPONSE: (error: string) => `
I apologize, but I encountered an issue: **${error}**

Please try:
- Refining your search criteria
- Using different keywords
- Checking your internet connection
- Contacting support if the issue persists`
} 