Discover Page

Data source
- Uses `creatordata` as the primary table for listing creators on Discover.
- The semantic index (`creator_index`) is used by the AI Recommendations API, not the Discover page listing.

Hook
- Logic in `app/hooks/useCreatorData.ts`:
  - Server-side pagination with Supabase `.range(start, end)`
  - Sorting maps UI fields to DB columns:
    - match_score → buzz_score (proxy)
    - followers → followers_count
    - avg_views → average_views
    - engagement → engagement_rate
  - Filters applied to queries: niches, platforms, followers/engagement/views ranges, locations, and buzz score ranges.

Pagination & performance
- Page size: 24
- Counts use `count: 'planned'` (head-only) for cheaper totals.
- Total counts cached in-memory for 60s by filter hash.
- Pages and metrics cached in `localStorage` for ~5 minutes; first render uses cache instantly to avoid flash.
- Image preloading is deferred using `requestIdleCallback`/`setTimeout(0)`.

UI state persistence
- Current filters, mode, sort, and page are restored from `localStorage`.
- Skeletons render until data is ready; the "No creators found" empty state is suppressed during loading to avoid flicker.

Default ordering
- If no sort chosen, data defaults to `followers_count` descending.

UI parity
- Row layout, badges, and colors align with the AI list visuals (dark mode, zebra striping, muted headers).

Related
- ./CACHING_PERF.md
- ./UI_COMPONENTS.md


