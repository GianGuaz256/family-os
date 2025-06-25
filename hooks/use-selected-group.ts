import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'

interface FamilyGroup {
  id: string
  name: string
  owner_id: string
  invite_code: string
  icon?: string
}

interface UseSelectedGroupReturn {
  selectedGroup: FamilyGroup | null
  setSelectedGroup: (group: FamilyGroup | null) => void
  getStoredGroupId: () => string | null
  clearStoredGroup: () => void
}

export const useSelectedGroup = (user: User | null): UseSelectedGroupReturn => {
  const [selectedGroup, setSelectedGroupState] = useState<FamilyGroup | null>(null)

  // Generate a user-specific storage key for security
  const getStorageKey = useCallback((): string | null => {
    if (!user?.id) return null
    return `family-os-selected-group-${user.id}`
  }, [user?.id])

  // Get stored group ID from localStorage
  const getStoredGroupId = useCallback((): string | null => {
    const storageKey = getStorageKey()
    if (!storageKey) return null

    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored).groupId : null
    } catch (error) {
      console.error('Error reading stored group ID:', error)
      return null
    }
  }, [getStorageKey])

  // Set selected group and persist to localStorage
  const setSelectedGroup = useCallback((group: FamilyGroup | null) => {
    const storageKey = getStorageKey()
    
    setSelectedGroupState(group)
    
    if (!storageKey) return

    try {
      if (group) {
        const dataToStore = {
          groupId: group.id,
          groupName: group.name,
          timestamp: Date.now()
        }
        localStorage.setItem(storageKey, JSON.stringify(dataToStore))
      } else {
        localStorage.removeItem(storageKey)
      }
    } catch (error) {
      console.error('Error storing group selection:', error)
    }
  }, [getStorageKey])

  // Clear stored group selection
  const clearStoredGroup = useCallback(() => {
    const storageKey = getStorageKey()
    if (!storageKey) return

    try {
      localStorage.removeItem(storageKey)
      setSelectedGroupState(null)
    } catch (error) {
      console.error('Error clearing stored group:', error)
    }
  }, [getStorageKey])

  // Clean up old storage entries on user change
  useEffect(() => {
    if (!user) {
      setSelectedGroupState(null)
    }
  }, [user])

  return {
    selectedGroup,
    setSelectedGroup,
    getStoredGroupId,
    clearStoredGroup
  }
} 