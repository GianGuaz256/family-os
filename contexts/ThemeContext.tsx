import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
type ActualTheme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: ActualTheme // The actual theme being applied (can be system)
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// PWA: Dynamic theme colors for safe area
const updatePWAThemeColor = (theme: Theme) => {
  // Get the computed background color from CSS variables for exact matching
  const getBackgroundColor = (): string => {
    // Create a temporary element to compute the actual background color
    const tempEl = document.createElement('div')
    tempEl.style.backgroundColor = 'hsl(var(--background))'
    document.body.appendChild(tempEl)
    const computedColor = getComputedStyle(tempEl).backgroundColor
    document.body.removeChild(tempEl)
    
    // Convert RGB to hex for meta tag
    const rgbMatch = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1])
      const g = parseInt(rgbMatch[2]) 
      const b = parseInt(rgbMatch[3])
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    }
    
    // Fallback to known values if computation fails
    return theme === 'dark' ? '#141414' : '#ffffff'
  }
  
  const themeColor = getBackgroundColor()
  
  // Update theme-color meta tag
  let themeColorMeta = document.querySelector('meta[name="theme-color"]')
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta')
    themeColorMeta.setAttribute('name', 'theme-color')
    document.head.appendChild(themeColorMeta)
  }
  themeColorMeta.setAttribute('content', themeColor)
  
  // Also update apple-mobile-web-app-status-bar-style for iOS
  let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
  if (!statusBarMeta) {
    statusBarMeta = document.createElement('meta')
    statusBarMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style')
    document.head.appendChild(statusBarMeta)
  }
  
  // For dark themes, use 'black-translucent' to make status bar content white
  // For light themes, use 'default' to make status bar content black
  statusBarMeta.setAttribute('content', theme === 'dark' ? 'black-translucent' : 'default')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [actualTheme, setActualTheme] = useState<ActualTheme>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check for saved theme preference in localStorage
    const savedTheme = localStorage.getItem('theme-preference') as Theme
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      // User has a saved preference, use it
      setTheme(savedTheme)
      setActualTheme(savedTheme)
    } else {
      // First time visitor, use system theme but don't save it yet
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setTheme(systemTheme)
      setActualTheme('system')
    }
  }, [])

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    setActualTheme(newTheme)
    // Save user's explicit choice
    localStorage.setItem('theme-preference', newTheme)
  }

  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    let effectiveTheme: Theme
    if (actualTheme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(effectiveTheme)
    } else {
      effectiveTheme = actualTheme
      root.classList.add(actualTheme)
    }
    
    // PWA: Update theme color for safe area
    updatePWAThemeColor(effectiveTheme)
  }, [actualTheme, mounted])

  // Listen for system theme changes when using system theme (first time visitors)
  useEffect(() => {
    if (actualTheme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      const newSystemTheme = mediaQuery.matches ? 'dark' : 'light'
      root.classList.add(newSystemTheme)
      setTheme(newSystemTheme)
      
      // PWA: Update theme color for system theme changes
      updatePWAThemeColor(newSystemTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [actualTheme])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 