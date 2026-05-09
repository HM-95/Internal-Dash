Caching & Performance

Prompt-hash cache (AI Chat)
- Each prompt gets a SHA-256 `promptHash`.
- UI state (selected creators, expanded rows, pagination) is keyed by `promptHash` and persisted via Zustand in `sessionStorage`.

Discover page cache
- Pages (creators arrays) and metrics are cached in `localStorage` for ~5 minutes.
- Total counts are cached in-memory by filter hash for 60s.
- If a cached page exists, the hook renders it immediately and fetches fresh data in the background (avoids empty flashes).

Count queries
- Use Supabase `count: 'planned'` to get approximate counts cheaply.

Pagination strategy
- Server-side `.range(start, end)` queries to `creatordata`.
- Sorting is done at DB level; a few cases (e.g. AI-mode `match_score`) are sorted client-side after synthetic computation.

Image loading
- Thumbnails are processed for display without preloading to improve initial loading performance.

Tuning knobs
- TTLs for page/metrics cache.
- SAMPLE_SIZE for metrics sampling (250 by default).
- Batch sizes and delays in the populate script.

Related
- ./DISCOVER_PAGE.md
- ./STATE.md


