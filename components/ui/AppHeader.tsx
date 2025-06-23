import React from 'react'
import { User } from '@supabase/supabase-js'
import { ThemeSwitcher } from './ThemeSwitcher'
import { Button } from './button'
import { Avatar, AvatarFallback } from './avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { ArrowLeft, LogOut, Settings, Users, Home } from 'lucide-react'

interface AppHeaderProps {
  user?: User | null
  title?: string
  showBackButton?: boolean
  onBack?: () => void
  onLogout?: () => void
  onManageFamilies?: () => void
  showUserControls?: boolean
  transparent?: boolean
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  user,
  title,
  showBackButton = false,
  onBack,
  onLogout,
  onManageFamilies,
  showUserControls = true,
  transparent = false
}) => {
  return (
    <div className={`${transparent ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-white/20' : 'bg-background border-b'} sticky top-0 z-50`}>
      <div className="flex items-center justify-between p-4">
        {/* Left side - Back button or title */}
        <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-2">
              {title && (
                <h1 className="text-lg font-semibold">{title}</h1>
              )}
            </div>
          )}
        </div>
        
        {/* Right side - Controls */}
        <div className="flex items-center gap-2">
          <ThemeSwitcher size="sm" showLabel={false} />
          
          {user && showUserControls && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.email?.[0].toUpperCase()}
                    </AvatarFallback>
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