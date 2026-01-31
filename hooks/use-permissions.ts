import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  FamilyRole, 
  ResourceBase, 
  PermissionChecker, 
  createPermissionChecker,
  PermissionCheckResult
} from '@/lib/permissions'

export interface UsePermissionsOptions {
  groupId: string | null
  userId: string | null
}

export interface UsePermissionsReturn {
  role: FamilyRole | null
  isOwner: boolean
  isMember: boolean
  isViewer: boolean
  canCreate: boolean
  canModify: (resource: ResourceBase) => PermissionCheckResult
  canDelete: (resource: ResourceBase) => PermissionCheckResult
  canManageMembers: boolean
  canChangeEditMode: boolean
  canManageFamilySettings: boolean
  canInviteMembers: boolean
  canChangeRoles: boolean
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to manage role-based permissions for a user in a family group
 * 
 * @param groupId - The family group ID
 * @param userId - The current user ID
 * @returns Permission checking functions and role information
 */
export const usePermissions = ({ groupId, userId }: UsePermissionsOptions): UsePermissionsReturn => {
  const [role, setRole] = useState<FamilyRole | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Create permission checker instance
  const permissionChecker = createPermissionChecker(role, userId)

  // Fetch user's role in the group
  const fetchRole = async (): Promise<void> => {
    if (!groupId || !userId) {
      setRole(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        console.error('Error fetching user role:', fetchError)
        setError(fetchError.message)
        setRole(null)
        return
      }

      if (data) {
        setRole(data.role as FamilyRole)
      } else {
        setRole(null)
      }
    } catch (err) {
      console.error('Unexpected error fetching role:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setRole(null)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchRole()
  }, [groupId, userId])

  // Subscribe to role changes
  useEffect(() => {
    if (!groupId || !userId) return

    const channel = supabase
      .channel(`group_members:${groupId}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          // Refetch role when group members change
          if (payload.new && 'user_id' in payload.new && payload.new.user_id === userId) {
            fetchRole()
          } else if (payload.old && 'user_id' in payload.old && payload.old.user_id === userId) {
            // User was removed from group
            setRole(null)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, userId])

  return {
    role,
    isOwner: permissionChecker.isOwner(),
    isMember: permissionChecker.isMember(),
    isViewer: permissionChecker.isViewer(),
    canCreate: permissionChecker.canCreate(),
    canModify: (resource: ResourceBase) => permissionChecker.canModify(resource),
    canDelete: (resource: ResourceBase) => permissionChecker.canDelete(resource),
    canManageMembers: permissionChecker.canManageMembers(),
    canChangeEditMode: permissionChecker.canChangeEditMode(),
    canManageFamilySettings: permissionChecker.canManageFamilySettings(),
    canInviteMembers: permissionChecker.canInviteMembers(),
    canChangeRoles: permissionChecker.canChangeRoles(),
    loading,
    error,
    refetch: fetchRole
  }
}
