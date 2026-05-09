import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Custom storage adapter that handles Set serialization
const sessionStorageAdapter = {
  getItem: (name: string) => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
        return null
      }
      
      const item = sessionStorage.getItem(name)
      if (!item) return null
      const parsed = JSON.parse(item)
      if (parsed.state) {
        if (parsed.state.selectedCreators) {
          Object.keys(parsed.state.selectedCreators).forEach(key => {
            if (Array.isArray(parsed.state.selectedCreators[key])) {
              parsed.state.selectedCreators[key] = new Set(parsed.state.selectedCreators[key])
            }
          })
        }
        if (parsed.state.expandedRows) {
          Object.keys(parsed.state.expandedRows).forEach(key => {
            if (Array.isArray(parsed.state.expandedRows[key])) {
              parsed.state.expandedRows[key] = new Set(parsed.state.expandedRows[key])
            }
          })
        }
      }
      return item
    } catch (error) {
      console.error('Error reading from sessionStorage:', error)
      return null
    }
  },
  setItem: (name: string, value: string) => {
    try {
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(name, value)
      }
    } catch (error) {
      console.error('Error writing to sessionStorage:', error)
    }
  },
  removeItem: (name: string) => {
    try {
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(name)
      }
    } catch (error) {
      console.error('Error removing from sessionStorage:', error)
    }
  }
}

interface CreatorState {
  // State structure keyed by promptHash
  selectedCreators: Record<string, Set<string>>
  expandedRows: Record<string, Set<string>>
  pagination: Record<string, { page: number; totalPages: number; pageSize: number }>
  
  // Actions
  toggleCreatorSelection: (promptHash: string, creatorId: string) => void
  selectAllCreators: (promptHash: string, creatorIds: string[]) => void
  clearCreatorSelection: (promptHash: string) => void
  toggleRowExpansion: (promptHash: string, creatorId: string) => void
  setPagination: (promptHash: string, page: number, totalPages: number, pageSize: number) => void
  clearPromptState: (promptHash: string) => void
  clearAllState: () => void
  collapsePreviousLists: (newPromptHash: string) => void
  
  // Getters
  getSelectedCreators: (promptHash: string) => Set<string>
  getExpandedRows: (promptHash: string) => Set<string>
  getPagination: (promptHash: string) => { page: number; totalPages: number; pageSize: number } | null
  isCreatorSelected: (promptHash: string, creatorId: string) => boolean
  isRowExpanded: (promptHash: string, creatorId: string) => boolean
}

// Helper functions for Set serialization
const setToArray = (set: Set<string>): string[] => Array.from(set)
const arrayToSet = (arr: string[]): Set<string> => new Set(arr)

export const useCreatorState = create<CreatorState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedCreators: {},
      expandedRows: {},
      pagination: {},
      
      // Actions
      toggleCreatorSelection: (promptHash: string, creatorId: string) => {
        set((state) => {
          const currentSelected = state.selectedCreators[promptHash] || new Set()
          const newSelected = new Set(currentSelected)
          
          if (newSelected.has(creatorId)) {
            newSelected.delete(creatorId)
          } else {
            newSelected.add(creatorId)
          }
          
          return {
            selectedCreators: {
              ...state.selectedCreators,
              [promptHash]: newSelected
            }
          }
        })
      },
      
      selectAllCreators: (promptHash: string, creatorIds: string[]) => {
        set((state) => {
          const currentSelected = state.selectedCreators[promptHash] || new Set()
          const newSelected = new Set(currentSelected)
          
          // If all are selected, deselect all. Otherwise, select all.
          const allSelected = creatorIds.every(id => newSelected.has(id))
          
          if (allSelected) {
            creatorIds.forEach(id => newSelected.delete(id))
          } else {
            creatorIds.forEach(id => newSelected.add(id))
          }
          
          return {
            selectedCreators: {
              ...state.selectedCreators,
              [promptHash]: newSelected
            }
          }
        })
      },
      
      clearCreatorSelection: (promptHash: string) => {
        set((state) => ({
          selectedCreators: {
            ...state.selectedCreators,
            [promptHash]: new Set()
          }
        }))
      },
      
      toggleRowExpansion: (promptHash: string, creatorId: string) => {
        set((state) => {
          const currentExpanded = state.expandedRows[promptHash]
          let newExpanded: Set<string>
          
          if (currentExpanded instanceof Set) {
            newExpanded = new Set(currentExpanded)
          } else if (Array.isArray(currentExpanded)) {
            newExpanded = new Set(currentExpanded)
          } else {
            newExpanded = new Set()
          }
          
          if (newExpanded.has(creatorId)) {
            newExpanded.delete(creatorId)
          } else {
            newExpanded.add(creatorId)
          }
          
          return {
            expandedRows: {
              ...state.expandedRows,
              [promptHash]: newExpanded
            }
          }
        })
      },
      
      setPagination: (promptHash: string, page: number, totalPages: number, pageSize: number) => {
        set((state) => ({
          pagination: {
            ...state.pagination,
            [promptHash]: { page, totalPages, pageSize }
          }
        }))
      },
      
      clearPromptState: (promptHash: string) => {
        set((state) => {
          const newState = { ...state }
          delete newState.selectedCreators[promptHash]
          delete newState.expandedRows[promptHash]
          delete newState.pagination[promptHash]
          return newState
        })
      },
      
      clearAllState: () => {
        set({
          selectedCreators: {},
          expandedRows: {},
          pagination: {}
        })
      },
      
      // Collapse all previous expanded rows when new prompt is added
      collapsePreviousLists: (newPromptHash: string) => {
        set((state) => {
          const newExpandedRows: Record<string, Set<string>> = {}
          // Only keep expanded rows for the new prompt hash, and ensure the list itself is expanded
          newExpandedRows[newPromptHash] = new Set(['list']) // 'list' key for list-level expansion
          return { expandedRows: newExpandedRows }
        })
      },
      
      // Getters
      getSelectedCreators: (promptHash: string) => {
        const selected = get().selectedCreators[promptHash]
        return selected instanceof Set ? selected : new Set()
      },
      
      getExpandedRows: (promptHash: string) => {
        const expanded = get().expandedRows[promptHash]
        return expanded instanceof Set ? expanded : new Set()
      },
      
      getPagination: (promptHash: string) => {
        return get().pagination[promptHash] || null
      },
      
      isCreatorSelected: (promptHash: string, creatorId: string) => {
        const selected = get().selectedCreators[promptHash]
        if (!selected || !(selected instanceof Set)) return false
        return selected.has(creatorId)
      },
      
      isRowExpanded: (promptHash: string, creatorId: string) => {
        const expanded = get().expandedRows[promptHash]
        if (!expanded || !(expanded instanceof Set)) return false
        return expanded.has(creatorId)
      }
    }),
    {
      name: 'buzzberry-creator-state',
      storage: createJSONStorage(() => sessionStorageAdapter),
      partialize: (state) => ({
        selectedCreators: Object.fromEntries(
          Object.entries(state.selectedCreators).map(([key, set]) => [key, setToArray(set)])
        ),
        expandedRows: Object.fromEntries(
          Object.entries(state.expandedRows).map(([key, set]) => [key, setToArray(set)])
        ),
        pagination: state.pagination
      })
    }
  )
) 