Database

Supabase (Postgres) with pgvector.

Chat tables (from supabase-migration.sql)
- `chat_sessions`
  - `id UUID PK`, `user_id UUID FK auth.users`, `title TEXT`, `subtitle TEXT`, `is_active BOOLEAN DEFAULT true`, `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`
  - Indexes on `user_id`
  - RLS: users can select/insert/update/delete their own rows
- `chat_messages`
  - `id UUID PK`, `chat_session_id UUID FK chat_sessions`, `user_id UUID FK auth.users`, `role TEXT CHECK in ('user','assistant')`, `content TEXT`, `created_at TIMESTAMPTZ DEFAULT now()`
  - Indexes on `chat_session_id`, `user_id`
  - RLS: users can select/insert/update/delete their own rows
- `chat_creator_results`
  - Used by `/api/chat-creator-results`; inferred columns from code: `id UUID PK`, `chat_session_id UUID`, `prompt_hash TEXT`, `prompt TEXT`, `creators_data JSONB`, `total_count INTEGER`, `created_at TIMESTAMPTZ DEFAULT now()`

Semantic index (from supabase-migration-creator-index.sql)
- `creator_index`
  - Identification: `id UUID PK DEFAULT gen_random_uuid()`, `creator_id INTEGER REFERENCES creatordata(id) ON DELETE CASCADE`
  - Creator fields: `handle VARCHAR`, `display_name VARCHAR`, `bio TEXT`, `primary_niche VARCHAR`, `secondary_niche VARCHAR`
  - Metrics: `followers_count INT`, `average_views INT`, `engagement_rate DECIMAL(5,4)`, `buzz_score INT`
  - Content/tags: `hashtags TEXT[]`, changes, `recent_post_captions TEXT`
  - Embeddings: `bio_embedding VECTOR(1536)`, `hashtags_embedding VECTOR(1536)`, `recent_content_embedding VECTOR(1536)`
  - Metadata: `location TEXT`, `location_region TEXT`, `platform TEXT`, `brand_tags TEXT`, `bio_links TEXT`, `email TEXT`, `past_ad_placements TEXT[]`
  - Timestamps: `created_at`, `updated_at` (trigger maintains updated_at)
  - Indexes: btree on common columns; GIN on `hashtags`; ivfflat on vector columns with `vector_cosine_ops (lists=100)`
  - RLS: `SELECT` for authenticated; service role manages all

Migrations
- Apply both SQL files in Supabase SQL editor:
  - `supabase-migration.sql`
  - `supabase-migration-creator-index.sql`

Notes
- `creatordata` is the source table used across the app and by the populate script.
- `creator_index` is a denormalized, search-optimized derivative populated by `scripts/populateCreatorIndex.ts`.

Related
- ./EMBEDDINGS.md
- ./AI_CHAT.md


