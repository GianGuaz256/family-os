import React from 'react'
import { Lock, Unlock } from 'lucide-react'
import { Switch } from './switch'
import { Label } from './label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip'

interface LockToggleProps {
  editMode: 'private' | 'public'
  onChange: (mode: 'private' | 'public') => void
  disabled?: boolean
  label?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  tooltipText?: string
}

/**
 * Edit mode toggle component for controlling resource edit mode
 * Only owners can change edit mode (private/public)
 */
export const LockToggle: React.FC<LockToggleProps> = ({
  editMode,
  onChange,
  disabled = false,
  label,
  showLabel = true,
  size = 'md',
  className = '',
  tooltipText
}) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 18
  }

  const isPrivate = editMode === 'private'
  const displayLabel = label || (isPrivate ? 'Private' : 'Public')
  const defaultTooltip = isPrivate
    ? 'This resource is private. Only the owner can modify it.'
    : 'This resource is public. Members can modify it.'

  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <Switch
        checked={isPrivate}
        onCheckedChange={(checked) => onChange(checked ? 'private' : 'public')}
        disabled={disabled}
        aria-label={displayLabel}
      />
      {isPrivate ? (
        <Lock
          size={iconSize[size]}
          className="text-orange-500 dark:text-orange-400"
        />
      ) : (
        <Unlock
          size={iconSize[size]}
          className="text-green-500 dark:text-green-400"
        />
      )}
      {showLabel && (
        <Label
          className={`cursor-pointer ${sizeClasses[size]} ${
            disabled ? 'opacity-50' : ''
          }`}
        >
          {displayLabel}
        </Label>
      )}
    </div>
  )

  // Only use tooltip if explicitly requested and no label is shown
  if (tooltipText && !showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              {content}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}

interface LockIconProps {
  editMode: 'private' | 'public'
  size?: number
  className?: string
  showTooltip?: boolean
}

/**
 * Simple lock icon component for displaying edit mode status
 */
export const LockIcon: React.FC<LockIconProps> = ({
  editMode,
  size = 16,
  className = '',
  showTooltip = true
}) => {
  const isPrivate = editMode === 'private'
  const icon = isPrivate ? (
    <Lock
      size={size}
      className={`text-orange-500 dark:text-orange-400 ${className}`}
    />
  ) : (
    <Unlock
      size={size}
      className={`text-green-500 dark:text-green-400 ${className}`}
    />
  )

  if (!showTooltip) {
    return icon
  }

  const tooltipText = isPrivate
    ? 'Private - Only owner can modify'
    : 'Public - Members can modify'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{icon}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
