Troubleshooting

Next/Image unconfigured host
- Error: Invalid src prop ... hostname "lh3.googleusercontent.com" is not configured
- Fix: Add host to `images.domains` in `next.config.js` and restart dev server.

500 on /api/chat-history
- Likely missing auth cookie or DB error.
- Ensure you are logged in; check Supabase project URL/keys; inspect server logs.

Chat history title/subtitle overflow
- The server truncates values; ensure the sidebar UI uses `truncate` / `line-clamp` classes.

Duplicate React key warning
- Ensure list rows use stable keys (creator `id`), not array index.

Empty `creator_index`
- Run `npm run populate-creator-index populate` (or `reset`) after seeding `creatordata`.

Embedding failures
- Check `OPENAI_API_KEY`.
- Script uses limited retries/backoff; rerun with a small `--limit`.

Streaming shows but no creator list
- Ensure `/api/creator-recommendations` is reachable and `OPENAI_API_KEY` is set for embeddings.
- Confirm `chat_creator_results` table exists if you rely on rehydration.

RLS errors on write
- Server routes that write use service role client; confirm `SUPABASE_SERVICE_ROLE_KEY` is set.


