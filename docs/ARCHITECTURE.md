Architecture

High-level system

```mermaid
graph LR
  U[User] -->|UI| FE[Next.js App Router]
  FE -->|fetch| API[API Routes (/app/api/**)]
  API -->|SQL| DB[(Supabase Postgres)]
  API -->|embeddings| OpenAI[OpenAI API]
  API -->|chat| Gemini[Gemini 1.5 Flash]
  DB -->|RLS-auth| Auth[Supabase Auth]
  FE -->|Zustand| State[Session Storage]
```

Prompt data flow

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Next.js UI (useAIChat)
  participant A as POST /api/ai-chat
  participant R as POST/GET /api/creator-recommendations
  participant S as Supabase (creatordata, creator_index)
  participant G as Gemini

  U->>FE: Enter prompt
  FE->>A: POST message (optional sessionId)
  A->>S: createChatSession + createChatMessage(user)
  A->>S: load chat history for context
  A->>S: smartInfluencerSearch (initial set)
  A->>G: stream response with context (creators, history)
  A->>FE: Stream text + X-Session-ID
  FE->>R: POST prompt (semantic + filters)
  R->>S: Query creator_index + score (semantic+metadata)
  R-->>FE: Top N creators
  FE->>S: POST /api/chat-creator-results (persist)
  FE: Render Recommended Creators inline under the prompt
```

Layers
- Frontend: Next.js components, hooks, and Zustand store. Caching in sessionStorage and localStorage (Discover).
- API: Route handlers for ai-chat, creator-recommendations, chat-history, chat-session, chat-creator-results.
- AI: Gemini response generation; OpenAI embeddings (text-embedding-3-small) for vector fields.
- DB: Supabase Postgres with pgvector; RLS enabled; tables for chat and semantic index.
- Caching: Client-side sessionStorage (Zustand) and localStorage (Discover page). Some in-memory caching inside hooks.

Where caching lives
- AI Chat UI: selection/expansion/pagination per prompt via Zustand persisted to sessionStorage.
- Discover: creators pages and metrics cached in localStorage with TTL; counts cached in-memory with TTL.

Related docs
- ../README.md
- ./AI_CHAT.md
- ./DATABASE.md
- ./EMBEDDINGS.md
- ./CACHING_PERF.md


