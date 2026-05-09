AI Chat

Overview
The AI chat turns a natural-language prompt into a streaming assistant response and an inline Recommended Creators list. Client logic lives in `app/hooks/useAIChat.ts`; server endpoints are `app/api/ai-chat/route.ts`, `app/api/creator-recommendations/route.ts`, and `app/api/chat-creator-results/route.ts`.

Request/response flow
1) Client sends the prompt
   - `POST /api/ai-chat` with JSON `{ message, sessionId? }`.
   - If no `sessionId`, the route creates a new one, and returns it as `X-Session-ID` header.
   - The route saves the user message, loads up to 50 recent messages for context, gathers initial creators (keyword search on `creatordata`), then streams a Gemini reply.

2) Client reads the stream and appends the assistant message
   - The UI assembles the stream into `accumulatedText` and adds an assistant message in local state.

3) Client fetches recommendations
   - In parallel, the UI calls `POST /api/creator-recommendations` with `{ prompt, filters? }`.
   - The server extracts/augments filters via GPT (best-effort), generates a query embedding, fetches candidate rows from `creator_index`, scores and sorts.

4) Persist creator results
   - The UI saves results via `POST /api/chat-creator-results` with `{ sessionId, promptHash, prompt, creatorsData, totalCount }`.
   - The server also inserts a marker message `CREATOR_RESULTS:<promptHash>` into `chat_messages` so history can render lists inline.

Streaming
- `POST /api/ai-chat` returns a ReadableStream of text/plain.
- Headers include `X-Session-ID`, plus pagination hints for the initial candidate search.

Creator recommendations (hybrid search)
- Endpoint: `app/api/creator-recommendations/route.ts` (GET/POST)
- Pipeline:
  - If no filters in the request, `extractFiltersFromPrompt()` uses GPT-4-turbo-preview to produce a JSON of inferred filters (platforms, locations, niches, ranges, email requirement, etc.).
  - Generate a query embedding with OpenAI `text-embedding-3-small`.
  - Fetch candidates from `creator_index` (with optional simple filters).
  - Compute semantic similarity from three vectors per row: recent_content (60%), bio (30%), hashtags (10%).
  - Compute a metadata relevance score (platform/location/niche matches, email bonus, brand_tags/past_ad_placements overlap).
  - Final score = 0.6 * semantic + 0.4 * metadata.
  - If no results, loosen numeric filters (±10% or thresholds) and retry; final fallback: keyword location search (`location_region`/`location`).

Scoring details
```text
semanticScore = 0.6 * cos(query, recent_content_embedding)
              + 0.3 * cos(query, bio_embedding)
              + 0.1 * cos(query, hashtags_embedding)
metadataScore ∈ [0,1] from matching filter facets (platform, location, niche, email, brand tags, placements)
finalScore = 0.6 * semanticScore + 0.4 * metadataScore
```

Prompt hashing and list persistence
- `useAIChat.ts` computes a SHA-256 `promptHash` for each user prompt.
- A special assistant message `CREATOR_RESULTS:<promptHash>` is added where the list should appear.
- `chat_creator_results` rows are keyed to the session and `prompt_hash` for rehydration.
- UI state (expanded rows, selections, pagination) is persisted per `promptHash` in Zustand (sessionStorage).

System prompts
- Gemini prompt assembly is in `app/lib/ai/gemini.ts` using templates in `./prompts/**`.
- The handler passes DB stats, recent creators, and conversation history for better answers.

Related docs
- ./STATE.md
- ./API_REFERENCE.md
- ./DATABASE.md


