Authentication & Authorization

Provider
- Supabase Auth is used for authentication. Server routes use `createRouteHandlerClient({ cookies })` to read the authenticated user from Next.js cookies.

Usage in routes
- `app/api/ai-chat/route.ts`:
  - Ensures `user?.id` exists; otherwise returns 401.
  - Creates chat sessions/messages with a Supabase Service Role client for reliability.
- `app/api/chat-history/route.ts` and `app/api/chat-session/route.ts`:
  - Use the cookie-bound client to fetch sessions/messages for the authenticated user only.

RLS overview
Enabled tables and relevant policies:
- From `supabase-migration.sql`:
  - `chat_sessions`, `chat_messages`, `onboarding_data`, `user_profiles` with RLS enabled and policies enforcing `auth.uid() = user_id` for select/insert/update/delete.
- From `supabase-migration-creator-index.sql`:
  - `creator_index` has RLS enabled with a policy allowing `SELECT` to `authenticated` role; service role can manage all.

Types and return shapes
- Chat history API returns `chatHistory: Array<{ id, title, lastMessage, lastUpdated, messageCount }>` after formatting and truncation to avoid sidebar overflow.
- Chat session API returns `{ session: { id, title, subtitle, updatedAt }, messages: Array<{ id, content, role, timestamp }> }`.

Sessions in API
- `X-Session-ID` is returned from `/api/ai-chat` when a new session is created.
- `useAIChat` then uses that id (or existing one) to persist creator results and to load sessions later.

Notes
- Service Role key is used on the server for write paths that would otherwise be blocked by RLS (e.g., `createChatSession`, `createChatMessage`).
- Client-side SDK in hooks uses the anon key for read operations.

Related
- ./CHAT_HISTORY.md
- ./API_REFERENCE.md


