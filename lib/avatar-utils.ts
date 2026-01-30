import React from 'react'
import { User } from '@supabase/supabase-js'
import { AvatarImage, AvatarFallback } from '../components/ui/avatar'
import { User as UserIcon, Camera, Star, Heart, Crown, Sun, Moon, Flower, LucideIcon } from 'lucide-react'
import { Database } from './supabase'

interface RenderUserAvatarOptions {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fallbackTextSize?: 'xs' | 'sm' | 'md' | 'lg'
}

// Type for profile data from the profiles table
export type ProfileData = Database['public']['Tables']['profiles']['Row']

// Type-safe icon mapping for profile images
type IconName = 'User' | 'Star' | 'Heart' | 'Crown' | 'Sun' | 'Moon' | 'Flower' | 'Camera'
type IconMap = Record<IconName, React.ComponentType<React.SVGProps<SVGSVGElement>>>

// Pre-defined icon map to avoid recreation on every function call
const PROFILE_ICON_MAP: IconMap = {
  'User': UserIcon,
  'Star': Star,
  'Heart': Heart,
  'Crown': Crown,
  'Sun': Sun,
  'Moon': Moon,
  'Flower': Flower,
  'Camera': Camera
} as const

/**
 * Shared utility function for rendering user avatars consistently across the application
 * 
 * Features:
 * - Type-safe icon mapping with proper fallbacks
 * - Performance optimized with pre-defined icon map
 * - Error handling for malformed profile image data
 * - Enhanced accessibility with ARIA labels and roles
 * - Support for Lucide icons, URLs, emojis, and text fallbacks
 * 
 * @param user - The user object containing metadata and profile information
 * @param options - Optional configuration for size, styling, and accessibility
 * @returns React element for the avatar content with proper accessibility attributes
 * 
 * @example
 * // Basic usage
 * renderUserAvatar(user)
 * 
 * // With custom options
 * renderUserAvatar(user, { size: 'lg', fallbackTextSize: 'md' })
 */
export const renderUserAvatar = (user: User, options: RenderUserAvatarOptions = {}): React.ReactElement => {
  const { size = 'md', className = '', fallbackTextSize = 'sm' } = options
  const profileImage = user.user_metadata?.profile_image

  // Icon size mapping
  const iconSizeMap = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  // Emoji text size mapping
  const emojiSizeMap = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  }

  // Fallback text size mapping
  const fallbackSizeMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const iconSize = iconSizeMap[size]
  const emojiSize = emojiSizeMap[size]
  const fallbackSize = fallbackSizeMap[fallbackTextSize]

  if (profileImage) {
    try {
      if (profileImage.startsWith('lucide:')) {
        const iconName = profileImage.replace('lucide:', '').trim()
        
        // Type-safe icon lookup with fallback
        const LucideIcon = PROFILE_ICON_MAP[iconName as IconName] || UserIcon
        
        return React.createElement(LucideIcon, {
          className: `${iconSize} text-primary-foreground ${className}`,
          'aria-label': `Profile icon: ${iconName}`
        })
      } else if (profileImage.startsWith('http')) {
        return React.createElement(AvatarImage, {
          src: profileImage,
          alt: 'User profile picture',
          className: `object-cover ${className}`,
          onError: () => {
            console.warn('Failed to load profile image:', profileImage)
          }
        })
      } else {
        // Emoji - make it bigger and centered with accessibility
        return React.createElement('div', {
          className: `flex items-center justify-center w-full h-full ${className}`,
          role: 'img',
          'aria-label': `Profile emoji: ${profileImage}`
        }, React.createElement('span', {
          className: `${emojiSize} leading-none`,
          'aria-hidden': 'true'
        }, profileImage))
      }
    } catch (error) {
      console.warn('Error rendering profile image:', error)
      // Fall through to default avatar fallback
    }
  }

  // Fallback avatar with enhanced accessibility
  const fallbackText = user.email && user.email.length > 0 ? user.email[0].toUpperCase() : 'U'
  const displayName = user.user_metadata?.display_name || user.email || 'User'
  
  return React.createElement(AvatarFallback, {
    className: `bg-primary text-primary-foreground ${fallbackSize} ${className}`,
    'aria-label': `Avatar for ${displayName}`,
    title: `Avatar for ${displayName}`
  }, fallbackText)
}

/**
 * Render user avatar from profile data (from profiles table)
 * 
 * This function is similar to renderUserAvatar but works with profile data
 * from the profiles table instead of the User object from Supabase Auth.
 * 
 * @param profile - The profile data containing display_name, email, and profile_image
 * @param options - Optional configuration for size, styling, and accessibility
 * @returns React element for the avatar content with proper accessibility attributes
 * 
 * @example
 * // Basic usage
 * renderProfileAvatar(profile)
 * 
 * // With custom options
 * renderProfileAvatar(profile, { size: 'lg', fallbackTextSize: 'md' })
 */
export const renderProfileAvatar = (profile: ProfileData, options: RenderUserAvatarOptions = {}): React.ReactElement => {
  const { size = 'md', className = '', fallbackTextSize = 'sm' } = options
  const profileImage = profile.profile_image

  // Icon size mapping
  const iconSizeMap = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  // Emoji text size mapping
  const emojiSizeMap = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  }

  // Fallback text size mapping
  const fallbackSizeMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const iconSize = iconSizeMap[size]
  const emojiSize = emojiSizeMap[size]
  const fallbackSize = fallbackSizeMap[fallbackTextSize]

  if (profileImage) {
    try {
      if (profileImage.startsWith('lucide:')) {
        const iconName = profileImage.replace('lucide:', '').trim()
        
        // Type-safe icon lookup with fallback
        const LucideIcon = PROFILE_ICON_MAP[iconName as IconName] || UserIcon
        
        return React.createElement(LucideIcon, {
          className: `${iconSize} text-primary-foreground ${className}`,
          'aria-label': `Profile icon: ${iconName}`
        })
      } else if (profileImage.startsWith('http')) {
        return React.createElement(AvatarImage, {
          src: profileImage,
          alt: 'User profile picture',
          className: `object-cover ${className}`,
          onError: () => {
            console.warn('Failed to load profile image:', profileImage)
          }
        })
      } else {
        // Emoji - make it bigger and centered with accessibility
        return React.createElement('div', {
          className: `flex items-center justify-center w-full h-full ${className}`,
          role: 'img',
          'aria-label': `Profile emoji: ${profileImage}`
        }, React.createElement('span', {
          className: `${emojiSize} leading-none`,
          'aria-hidden': 'true'
        }, profileImage))
      }
    } catch (error) {
      console.warn('Error rendering profile image:', error)
      // Fall through to default avatar fallback
    }
  }

  // Fallback avatar with enhanced accessibility
  const fallbackText = profile.email && profile.email.length > 0 ? profile.email[0].toUpperCase() : 'U'
  const displayName = profile.display_name || profile.email || 'User'
  
  return React.createElement(AvatarFallback, {
    className: `bg-primary text-primary-foreground ${fallbackSize} ${className}`,
    'aria-label': `Avatar for ${displayName}`,
    title: `Avatar for ${displayName}`
  }, fallbackText)
} 