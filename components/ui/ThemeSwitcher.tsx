import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'

interface ThemeSwitcherProps {
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ 
  size = 'md', 
  showLabel = false 
}) => {
  const { theme, setTheme } = useTheme()

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: null }
  ]

  const currentTheme = themes.find(t => t.value === theme)
  const Icon = currentTheme?.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size === 'sm' ? 'sm' : 'default'}>
          {Icon && <Icon className="h-4 w-4" />}
          {showLabel && <span>{currentTheme?.label}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((themeOption) => {
          const ThemeIcon = themeOption.icon
          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value as 'light' | 'dark' | 'system')}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {ThemeIcon && <ThemeIcon className="h-4 w-4" />}
                <span>{themeOption.label}</span>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 