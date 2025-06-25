// Central formatting utilities for Family OS
// European locale (it-IT) with EUR as default currency

export interface FormatterConfig {
  locale: string
  timezone: string
  currency: string
  dateStyle: 'short' | 'medium' | 'long' | 'full'
  timeStyle: 'short' | 'medium' | 'long' | 'full'
  use24Hour: boolean
  startOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = Sunday, 1 = Monday
}

// Default European configuration
const DEFAULT_CONFIG: FormatterConfig = {
  locale: 'it-IT', // Italian locale for European formatting
  timezone: 'Europe/Rome',
  currency: 'EUR',
  dateStyle: 'medium',
  timeStyle: 'short',
  use24Hour: true,
  startOfWeek: 1 // Monday
}

// Global configuration - can be overridden by user preferences
let currentConfig: FormatterConfig = { ...DEFAULT_CONFIG }

export const setFormatterConfig = (config: Partial<FormatterConfig>) => {
  currentConfig = { ...currentConfig, ...config }
}

export const getFormatterConfig = (): FormatterConfig => currentConfig

// Date formatting functions
export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString(currentConfig.locale, {
      timeZone: currentConfig.timezone,
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
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleTimeString(currentConfig.locale, {
      timeZone: currentConfig.timezone,
      hour12: !currentConfig.use24Hour,
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
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleString(currentConfig.locale, {
      timeZone: currentConfig.timezone,
      hour12: !currentConfig.use24Hour
    })
  } catch {
    return 'Invalid date/time'
  }
}

// Currency formatting functions
export const formatCurrency = (amount: number, currency?: string): string => {
  try {
    return new Intl.NumberFormat(currentConfig.locale, {
      style: 'currency',
      currency: currency || currentConfig.currency
    }).format(amount)
  } catch {
    return `${currency || currentConfig.currency} ${amount.toFixed(2)}`
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
export const getCalendarLocale = (): string => currentConfig.locale
export const getCalendarStartOfWeek = (): number => currentConfig.startOfWeek

// Default currency for new subscriptions/events
export const getDefaultCurrency = (): string => currentConfig.currency

// Timezone utilities
export const getCurrentTimezone = (): string => currentConfig.timezone

// Date comparison utilities (timezone-aware)
export const isUpcoming = (dateString: string): boolean => {
  try {
    const eventDate = new Date(dateString + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    eventDate.setHours(0, 0, 0, 0)
    return eventDate >= today
  } catch {
    return false
  }
}

export const isPaymentSoon = (dateString: string, daysThreshold: number = 7): boolean => {
  try {
    const paymentDate = new Date(dateString)
    const today = new Date()
    const diffTime = paymentDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= daysThreshold && diffDays >= 0
  } catch {
    return false
  }
}

// Export default configuration for easy access
export { DEFAULT_CONFIG } 