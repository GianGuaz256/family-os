// Permission types and utilities for RBAC system

// Role types
export type FamilyRole = 'owner' | 'member' | 'viewer'

// Resource interface with tracking fields
export interface ResourceBase {
  created_by: string | null
  edit_mode: 'private' | 'public'
  updated_by?: string | null
  updated_at?: string
}

// Permission check result
export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
}

// Role display names and descriptions
export const ROLE_INFO: Record<FamilyRole, { label: string; description: string; icon: string }> = {
  owner: {
    label: 'Owner',
    description: 'Full control over family and all resources',
    icon: '👑'
  },
  member: {
    label: 'Member',
    description: 'Can create and modify own resources and public resources',
    icon: '👤'
  },
  viewer: {
    label: 'Viewer',
    description: 'Can only view resources',
    icon: '👁️'
  }
}

// Permission checker class
export class PermissionChecker {
  constructor(
    private role: FamilyRole | null,
    private userId: string | null
  ) {}

  // Check if user can create resources
  canCreate(): boolean {
    return this.role === 'owner' || this.role === 'member'
  }

  // Check if user can modify a resource
  canModify(resource: ResourceBase): PermissionCheckResult {
    if (!this.role || !this.userId) {
      return { allowed: false, reason: 'Not authenticated' }
    }

    // Owner can modify everything
    if (this.role === 'owner') {
      return { allowed: true }
    }

    // Viewer cannot modify anything
    if (this.role === 'viewer') {
      return { allowed: false, reason: 'Viewers cannot modify resources' }
    }

    // Member can modify own resources or public resources
    if (this.role === 'member') {
      const isCreator = resource.created_by === this.userId
      const isPublic = resource.edit_mode === 'public'

      if (isCreator) {
        return { allowed: true }
      }

      if (isPublic) {
        return { allowed: true }
      }

      return { 
        allowed: false, 
        reason: 'This resource is private and can only be modified by the owner' 
      }
    }

    return { allowed: false, reason: 'Invalid role' }
  }

  // Check if user can delete a resource
  canDelete(resource: ResourceBase): PermissionCheckResult {
    if (!this.role || !this.userId) {
      return { allowed: false, reason: 'Not authenticated' }
    }

    // Owner can delete everything
    if (this.role === 'owner') {
      return { allowed: true }
    }

    // Viewer cannot delete anything
    if (this.role === 'viewer') {
      return { allowed: false, reason: 'Viewers cannot delete resources' }
    }

    // Member can delete only their own resources
    if (this.role === 'member') {
      const isCreator = resource.created_by === this.userId
      
      if (isCreator) {
        return { allowed: true }
      }

      return { 
        allowed: false, 
        reason: 'You can only delete resources you created' 
      }
    }

    return { allowed: false, reason: 'Invalid role' }
  }

  // Check if user can change edit mode (private/public)
  canChangeEditMode(): boolean {
    return this.role === 'owner'
  }

  // Check if user can manage family members
  canManageMembers(): boolean {
    return this.role === 'owner'
  }

  // Check if user can manage family settings
  canManageFamilySettings(): boolean {
    return this.role === 'owner'
  }

  // Check if user can invite new members
  canInviteMembers(): boolean {
    return this.role === 'owner'
  }

  // Check if user can change member roles
  canChangeRoles(): boolean {
    return this.role === 'owner'
  }

  // Check if user is owner
  isOwner(): boolean {
    return this.role === 'owner'
  }

  // Check if user is member
  isMember(): boolean {
    return this.role === 'member'
  }

  // Check if user is viewer
  isViewer(): boolean {
    return this.role === 'viewer'
  }

  // Get role
  getRole(): FamilyRole | null {
    return this.role
  }
}

// Helper function to create permission checker
export const createPermissionChecker = (
  role: FamilyRole | null,
  userId: string | null
): PermissionChecker => {
  return new PermissionChecker(role, userId)
}

// Helper function to check if a role has higher priority than another
export const hasHigherOrEqualRole = (role: FamilyRole, targetRole: FamilyRole): boolean => {
  const rolePriority: Record<FamilyRole, number> = {
    owner: 3,
    member: 2,
    viewer: 1
  }

  return rolePriority[role] >= rolePriority[targetRole]
}

// Helper function to get all available roles
export const getAllRoles = (): FamilyRole[] => {
  return ['owner', 'member', 'viewer']
}

// Helper function to validate role
export const isValidRole = (role: string): role is FamilyRole => {
  return ['owner', 'member', 'viewer'].includes(role)
}

// Helper function to get role label
export const getRoleLabel = (role: FamilyRole): string => {
  return ROLE_INFO[role].label
}

// Helper function to get role description
export const getRoleDescription = (role: FamilyRole): string => {
  return ROLE_INFO[role].description
}

// Helper function to get role icon
export const getRoleIcon = (role: FamilyRole): string => {
  return ROLE_INFO[role].icon
}
