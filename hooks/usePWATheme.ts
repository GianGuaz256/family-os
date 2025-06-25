import { useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'

/**
 * Hook to manage PWA theme colors and ensure proper safe area handling
 * This hook automatically updates PWA theme colors when the theme changes
 */
export const usePWATheme = () => {
  const { theme } = useTheme()

  useEffect(() => {
    // Verify theme color meta tag is present and correct
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    
    if (themeColorMeta && statusBarMeta) {
      // Get actual computed background color for comparison
      const tempEl = document.createElement('div')
      tempEl.style.backgroundColor = 'hsl(var(--background))'
      document.body.appendChild(tempEl)
      const computedBgColor = getComputedStyle(tempEl).backgroundColor
      document.body.removeChild(tempEl)
      
      const expectedStatusBar = theme === 'dark' ? 'black-translucent' : 'default'
      
      // Log for debugging (remove in production)
      console.log('PWA Theme Update:', {
        theme,
        cssBackground: `hsl(var(--background))`,
        computedBackground: computedBgColor,
        actualThemeColor: themeColorMeta.getAttribute('content'),
        statusBarStyle: statusBarMeta.getAttribute('content'),
        expectedStatusBar
      })
    }
  }, [theme])

  return { theme }
}

/**
 * Utility function to manually update PWA theme colors
 * Useful for testing or manual theme changes
 */
export const updatePWAThemeColor = (theme: 'light' | 'dark') => {
  // Get the actual computed background color from CSS variables
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
  const statusBarStyle = theme === 'dark' ? 'black-translucent' : 'default'
  
  // Update theme-color meta tag
  let themeColorMeta = document.querySelector('meta[name="theme-color"]')
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', themeColor)
  }
  
  // Update status bar style
  let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
  if (statusBarMeta) {
    statusBarMeta.setAttribute('content', statusBarStyle)
  }
  
  return { themeColor, statusBarStyle }
} 