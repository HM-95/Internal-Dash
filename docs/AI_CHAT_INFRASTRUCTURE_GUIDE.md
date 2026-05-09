# AI Chat Infrastructure Guide - BuzzBerry

## Overview
This document provides a complete overview of the AI chat system built for BuzzBerry, including Gemini API integration, prompting strategies, data flow, and source code structure. This system enables users to have natural conversations about finding and analyzing creators while providing relevant creator recommendations.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Gemini API Integration](#gemini-api-integration)
3. [Prompting Strategy](#prompting-strategy)
4. [Data Flow](#data-flow)
5. [Source Code Structure](#source-code-structure)
6. [Creator Data Integration](#creator-data-integration)
7. [State Management](#state-management)
8. [Caching & Performance](#caching--performance)
9. [API Endpoints](#api-endpoints)
10. [Usage Examples](#usage-examples)

---

## System Architecture

### High-Level Flow
```
User Input → API Route → Gemini API → Creator Search → Response Generation → UI Rendering
```

### Key Components
- **Frontend**: Next.js React components with Zustand state management
- **Backend**: Next.js API routes with Supabase database
- **AI Engine**: Google Gemini Pro for natural language processing
- **Data Source**: Supabase database with 2,720+ creator profiles
- **Caching**: SessionStorage for prompt-based caching

---

## Gemini API Integration

### API Key Setup
```typescript
// Environment Variables (.env.local)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

### API Client Configuration
**File**: `app/lib/ai/gemini.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

export const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-pro',
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  }
})
```

### Model Configuration
- **Model**: `gemini-pro` (latest stable version)
- **Temperature**: 0.7 (balanced creativity and consistency)
- **Max Tokens**: 2048 (sufficient for detailed responses)
- **Top-K**: 40 (diverse token selection)
- **Top-P**: 0.95 (nucleus sampling)

---

## Prompting Strategy

### System Prompts
**File**: `app/lib/ai/prompts/system-prompts.ts`

#### Default System Prompt
```typescript
export const SYSTEM_PROMPTS = {
  BUZZBERRY_DEFAULT: {
    name: 'buzzberry_default',
    description: 'Default Buzzberry AI assistant for influencer marketing and creator discovery',
    template: `You are Buzzberry AI, an expert in influencer marketing and creator discovery.

DATABASE CONTEXT (COMPLETE ACCESS):
- You have COMPLETE access to the full Buzzberry creator database with 2,720+ creators
- You can search and analyze ALL fields: handle, display_name, profile_url, profile_image_url, bio, platform, primary_niche, secondary_niche, location, locationRegion, followers_count, average_views, average_comments, engagement_rate, hashtags (array), email, recent_post_1-12, past_ad_placements, created_at, average_likes, brand_tags, bio_links, followers_change, followers_change_type, engagement_rate_change, engagement_rate_change_type, average_views_change, average_views_change_type, average_likes_change, average_likes_change_type, average_comments_change, average_comments_change_type, buzz_score
- IMPORTANT: You have FULL database access. If a user asks for specific data (niche, platform, followers, hashtags, etc.), you CAN find it
- Search comprehensively across all fields. Use hashtags arrays, both primary and secondary niches, platform data, follower counts, engagement rates, and all other available metrics
- ALWAYS search the full database - you have access to 2,720+ creators
- Use hashtags arrays, primary_niche, secondary_niche, platform, followers, engagement, views, and ALL other fields
- If exact match not found, suggest closest matches using available data
- Never say you can't find data unless you've searched ALL fields
- Keep responses SHORT, friendly, and personalized (max 2-3 sentences unless comparing multiple creators)
- Be conversational and helpful, like talking to a friend
- Use proper markdown: **bold** for emphasis, - for lists
- REMEMBER previous messages in this conversation and maintain context
- ADAPT response length based on user request - if they ask for "detailed" or "more info", provide longer responses. If they ask for "quick" or "brief", keep it short
- For location searches, check both 'location' and 'locationRegion' fields and understand variations (e.g., "Miami" might be stored as "Miami, FL", "Miami, US", "Miami, USA")
- For niche searches, check both 'primary_niche' and 'secondary_niche' fields
- For hashtag searches, check the 'hashtags' array field

**ALWAYS suggest a list of influencer recommendations with their stats, even if the user is still refining their search. If no perfect match, show the closest matches and explain why. Never keep refining without showing influencer suggestions.**

Search comprehensively and provide accurate data-driven responses.
Do NOT output a bulletpoint or text list of creators. The UI will show the list. Only output a summary or follow-up text after the list.`
  }
}
```

### Prompt Engineering Principles

#### 1. Context Injection
- **Database Schema**: Full creator database schema provided to Gemini
- **Field Mapping**: Clear mapping of all available data fields
- **Search Instructions**: Specific guidance on how to search across fields

#### 2. Response Formatting
- **No Creator Lists**: AI should not output creator lists (handled by UI)
- **Summary Text**: Provide contextual summaries and explanations
- **Markdown Support**: Use proper markdown formatting for emphasis

#### 3. Conversation Context
- **Memory**: Maintain conversation history across messages
- **Adaptive Responses**: Adjust response length based on user requests
- **Personalization**: Friendly, conversational tone

---

## Data Flow

### 1. User Input Processing
**File**: `app/components/dashboard/screens/BuzzberryChatPage/BuzzberryChatPage.tsx`

```typescript
const sendMessage = async (message: string) => {
  // Generate hash for caching
  const promptHash = await generateHash(message)
  
  // Check cache first
  const cacheKey = `creatorResult-${promptHash}-page-${currentPagination.page}`
  const cached = sessionStorage.getItem(cacheKey)
  
  if (cached) {
    // Use cached data
    const cachedData = JSON.parse(cached)
    // Update state with cached data
  } else {
    // Fetch fresh data from API
    const response = await fetch('/api/ai-chat?json=1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message, 
        sessionId, 
        page: currentPagination.page, 
        pageSize: currentPagination.pageSize 
      })
    })
  }
}
```

### 2. API Route Processing
**File**: `app/api/ai-chat/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const { message, sessionId, systemPromptName = 'buzzberry_default', page = 1, pageSize = 10 } = await request.json()

  // 1. Search for relevant creators
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

### 3. Creator Search
**File**: `app/lib/ai/database.ts`

```typescript
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

---

## Source Code Structure

### Core AI Files
```
app/lib/ai/
├── gemini.ts                 # Gemini API client configuration
├── prompts/
│   ├── system-prompts.ts     # System prompt templates
│   └── index.ts             # Prompt exports
├── database.ts              # Creator search and database operations
├── creator-explanation.ts   # AI explanation generation
└── index.ts                # AI module exports
```

### API Routes
```
app/api/
├── ai-chat/
│   └── route.ts             # Main AI chat endpoint
├── chat-history/
│   └── route.ts             # Chat session management
└── send-waitlist-email/
    └── route.ts             # Email functionality
```

### Frontend Components
```
app/components/dashboard/screens/BuzzberryChatPage/
├── BuzzberryChatPage.tsx    # Main chat interface
└── components/              # Chat-specific components

app/components/sections/CreatorListSection/
├── CreatorListView.tsx      # Creator list display
└── CreatorListSection.tsx   # Discover page integration
```

### State Management
```
app/store/
└── useCreatorState.ts       # Zustand store for creator state
```

---

## Creator Data Integration

### Database Schema
**Table**: `creatordata`

```sql
CREATE TABLE creatordata (
  id SERIAL PRIMARY KEY,
  handle VARCHAR(255),
  display_name VARCHAR(255),
  profile_url TEXT,
  profile_image_url TEXT,
  bio TEXT,
  platform VARCHAR(100),
  primary_niche VARCHAR(100),
  secondary_niche VARCHAR(100),
  location VARCHAR(255),
  locationRegion VARCHAR(255),
  followers_count INTEGER,
  average_views INTEGER,
  average_comments INTEGER,
  engagement_rate DECIMAL(5,4),
  hashtags TEXT[],
  email VARCHAR(255),
  buzz_score INTEGER,
  -- Additional fields for tracking changes
  followers_change DECIMAL(5,2),
  engagement_rate_change DECIMAL(5,2),
  average_views_change DECIMAL(5,2)
);
```

### Data Transformation
**File**: `app/utils/creatorListIntegration.ts`

```typescript
export function transformCreatorData(creator: any) {
  return {
    id: creator.id || creator.handle,
    name: creator.display_name || creator.name || creator.handle,
    username_tag: `@${creator.handle}`,
    avatar_url: creator.profile_image_url || creator.profile_picture_url,
    initials: generateInitials(creator.display_name),
    followers: creator.followers_count || creator.followers || 0,
    avg_views: creator.average_views || creator.avg_views || 0,
    engagement_rate: creator.engagement_rate || 0,
    location: creator.location || creator.locationRegion || 'Unknown',
    buzz_score: creator.buzz_score || 0,
    match_score: creator.match_score || 0,
    niches: generateNiches(creator.primary_niche, creator.secondary_niche)
  }
}
```

---

## State Management

### Zustand Store
**File**: `app/store/useCreatorState.ts`

```typescript
interface CreatorState {
  selectedCreators: Record<string, Set<string>>
  expandedRows: Record<string, Set<string>>
  pagination: Record<string, { page: number; totalPages: number; pageSize: number }>
  
  // Actions
  toggleCreatorSelection: (promptHash: string, creatorId: string) => void
  selectAllCreators: (promptHash: string, creatorIds: string[]) => void
  clearCreatorSelection: (promptHash: string) => void
  toggleRowExpansion: (promptHash: string, creatorId: string) => void
  setPagination: (promptHash: string, page: number, totalPages: number, pageSize: number) => void
  
  // Getters
  getSelectedCreators: (promptHash: string) => Set<string>
  getExpandedRows: (promptHash: string) => Set<string>
  getPagination: (promptHash: string) => { page: number; totalPages: number; pageSize: number } | null
  isCreatorSelected: (promptHash: string, creatorId: string) => boolean
  isRowExpanded: (promptHash: string, creatorId: string) => boolean
}
```

### Persistence
- **SessionStorage**: Automatic persistence of state across page reloads
- **Set Serialization**: Custom serialization for Set objects
- **Prompt-Scoped**: State is scoped by prompt hash for multiple conversations

---

## Caching & Performance

### Prompt-Based Caching
```typescript
// Cache key structure
const cacheKey = `creatorResult-${promptHash}-page-${page}`

// Cache entry structure
const cacheEntry = {
  data: creatorData,
  promptHash: hash,
  cachedAt: Date.now(),
  page: page,
  pageSize: pageSize
}

// Cache utilities
const clearCreatorCache = () => {
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('creatorResult-')) {
      sessionStorage.removeItem(key)
    }
  })
}

const cleanExpiredCache = (maxAgeHours: number = 24) => {
  const now = Date.now()
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('creatorResult-')) {
      const cached = JSON.parse(sessionStorage.getItem(key)!)
      if (now - cached.cachedAt > maxAgeHours * 60 * 60 * 1000) {
        sessionStorage.removeItem(key)
      }
    }
  })
}
```

### Performance Optimizations
- **Server-Side Pagination**: Only fetch required data
- **Lazy Loading**: Load creator details on expansion
- **Debounced Search**: Prevent excessive API calls
- **Session Caching**: Avoid redundant requests

---

## API Endpoints

### POST /api/ai-chat
**Purpose**: Main AI chat endpoint for creator search and AI responses

**Request Body**:
```typescript
{
  message: string,           // User's query
  sessionId?: string,        // Chat session ID
  systemPromptName?: string, // System prompt to use
  page?: number,            // Pagination page
  pageSize?: number         // Results per page
}
```

**Response**:
```typescript
{
  influencers: Creator[],    // Matched creators
  total: number,            // Total count
  totalPages: number,       // Total pages
  page: number,             // Current page
  pageSize: number,         // Page size
  aiResponseText: string,   // AI-generated response
  sessionId: string         // Session ID
}
```

### POST /api/chat-history
**Purpose**: Manage chat sessions and message history

**Request Body**:
```typescript
{
  sessionId?: string,       // Session ID
  message?: string,         // Message content
  role?: 'user' | 'assistant' // Message role
}
```

---

## Usage Examples

### Basic Creator Search
```typescript
// User input: "Find crypto creators in Miami"
const response = await fetch('/api/ai-chat?json=1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Find crypto creators in Miami",
    page: 1,
    pageSize: 10
  })
})

// Response includes:
// - AI explanation of the search
// - Paginated list of matching creators
// - Match scores and creator details
```

### Advanced Filtering
```typescript
// User input: "Show me finance creators with over 100K followers and high engagement"
// The system will:
// 1. Extract keywords: ["finance", "100K", "followers", "high", "engagement"]
// 2. Search database with filters
// 3. Score results based on relevance
// 4. Generate AI explanation
// 5. Return paginated results
```

### Conversation Context
```typescript
// User: "Find crypto creators"
// AI: "Here are some top crypto creators..." + creator list

// User: "Show me ones in New York"
// AI: "Here are crypto creators in New York..." + filtered list
// (System maintains context from previous message)
```

---

## Key Features

### 1. Natural Language Processing
- **Keyword Extraction**: Automatically extracts relevant search terms
- **Context Understanding**: Maintains conversation context
- **Intent Recognition**: Understands user search intentions

### 2. Intelligent Search
- **Multi-Field Search**: Searches across all creator fields
- **Fuzzy Matching**: Handles partial matches and variations
- **Relevance Scoring**: Ranks results by relevance to query

### 3. Rich Data Integration
- **Complete Creator Profiles**: Access to all creator data
- **Real-Time Metrics**: Current follower counts, engagement rates
- **Historical Data**: Growth trends and performance changes

### 4. User Experience
- **Conversational Interface**: Natural chat-like interaction
- **Visual Creator Lists**: Rich, interactive creator displays
- **Pagination**: Handle large result sets efficiently
- **State Persistence**: Maintains user selections and preferences

### 5. Performance & Scalability
- **Caching**: Reduces API calls and improves response times
- **Server-Side Pagination**: Efficient data loading
- **Optimized Queries**: Fast database searches
- **Session Management**: Efficient chat session handling

---

## Development Notes

### Environment Setup
1. Set `GOOGLE_GEMINI_API_KEY` in `.env.local`
2. Ensure Supabase connection is configured
3. Install dependencies: `npm install @google/generative-ai zustand`

### Testing
- Test with various user queries
- Verify caching behavior
- Check pagination functionality
- Validate state persistence

### Monitoring
- Monitor API response times
- Track cache hit rates
- Monitor Gemini API usage
- Check for search accuracy

This infrastructure provides a robust, scalable AI chat system that seamlessly integrates creator discovery with natural language interaction, delivering a powerful tool for influencer marketing and creator analysis. 