import React from 'react'
import { User } from '@supabase/supabase-js'
import { Button } from './button'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { ThemeSwitcher } from './ThemeSwitcher'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { 
  Home, 
  Settings, 
  LogOut, 
  User as UserIcon, 
  Shield,
  Plus,
  ArrowLeft
} from 'lucide-react'

interface ContextualAction {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  variant?: 'default' | 'secondary'
  disabled?: boolean
}

interface BottomActionsProps {
  user: User
  onHome?: () => void
  onSettings?: () => void
  onProfile?: () => void
  onLogout: () => void
  onManageFamilies?: () => void
  contextualActions?: ContextualAction[]
  className?: string
  isHome?: boolean
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
        'Camera': UserIcon
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
    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
      {user.email?.[0].toUpperCase()}
    </AvatarFallback>
  )
}

export const BottomActions: React.FC<BottomActionsProps> = ({
  user,
  onHome,
  onSettings,
  onProfile,
  onLogout,
  onManageFamilies,
  contextualActions = [],
  className = '',
  isHome = false
}) => {
  return (
    <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 ${className}`}>
      <div className="flex items-center gap-4 bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/40 dark:border-white/20 rounded-full px-6 py-3 shadow-2xl shadow-black/10 dark:shadow-black/30 relative overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
        {/* Glassmorphism background overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 dark:from-white/5 dark:via-white/2 dark:to-white/5 rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent dark:from-white/5 dark:to-transparent rounded-full" />
        
        {/* Content with relative positioning to appear above overlays */}
        <div className="flex items-center gap-4 relative z-10">
          {/* Left Section - Home/Back Button */}
          <Button
            variant={isHome ? "default" : "ghost"}
            size="icon"
            className="rounded-full w-10 h-10 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 border border-white/30 dark:border-white/20 backdrop-blur-sm"
            onClick={onHome}
            disabled={isHome}
          >
            {isHome ? <Home className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </Button>
          
          {/* Center Section - Theme and Profile */}
          <div className="bg-white/20 dark:bg-white/10 rounded-full p-1 border border-white/30 dark:border-white/20 backdrop-blur-sm">
            <ThemeSwitcher size="sm" showLabel={false} />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 border border-white/30 dark:border-white/20 backdrop-blur-sm">
                <Avatar className="h-8 w-8">
                  {renderUserAvatar(user)}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="mb-4 w-56 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-white/10">
              <DropdownMenuLabel className="text-xs">
                <div className="flex items-center space-x-3 p-2">
                  <Avatar className="h-10 w-10">
                    {user.user_metadata?.profile_image ? (
                      user.user_metadata.profile_image.startsWith('http') ? (
                        <AvatarImage src={user.user_metadata.profile_image} alt="Profile picture" className="object-cover" />
                      ) : user.user_metadata.profile_image.startsWith('lucide:') ? (
                        <div className="flex items-center justify-center w-full h-full bg-primary text-primary-foreground">
                          <UserIcon className="h-6 w-6" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-primary text-primary-foreground">
                          <span className="text-xl leading-none">{user.user_metadata.profile_image}</span>
                        </div>
                      )
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {user.email?.[0].toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.user_metadata?.display_name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {onProfile && (
                <DropdownMenuItem onClick={onProfile} className="text-sm">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
              )}
              
              {onSettings && (
                <DropdownMenuItem onClick={onSettings} className="text-sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              )}
              
              {onManageFamilies && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onManageFamilies} className="text-sm">
                    <Shield className="mr-2 h-4 w-4" />
                    Manage Families
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-sm text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Right Section - Contextual Actions */}
          {contextualActions.length > 0 && (
            <>
              {/* Separator if there are contextual actions */}
              <div className="w-px h-6 bg-white/30 dark:bg-white/20" />
              
              {/* Contextual Actions */}
              {contextualActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'default'}
                  size="icon"
                  className="rounded-full w-10 h-10 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 border border-white/30 dark:border-white/20 backdrop-blur-sm"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  title={action.label}
                >
                  <action.icon className="h-5 w-5" />
                </Button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
} 