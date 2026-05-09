Embeddings & Indexing

Model
- OpenAI `text-embedding-3-small` with 1536 dimensions.

Environment
```bash
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Populate script
- Location: `scripts/populateCreatorIndex.ts`
- Commands:
```bash
npm run populate-creator-index clear     # empty creator_index
npm run populate-creator-index populate  # process all creators
npm run populate-creator-index reset     # clear + populate

# optional
npm run populate-creator-index populate -- --limit 50
```

What the script does
- Pages through `creatordata`.
- Normalizes platform/location/brand tags; extracts recent captions (post_1..3).
- Calls OpenAI embeddings for: bio, hashtags, recent captions (batched; retries on 429/5xx).
- Inserts or updates rows in `creator_index`.

Reindex workflow
- Schema/data change in `creatordata` → run `reset` or `populate` depending on needs.
- For large datasets, prefer `populate -- --limit <n>` while iterating.

Rate limiting & retries
- Embedding calls use small backoff; batch size ~20, small delays to spread load.

Related
- ./DATABASE.md
- ./AI_CHAT.md


