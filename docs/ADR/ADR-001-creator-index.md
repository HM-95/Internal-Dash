ADR-001: Creator Semantic Index

Context
We need fast, relevant creator recommendations from natural-language prompts. The base table `creatordata` is not optimized for ANN search or hybrid ranking.

Decision
- Create a denormalized `creator_index` table with:
  - Normalized metadata (platform, location, location_region, niches, tags, email, placements)
  - Embeddings for bio, hashtags, and recent post captions using OpenAI `text-embedding-3-small` (1536 dims)
  - Vector indexes (ivfflat, cosine)
  - Btree/GiST/GIN indexes for common filters
- Populate/maintain via `scripts/populateCreatorIndex.ts`.
- Hybrid ranking combines semantic similarity and metadata relevance.

Alternatives considered
1) Pure SQL + trigram/ILIKE searches
   - Pros: simpler infra; no external costs
   - Cons: lower recall/precision for semantic intent; brittle to vocabulary
2) On-the-fly embedding search over `creatordata`
   - Pros: fewer moving pieces
   - Cons: no vector fields/indexes; slow at scale; harder to tune

Consequences
- Requires OpenAI API key and costs for embedding generation.
- Additional storage for vectors and indexes.
- Clear path for richer scoring features without impacting Discover page performance.

Future work
- Add audience overlap / lookalike features using cross-creator similarity.
- Periodic re-embedding workflow for changed bios or recent posts.


