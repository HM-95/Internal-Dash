import { generateAIResponse } from './ai/gemini'
import { supabase } from './supabaseClient';
import { RawCreator, InfluencerSearchFilters, CampaignRecommendation } from '../types/database';

export const INFLUENCER_PROMPT_TEMPLATES = {
  SEARCH: `You are Buzzberry AI, an expert influencer marketing analyst with access to a comprehensive database of creators across all social media platforms.

Available Data:
- {influencer_count} influencers across {platforms}
- Detailed metrics: followers, engagement rates, views, likes, comments
- Demographics and location data
- Recent posts and brand collaborations
- Performance trends and buzz scores

User Query: {query}

Provide a comprehensive analysis with:
1. **Top 5-10 Matching Influencers** with detailed reasoning for each match
2. **Audience Analysis** - demographics, interests, and engagement patterns
3. **Performance Insights** - engagement rates, growth trends, and content performance
4. **Campaign Recommendations** - suggested approach, budget range, and expected outcomes
5. **Risk Assessment** - potential challenges and mitigation strategies

Format your response with clear sections, bullet points, and actionable insights. Be specific about numbers and data.`,

  ANALYSIS: `Analyze these specific influencers for a campaign:

Influencer Data:
{influencer_data}

Campaign Goals: {goals}

Provide a detailed breakdown including:
1. **Individual Influencer Analysis**
   - Strengths and unique value propositions
   - Audience quality and engagement authenticity
   - Content style and brand alignment potential
   - Recent performance trends

2. **Comparative Analysis**
   - Ranking by different metrics (engagement, reach, cost-effectiveness)
   - Audience overlap and complementarity
   - Risk vs. reward assessment

3. **Campaign Strategy**
   - Recommended content approach for each influencer
   - Optimal posting schedule and frequency
   - Budget allocation recommendations
   - Expected ROI projections

4. **Implementation Plan**
   - Timeline and milestones
   - Key performance indicators to track
   - Success metrics and benchmarks`,

  RECOMMENDATION: `Based on the chat conversation and influencer analysis, generate a comprehensive campaign recommendation:

Chat Context: {chat_context}

Selected Influencers: {selected_influencers}

Create a structured campaign recommendation with:
1. **Campaign Overview** - objectives, target audience, and key messages
2. **Influencer Selection Rationale** - why these creators are optimal
3. **Content Strategy** - recommended content types, themes, and formats
4. **Budget Breakdown** - cost per influencer and total campaign budget
5. **Timeline** - recommended campaign duration and posting schedule
6. **Success Metrics** - KPIs to track and expected outcomes
7. **Risk Mitigation** - potential challenges and solutions

Format as a professional campaign brief with clear sections and actionable next steps.`
}

export async function searchInfluencers(
  query: string,
  filters: InfluencerSearchFilters,
  influencerCount: number,
  platforms: string[]
): Promise<string> {
  const context = INFLUENCER_PROMPT_TEMPLATES.SEARCH
    .replace('{query}', query)
    .replace('{influencer_count}', influencerCount.toString())
    .replace('{platforms}', platforms.join(', '))

  const response = await generateAIResponse({ prompt: query, context: { searchQuery: query } })
  return response.content
}

export async function analyzeInfluencers(
  influencers: RawCreator[],
  campaignGoals: string
): Promise<string> {
  const influencerData = influencers.map(inf => `
    ${inf.display_name} (@${inf.handle})
    - Platform: ${inf.platform}
    - Followers: ${inf.followers_count.toLocaleString()}
    - Engagement Rate: ${inf.engagement_rate}%
    - Primary Niche: ${inf.primary_niche}
    - Location: ${inf.location}
    - Recent Performance: ${inf.followers_change > 0 ? '+' : ''}${inf.followers_change} followers, ${inf.engagement_rate_change > 0 ? '+' : ''}${inf.engagement_rate_change}% engagement
  `).join('\n')

  const context = INFLUENCER_PROMPT_TEMPLATES.ANALYSIS
    .replace('{influencer_data}', influencerData)
    .replace('{goals}', campaignGoals)

  const response = await generateAIResponse({ prompt: 'Analyze these influencers for our campaign', context: { creators: influencers } })
  return response.content
}

export async function generateCampaignRecommendation(
  chatContext: string,
  selectedInfluencers: RawCreator[]
): Promise<string> {
  const influencerData = selectedInfluencers.map(inf => 
    `${inf.display_name} (@${inf.handle}) - ${inf.platform} - ${inf.followers_count.toLocaleString()} followers`
  ).join(', ')

  const context = INFLUENCER_PROMPT_TEMPLATES.RECOMMENDATION
    .replace('{chat_context}', chatContext)
    .replace('{selected_influencers}', influencerData)

  const response = await generateAIResponse({ prompt: 'Generate campaign recommendation', context: { history: [{ role: 'user', content: chatContext }] } })
  return response.content
}

export function formatInfluencerForAI(influencer: RawCreator): string {
  return `
${influencer.display_name} (@${influencer.handle})
Platform: ${influencer.platform}
Followers: ${influencer.followers_count.toLocaleString()}
Engagement Rate: ${influencer.engagement_rate}%
Average Views: ${influencer.average_views.toLocaleString()}
Average Likes: ${typeof influencer.average_likes === 'object' ? JSON.stringify(influencer.average_likes) : influencer.average_likes}
Average Comments: ${influencer.average_comments}
Primary Niche: ${influencer.primary_niche}
Secondary Niche: ${influencer.secondary_niche}
Location: ${influencer.location}
Bio: ${influencer.bio}
Recent Performance Changes:
- Followers: ${influencer.followers_change > 0 ? '+' : ''}${influencer.followers_change} (${influencer.followers_change_type})
- Engagement: ${influencer.engagement_rate_change > 0 ? '+' : ''}${influencer.engagement_rate_change}% (${influencer.engagement_rate_change_type})
- Views: ${influencer.average_views_change > 0 ? '+' : ''}${influencer.average_views_change} (${influencer.average_views_change_type})
Buzz Score: ${influencer.buzz_score}
Hashtags: ${influencer.hashtags.join(', ')}
Past Brand Collaborations: ${influencer.paid_ad_placements ? 'Yes' : 'No'}
  `.trim()
} 