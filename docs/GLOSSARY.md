Glossary

- promptHash: SHA-256 of the user prompt; used to key UI state and persist creator lists to a chat session.
- semantic score: Cosine similarity between query embedding and stored embeddings (weighted across fields).
- metadata score: Heuristic score for platform/location/niche/email/brand/placements matches.
- final score: 0.6 * semantic + 0.4 * metadata (see AI_CHAT.md).
- buzz_score: Aggregate creator metric used for Discover and as a proxy for match sorting in some views.
- RLS: Row-Level Security policies in Postgres.
- ivfflat: Vector index type used by pgvector for ANN search.
- planned count: Supabase count option that returns approximate totals cheaply.


