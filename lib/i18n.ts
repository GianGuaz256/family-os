import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation resources
import enTranslations from '../locales/en/common.json'
import itTranslations from '../locales/it/common.json'

const resources = {
  en: {
    common: enTranslations,
  },
  it: {
    common: itTranslations,
  },
}

i18n
  // Language detection plugin
  .use(LanguageDetector)
  // React integration
  .use(initReactI18next)
  // Initialize
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common'],
    
    // Language detection options
    detection: {
      // Order of language detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // Keys for localStorage
      lookupLocalStorage: 'familyos-language',
    },
    
    // Whitelist supported languages
    supportedLngs: ['en', 'it'],
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    // Development options
    debug: process.env.NODE_ENV === 'development',
    
    // Consistent key separator
    keySeparator: '.',
    nsSeparator: ':',
  })

export default i18n

// Helper types for TypeScript
export type Language = 'en' | 'it'

export interface LanguageInfo {
  code: Language
  name: string
  nativeName: string
  flag: string
}

export const supportedLanguages: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
  },
]

// Helper functions
export const getCurrentLanguage = (): Language => {
  return (i18n.language as Language) || 'en'
}

export const changeLanguage = async (language: Language): Promise<void> => {
  await i18n.changeLanguage(language)
  localStorage.setItem('familyos-language', language)
}

export const getLanguageInfo = (code: Language): LanguageInfo | undefined => {
  return supportedLanguages.find(lang => lang.code === code)
} 