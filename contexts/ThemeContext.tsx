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
  // Use the actual gradient background colors used throughout the app
  // These match the bg-gradient-to-br from-slate-50 to-slate-100 (light) 
  // and from-slate-900 to-slate-800 (dark) used in the app
  const getAppBackgroundColor = (): string => {
    // Average of the gradient colors used in the app backgrounds
    if (theme === 'dark') {
      // Dark mode: average of slate-900 (#0f172a) and slate-800 (#1e293b)
      return '#172033'
    } else {
      // Light mode: average of slate-50 (#f8fafc) and slate-100 (#f1f5f9) 
      return '#f5f8fb'
    }
  }
  
  const themeColor = getAppBackgroundColor()
  
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