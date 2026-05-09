State Management (Zustand)

Store location
- `app/store/useCreatorState.ts`

Shape
```ts
type CreatorState = {
  selectedCreators: Record<string /* promptHash */, Set<string /* creatorId */>>
  expandedRows: Record<string /* promptHash */, Set<string /* creatorId or 'list' */>>
  pagination: Record<string /* promptHash */, { page: number; totalPages: number; pageSize: number }>

  toggleCreatorSelection(promptHash: string, creatorId: string): void
  selectAllCreators(promptHash: string, creatorIds: string[]): void
  clearCreatorSelection(promptHash: string): void
  toggleRowExpansion(promptHash: string, creatorId: string): void
  setPagination(promptHash: string, page: number, totalPages: number, pageSize: number): void
  clearPromptState(promptHash: string): void
  clearAllState(): void
  collapsePreviousLists(newPromptHash: string): void

  getSelectedCreators(promptHash: string): Set<string>
  getExpandedRows(promptHash: string): Set<string>
  getPagination(promptHash: string): { page: number; totalPages: number; pageSize: number } | null
  isCreatorSelected(promptHash: string, creatorId: string): boolean
  isRowExpanded(promptHash: string, creatorId: string): boolean
}
```

Persistence
- Uses `persist(createJSONStorage(() => sessionStorageAdapter))` to store state in `sessionStorage`.
- Custom adapter serializes `Set` to arrays and rehydrates back to `Set` on load.

Patterns
- Use selector functions from the store (`isCreatorSelected`, `isRowExpanded`) when rendering row lists to reduce re-renders.
- Key all UI state by `promptHash` so each prompt’s list maintains independent selection/expansion/pagination.
- Call `collapsePreviousLists(promptHash)` when a new prompt result arrives to keep the latest list open.

Anti-patterns
- Avoid storing entire creator objects in the store. Store ids only; keep result arrays in component-level state from API responses.
- Do not mutate `Set` instances directly outside the store setters.

Related
- ./AI_CHAT.md


