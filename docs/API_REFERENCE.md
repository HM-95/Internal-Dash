API Reference

Conventions
- All endpoints live under Next.js App Router at `app/api/**`.
- Auth: Cookie-based Supabase session (`createRouteHandlerClient({ cookies })`).
- Errors return `{ error: string }` with appropriate HTTP status.

POST /api/ai-chat
- Body
```ts
interface Body { message: string; sessionId?: string; systemPromptName?: string; page?: number; pageSize?: number }
```
- Streaming text/plain response. Headers include:
  - `X-Session-ID`: string (created if not provided)
  - `X-Influencer-Total`, `X-Influencer-Page`, `X-Influencer-PageSize`
- JSON mode (debug): add `?json=1` or header `x-influencer-json: 1`
```json
{
  "influencers": [ /* initial candidates from creatordata */ ],
  "total": 1234,
  "totalPages": 124,
  "page": 1,
  "pageSize": 10,
  "aiResponseText": "...",
  "sessionId": "..."
}
```

GET /api/chat-history
- Auth required.
- Response
```ts
{ chatHistory: Array<{ id: string; title: string; lastMessage: string; lastUpdated: string; messageCount: number }>; userId: string }
```

POST /api/chat-session
- Body: `{ sessionId: string }`
- Response: `{ session: { id, title, subtitle, updatedAt }, messages: Array<{ id, content, role, timestamp }> }`

POST /api/chat-history/clear-all
- Auth required; soft-deletes all sessions for current user.
- Response: `{ success: true }`

POST /api/chat-history/clear
- Body: `{ userId: string }` (service operation)
- Deletes all messages, results, sessions for the user.
- Response: `{ success: true }`

GET /api/chat-creator-results?sessionId=...
- Returns `{ success: true, data: Array<row> }` ordered by `created_at`.

POST /api/chat-creator-results
- Body
```ts
{
  sessionId: string,
  promptHash: string,
  prompt: string,
  creatorsData: any[],
  totalCount: number
}
```
- Response: `{ success: true, data: row[] }`

GET /api/creator-recommendations
- Query params: `prompt`, `limit`, `sort_by`, `sort_order`, plus optional filters: `platform`, `location`, `location_region`, `primary_niche`, `secondary_niche`, `min_followers`, `max_followers`, `min_engagement_rate`, `max_engagement_rate`, `min_buzz_score`, `brand_tags`, `past_ad_placements`, `email_required`.
- Response: `{ success: true, data: Creator[], count, query }`

POST /api/creator-recommendations
- Body: same schema as GET (in JSON)
- Response: `{ success: true, data: Creator[], count, query }`

Creator
```ts
interface Creator {
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
```

Related
- ./AI_CHAT.md
- ./DISCOVER_PAGE.md


