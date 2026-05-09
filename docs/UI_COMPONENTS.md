UI Components

Creator list (AI Chat)
- File: `app/components/sections/CreatorListSection/CreatorListView.tsx`
- Export: `CreatorListViewAI`
- Props
```ts
interface CreatorListViewAIProps {
  promptHash: string
  creators: any[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  prompt: string
  onPageChange: (promptHash: string, newPage: number, pageSize: number) => void
  onToggleSelection: (promptHash: string, creatorId: string) => void
  onToggleExpansion: (promptHash: string, creatorId: string) => void
  onSelectAll: (promptHash: string, creatorIds: string[]) => void
  onSaveSelected: () => void
  isCreatorSelected: (promptHash: string, creatorId: string) => boolean
  isRowExpanded: (promptHash: string, creatorId: string) => boolean
  loadingPages: Set<string>
}
```
- Keys: Use creator `id` (or stable fallback) as React keys to avoid warnings.
- Anatomy: avatar + name/handle, badges (niche/location), metrics (followers/views/engagement/buzz), actions (DM/Email).
- Expanded row: bio, location/platform/email, metrics grid, lightweight AI rationale generated client-side.

Creator list (Discover)
- File: `app/dashboard/discover/CreatorListSection/CreatorListView.tsx`
- Pure presentational grid/rows; click opens expanded overlay elsewhere.

Known pitfalls
- Avatar fallbacks: `transformCreatorData` tries many fields, then `unavatar.io`, then `ui-avatars.com`.
- Overflow: truncate long names/handles; keep metric cells narrow.
- Zebra rows: ensure consistent background in dark mode.

Related
- ./DISCOVER_PAGE.md
- ./AI_CHAT.md


