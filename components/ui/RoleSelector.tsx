import React from 'react'
import { FamilyRole, getAllRoles, getRoleLabel, getRoleDescription, getRoleIcon } from '@/lib/permissions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface RoleSelectorProps {
  value: FamilyRole
  onChange: (role: FamilyRole) => void
  disabled?: boolean
  label?: string
  showDescription?: boolean
  className?: string
}

/**
 * Role selector component for managing family member roles
 * Displays role options with icons and optional descriptions
 */
export const RoleSelector: React.FC<RoleSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  label = 'Role',
  showDescription = false,
  className = ''
}) => {
  const roles = getAllRoles()

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
        </Label>
      )}
      <Select
        value={value}
        onValueChange={(newValue) => onChange(newValue as FamilyRole)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            <span className="flex items-center gap-2">
              <span>{getRoleIcon(value)}</span>
              <span>{getRoleLabel(value)}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role} value={role}>
              <div className="flex items-start gap-2 py-1">
                <span className="text-lg">{getRoleIcon(role)}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{getRoleLabel(role)}</span>
                  {showDescription && (
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {getRoleDescription(role)}
                    </span>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showDescription && (
        <p className="text-xs text-muted-foreground">
          {getRoleDescription(value)}
        </p>
      )}
    </div>
  )
}

interface RoleBadgeProps {
  role: FamilyRole
  showIcon?: boolean
  className?: string
}

/**
 * Role badge component for displaying a user's role
 */
export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  showIcon = true,
  className = ''
}) => {
  const roleColors: Record<FamilyRole, string> = {
    owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    member: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    viewer: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[role]} ${className}`}
    >
      {showIcon && <span>{getRoleIcon(role)}</span>}
      <span>{getRoleLabel(role)}</span>
    </span>
  )
}
