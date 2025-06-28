import React from 'react'
import { User } from '@supabase/supabase-js'
import { AvatarImage, AvatarFallback } from '../components/ui/avatar'
import { User as UserIcon, Camera, Star, Heart, Crown, Sun, Moon, Flower } from 'lucide-react'

interface RenderUserAvatarOptions {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fallbackTextSize?: 'xs' | 'sm' | 'md' | 'lg'
}

/**
 * Shared utility function for rendering user avatars consistently across the application
 * @param user - The user object containing metadata
 * @param options - Optional configuration for size and styling
 * @returns React element for the avatar content
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
    if (profileImage.startsWith('lucide:')) {
      const iconName = profileImage.replace('lucide:', '')
      const iconMap: { [key: string]: any } = {
        'User': UserIcon,
        'Star': Star,
        'Heart': Heart,
        'Crown': Crown,
        'Sun': Sun,
        'Moon': Moon,
        'Flower': Flower,
        'Camera': Camera
      }
      const LucideIcon = iconMap[iconName] || UserIcon
      return React.createElement(LucideIcon, {
        className: `${iconSize} text-primary-foreground ${className}`
      })
    } else if (profileImage.startsWith('http')) {
      return React.createElement(AvatarImage, {
        src: profileImage,
        alt: 'Profile picture',
        className: `object-cover ${className}`
      })
    } else {
      // Emoji - make it bigger and centered
      return React.createElement('div', {
        className: `flex items-center justify-center w-full h-full ${className}`
      }, React.createElement('span', {
        className: `${emojiSize} leading-none`
      }, profileImage))
    }
  }

  return React.createElement(AvatarFallback, {
    className: `bg-primary text-primary-foreground ${fallbackSize} ${className}`
  }, user.email?.[0].toUpperCase())
} 