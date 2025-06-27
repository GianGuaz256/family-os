import React from 'react'
import { User } from '@supabase/supabase-js'
import { Button } from './button'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { ArrowLeft, LogOut, Settings, Users, Home, LucideIcon, User as UserIcon, Camera } from 'lucide-react'

interface AppHeaderProps {
  user?: User | null
  title?: string
  showBackButton?: boolean
  onBack?: () => void
  onLogout?: () => void
  onManageFamilies?: () => void
  showUserControls?: boolean
  transparent?: boolean
  appIcon?: LucideIcon
  appColor?: string
  appDescription?: string
  viewSwitcher?: React.ReactNode
}

const renderUserAvatar = (user: User) => {
  const profileImage = user.user_metadata?.profile_image
  
  if (profileImage) {
    if (profileImage.startsWith('lucide:')) {
      const iconName = profileImage.replace('lucide:', '')
      const iconMap: { [key: string]: any } = {
        'User': UserIcon,
        'Star': UserIcon,
        'Heart': UserIcon,
        'Crown': UserIcon,
        'Sun': UserIcon,
        'Moon': UserIcon,
        'Flower': UserIcon,
        'Camera': Camera
      }
      const LucideIcon = iconMap[iconName] || UserIcon
      return <LucideIcon className="h-5 w-5 text-primary-foreground" />
    } else if (profileImage.startsWith('http')) {
      return <AvatarImage src={profileImage} alt="Profile picture" className="object-cover" />
    } else {
      // Emoji - make it bigger and centered
      return (
        <div className="flex items-center justify-center w-full h-full">
          <span className="text-lg leading-none">{profileImage}</span>
        </div>
      )
    }
  }
  
  return (
    <AvatarFallback className="bg-primary text-primary-foreground">
      {user.email?.[0].toUpperCase()}
    </AvatarFallback>
  )
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  user,
  title,
  showBackButton = false,
  onBack,
  onLogout,
  onManageFamilies,
  showUserControls = true,
  transparent = false,
  appIcon: AppIcon,
  appColor,
  appDescription,
  viewSwitcher
}) => {
  return (
    <div className={`${transparent ? 'dark:bg-slate-900/80 backdrop-blur-lg border-b rounded-xl border-white/20' : 'bg-background border-b'} sticky top-0 z-50`}>
      <div className="flex items-center justify-between p-4 mx-4">
        {/* Left side - Back button or app info */}
        <div className="flex items-center gap-3">
          {showBackButton && onBack ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <div className="flex items-center gap-3 w-full">
              {/* App Icon and Title */}
              {AppIcon && appColor && title ? (
                <>
                  <div className={`w-12 h-12 bg-gradient-to-br ${appColor} rounded-xl flex items-center justify-center shadow-lg`}>
                    <AppIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">{title}</h1>
                    {appDescription && (
                      <p className="text-sm text-muted-foreground">{appDescription}</p>
                    )}
                  </div>
                </>
              ) : title ? (
                <h1 className="text-lg font-semibold">{title}</h1>
              ) : null}
            </div>
          )}
        </div>
        
        {/* Right side - Controls */}
        <div className="flex items-center gap-2">
          {viewSwitcher && viewSwitcher}
          {user && showUserControls && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Avatar className="h-8 w-8">
                    {renderUserAvatar(user)}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {onManageFamilies && (
                  <DropdownMenuItem onClick={onManageFamilies}>
                    <Users className="mr-2 h-4 w-4" />
                    Manage Families
                  </DropdownMenuItem>
                )}
                {onLogout && (
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  )
} 