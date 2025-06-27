// Central formatting utilities for Family OS
// Locale-aware formatting based on user language

export interface FormatterConfig {
  locale: string
  timezone: string
  currency: string
  dateStyle: 'short' | 'medium' | 'long' | 'full'
  timeStyle: 'short' | 'medium' | 'long' | 'full'
  use24Hour: boolean
  startOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = Sunday, 1 = Monday
}

// Default configuration - will be overridden by user preferences
const DEFAULT_CONFIG: FormatterConfig = {
  locale: 'en-US',
  timezone: 'America/New_York',
  currency: 'USD',
  dateStyle: 'medium',
  timeStyle: 'short',
  use24Hour: false,
  startOfWeek: 0 // Sunday
}

// Global configuration - can be overridden by user preferences
let currentConfig: FormatterConfig = { ...DEFAULT_CONFIG }

// Get current language from i18n if available
const getCurrentLanguage = (): string => {
  if (typeof window !== 'undefined') {
    // Try to get from i18n first
    try {
      const i18nInstance = (window as any).i18n
      if (i18nInstance?.language) {
        return i18nInstance.language
      }
    } catch {}
    
    // Fallback to localStorage
    const savedLanguage = localStorage.getItem('familyos-language')
    if (savedLanguage) return savedLanguage
    
    // Fallback to browser language
    return navigator.language || 'en-US'
  }
  return 'en-US'
}

// Update locale mapping based on language
const getLocaleFromLanguage = (language: string): FormatterConfig => {
  const baseConfig = { ...DEFAULT_CONFIG }
  
  switch (language) {
    case 'it':
    case 'it-IT':
      return {
        ...baseConfig,
        locale: 'it-IT',
        timezone: 'Europe/Rome',
        currency: 'EUR',
        use24Hour: true,
        startOfWeek: 1 // Monday
      }
    case 'en':
    case 'en-US':
    default:
      return {
        ...baseConfig,
        locale: 'en-US',
        timezone: 'America/New_York',
        currency: 'USD',
        use24Hour: false,
        startOfWeek: 0 // Sunday
      }
  }
}

export const setFormatterConfig = (config: Partial<FormatterConfig>) => {
  currentConfig = { ...currentConfig, ...config }
}

export const getFormatterConfig = (): FormatterConfig => {
  // Auto-update based on current language
  const currentLanguage = getCurrentLanguage()
  const languageConfig = getLocaleFromLanguage(currentLanguage)
  return { ...languageConfig, ...currentConfig }
}

// Get effective config (with language detection)
const getEffectiveConfig = (): FormatterConfig => {
  const currentLanguage = getCurrentLanguage()
  const languageConfig = getLocaleFromLanguage(currentLanguage)
  return { ...languageConfig, ...currentConfig }
}

// Date formatting functions
export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  try {
    const config = getEffectiveConfig()
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString(config.locale, {
      timeZone: config.timezone,
      ...options
    })
  } catch {
    return 'Invalid date'
  }
}

export const formatDateLong = (date: Date | string): string => {
  return formatDate(date, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const formatDateShort = (date: Date | string): string => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatDateCompact = (date: Date | string): string => {
  return formatDate(date, {
    month: 'short',
    day: 'numeric'
  })
}

// Time formatting functions
export const formatTime = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  try {
    const config = getEffectiveConfig()
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleTimeString(config.locale, {
      timeZone: config.timezone,
      hour12: !config.use24Hour,
      ...options
    })
  } catch {
    return 'Invalid time'
  }
}

export const formatTimeShort = (date: Date | string): string => {
  return formatTime(date, {
    hour: 'numeric',
    minute: '2-digit'
  })
}

export const formatDateTime = (date: Date | string): string => {
  try {
    const config = getEffectiveConfig()
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleString(config.locale, {
      timeZone: config.timezone,
      hour12: !config.use24Hour
    })
  } catch {
    return 'Invalid date/time'
  }
}

// Currency formatting functions
export const formatCurrency = (amount: number, currency?: string): string => {
  const config = getEffectiveConfig()
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currency || config.currency
    }).format(amount)
  } catch {
    return `${currency || config.currency} ${amount.toFixed(2)}`
  }
}

// Utility for input fields (YYYY-MM-DD format)
export const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Utility for time inputs (HH:MM format)
export const formatTimeForInput = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// Calendar specific utilities
export const getCalendarLocale = (): string => getEffectiveConfig().locale
export const getCalendarStartOfWeek = (): number => getEffectiveConfig().startOfWeek

// Default currency for new subscriptions/events
export const getDefaultCurrency = (): string => getEffectiveConfig().currency

// Timezone utilities
export const getCurrentTimezone = (): string => getEffectiveConfig().timezone

// Date comparison utilities (timezone-aware)
export const isUpcoming = (dateString: string): boolean => {
  try {
    // Parse the date string and create UTC dates for consistent comparison
    const eventDate = new Date(dateString + 'T00:00:00')
    const today = new Date()
    
    // Set both dates to UTC midnight for consistent comparison across timezones
    const eventUTC = new Date(Date.UTC(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate(),
      0, 0, 0, 0
    ))
    
    const todayUTC = new Date(Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0, 0, 0, 0
    ))
    
    return eventUTC >= todayUTC
  } catch {
    return false
  }
}

export const isPaymentSoon = (dateString: string, daysThreshold: number = 7): boolean => {
  try {
    const paymentDate = new Date(dateString)
    const today = new Date()
    
    // Create UTC dates for consistent comparison across timezones
    const paymentUTC = new Date(Date.UTC(
      paymentDate.getFullYear(),
      paymentDate.getMonth(),
      paymentDate.getDate(),
      0, 0, 0, 0
    ))
    
    const todayUTC = new Date(Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0, 0, 0, 0
    ))
    
    const diffTime = paymentUTC.getTime() - todayUTC.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= daysThreshold && diffDays >= 0
  } catch {
    return false
  }
}

// Export default configuration for easy access
export { DEFAULT_CONFIG } 