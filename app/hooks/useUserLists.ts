import { useState, useEffect, useCallback } from 'react'
import { UserList } from '../types/database';

interface UseUserListsProps {
  userId: string
}

interface UseUserListsReturn {
  lists: UserList[]
  isLoading: boolean
  error: string | null
  createList: (name: string, description?: string) => Promise<UserList | null>
  refreshLists: () => Promise<void>
}

export function useUserLists({ userId }: UseUserListsProps): UseUserListsReturn {
  const [lists, setLists] = useState<UserList[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load user lists
  const refreshLists = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/lists?userId=${userId}`)
      const data = await response.json()
      
      if (response.ok) {
        setLists(data.lists)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to load user lists')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Create new list
  const createList = useCallback(async (name: string, description?: string): Promise<UserList | null> => {
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name, description })
      })

      const data = await response.json()

      if (response.ok) {
        await refreshLists()
        return data.list
      } else {
        setError(data.error)
        return null
      }
    } catch (err) {
      setError('Failed to create list')
      return null
    }
  }, [userId, refreshLists])

  // Load initial data
  useEffect(() => {
    refreshLists()
  }, [refreshLists])

  return {
    lists,
    isLoading,
    error,
    createList,
    refreshLists
  }
}