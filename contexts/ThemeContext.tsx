import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
type ActualTheme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: ActualTheme // The actual theme being applied (can be system)
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

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

    if (actualTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(actualTheme)
    }
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