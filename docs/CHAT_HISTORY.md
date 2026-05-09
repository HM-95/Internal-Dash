Chat History

Tables
- `chat_sessions(id, user_id, title, subtitle, is_active, created_at, updated_at)`
- `chat_messages(id, chat_session_id, user_id, role, content, created_at)`
- `chat_creator_results(id, chat_session_id, prompt_hash, prompt, creators_data, total_count, created_at)` – used by `/api/chat-creator-results`.

APIs
- `GET /api/chat-history`
  - Returns formatted array of sessions for the current user.
  - Picks the latest assistant message that is NOT a `CREATOR_RESULTS:` marker for the subtitle; truncates title/subtitle to fit the sidebar.
- `POST /api/chat-session` `{ sessionId }`
  - Returns a specific session and its messages, sorted chronologically.
- `POST /api/chat-history/clear-all`
  - Soft-deletes all sessions for the current user.
- `POST /api/chat-history/clear` `{ userId }`
  - Hard-deletes all messages, creator results, and sessions for the given user (service route).
- `GET/POST /api/chat-creator-results`
  - Save/find `chat_creator_results` rows per session; also inserts a `CREATOR_RESULTS:<promptHash>` marker message.

Streaming
- `/api/ai-chat` streams Gemini text; after streaming finishes, the assistant message is saved to DB and the session title is updated.

Error handling
- 401 if not authenticated (cookie-based Supabase client).
- 500 with JSON `{ error }` on DB errors.

Related
- ./API_REFERENCE.md
- ./AI_CHAT.md


