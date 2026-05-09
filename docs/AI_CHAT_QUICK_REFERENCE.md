# AI Chat Quick Reference - BuzzBerry

## 🚀 Quick Start for ChatGPT

### System Overview
- **Purpose**: AI-powered creator discovery chat system
- **AI Engine**: Google Gemini Pro (`gemini-pro`)
- **Database**: Supabase with 2,720+ creator profiles
- **Frontend**: Next.js + React + Zustand
- **Caching**: SessionStorage for prompt-based caching

### Key Files to Understand

#### 1. AI Configuration
```typescript
// app/lib/ai/gemini.ts
const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-pro',
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  }
})
```

#### 2. System Prompt
```typescript
// app/lib/ai/prompts/system-prompts.ts
template: `You are Buzzberry AI, an expert in influencer marketing and creator discovery.

DATABASE CONTEXT (COMPLETE ACCESS):
- You have COMPLETE access to the full Buzzberry creator database with 2,720+ creators
- You can search and analyze ALL fields: handle, display_name, profile_url, profile_image_url, bio, platform, primary_niche, secondary_niche, location, locationRegion, followers_count, average_views, average_comments, engagement_rate, hashtags (array), email, recent_post_1-12, past_ad_placements, created_at, average_likes, brand_tags, bio_links, followers_change, followers_change_type, engagement_rate_change, engagement_rate_change_type, average_views_change, average_views_change_type, average_likes_change, average_likes_change_type, average_comments_change, average_comments_change_type, buzz_score

**ALWAYS suggest a list of influencer recommendations with their stats, even if the user is still refining their search. If no perfect match, show the closest matches and explain why. Never keep refining without showing influencer suggestions.**

Do NOT output a bulletpoint or text list of creators. The UI will show the list. Only output a summary or follow-up text after the list.`
```

#### 3. Main API Endpoint
```typescript
// app/api/ai-chat/route.ts
export async function POST(request: NextRequest) {
  const { message, sessionId, systemPromptName = 'buzzberry_default', page = 1, pageSize = 10 } = await request.json()

  // 1. Search creators
  const searchResult = await smartInfluencerSearch(message, {}, pageSize, page)
  
  // 2. Generate AI response
  const aiResponse = await generateAIResponse({
    prompt: message,
    systemPromptName,
    context: {
      stats: influencerStats,
      creators: searchResult.data,
      history: conversationContext,
      searchQuery: message,
      filters: {}
    }
  })
  
  // 3. Return structured response
  return NextResponse.json({
    influencers: searchResult.data,
    total: searchResult.totalCount,
    totalPages: searchResult.totalPages,
    page: page,
    pageSize: pageSize,
    aiResponseText: aiResponse.content,
    sessionId: currentSessionId
  })
}
```

#### 4. Creator Search Function
```typescript
// app/lib/ai/database.ts
export async function smartInfluencerSearch(
  userQuery: string,
  filters: InfluencerSearchFilters = {},
  limit: number = 20,
  page: number = 1
) {
  // Extract keywords from user query
  const keywords = extractKeywords(userQuery)
  
  // Build Supabase query with pagination
  const offset = (page - 1) * limit
  let queryBuilder = supabase
    .from('creatordata')
    .select('*', { count: 'exact' })
  
  // Apply search filters
  queryBuilder = queryBuilder.or(
    `display_name.ilike.%${keywords.join('%')}%,` +
    `primary_niche.ilike.%${keywords.join('%')}%,` +
    `secondary_niche.ilike.%${keywords.join('%')}%,` +
    `location.ilike.%${keywords.join('%')}%`
  )
  
  // Apply pagination
  queryBuilder = queryBuilder.range(offset, offset + limit - 1)
  
  const { data, error, count } = await queryBuilder
  
  // Score and sort results
  const scored = data.map(creator => ({
    ...creator,
    match_score: calculateMatchScore(creator, keywords)
  })).sort((a, b) => b.match_score - a.match_score)
  
  return {
    data: scored,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    page,
    limit
  }
}
```

### Data Flow Summary

1. **User Input** → `BuzzberryChatPage.tsx`
2. **API Call** → `POST /api/ai-chat`
3. **Creator Search** → `smartInfluencerSearch()` in `database.ts`
4. **AI Response** → `generateAIResponse()` with Gemini
5. **UI Update** → `CreatorListViewAI` component
6. **State Management** → Zustand store with sessionStorage persistence

### Key Features

#### Caching System
```typescript
// Cache key: creatorResult-${promptHash}-page-${page}
const cacheKey = `creatorResult-${promptHash}-page-${currentPagination.page}`
const cached = sessionStorage.getItem(cacheKey)
```

#### State Management
```typescript
// Zustand store for creator state
const {
  selectedCreators,
  expandedRows,
  pagination,
  toggleCreatorSelection,
  selectAllCreators,
  clearCreatorSelection,
  toggleRowExpansion,
  setPagination
} = useCreatorState()
```

#### Pagination
```typescript
// Server-side pagination with caching per page
const handlePageChange = async (promptHash: string, newPage: number, pageSize: number = 10) => {
  const cacheKey = `creatorResult-${promptHash}-page-${newPage}`
  // Check cache, fetch if needed, update state
}
```

### Database Schema (Key Fields)
```sql
CREATE TABLE creatordata (
  id SERIAL PRIMARY KEY,
  handle VARCHAR(255),
  display_name VARCHAR(255),
  profile_image_url TEXT,
  bio TEXT,
  platform VARCHAR(100),
  primary_niche VARCHAR(100),
  secondary_niche VARCHAR(100),
  location VARCHAR(255),
  locationRegion VARCHAR(255),
  followers_count INTEGER,
  average_views INTEGER,
  engagement_rate DECIMAL(5,4),
  hashtags TEXT[],
  buzz_score INTEGER,
  followers_change DECIMAL(5,2),
  engagement_rate_change DECIMAL(5,2)
);
```

### Environment Variables
```bash
# .env.local
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Usage Examples

#### Basic Search
```typescript
// User: "Find crypto creators in Miami"
// System: Searches database, returns creators + AI explanation
```

#### Advanced Search
```typescript
// User: "Show me finance creators with over 100K followers"
// System: Filters by niche, follower count, generates explanation
```

#### Conversation Context
```typescript
// User: "Find crypto creators"
// AI: "Here are some top crypto creators..." + list

// User: "Show me ones in New York"
// AI: "Here are crypto creators in New York..." + filtered list
// (Maintains context from previous message)
```

### Key Technical Decisions

1. **Separation of Concerns**: AI responses separate from creator data
2. **Prompt-Based Caching**: Cache results by prompt hash and page
3. **Server-Side Pagination**: Efficient data loading
4. **State Persistence**: Zustand + sessionStorage
5. **Modular Components**: Reusable CreatorListView components

### Performance Optimizations

- **SessionStorage Caching**: Avoid redundant API calls
- **Server-Side Pagination**: Only fetch required data
- **Lazy Loading**: Load details on expansion
- **Debounced Search**: Prevent excessive requests

This system provides a robust, scalable AI chat experience for creator discovery with natural language interaction, intelligent search, and rich data visualization. 