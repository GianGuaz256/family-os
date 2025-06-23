import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { Button } from './button'

interface ThemeSwitcherProps {
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ 
  size = 'md', 
  showLabel = false 
}) => {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const Icon = theme === 'light' ? Sun : Moon
  const label = theme === 'light' ? 'Light' : 'Dark'

  return (
    <Button 
      variant="outline" 
      size={size === 'sm' ? 'sm' : 'default'}
      onClick={toggleTheme}
      className="flex items-center gap-2"
    >
      <Icon className="h-4 w-4" />
      {showLabel && <span>{label}</span>}
    </Button>
  )
} 