import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Language, changeLanguage as changeI18nLanguage, getCurrentLanguage, supportedLanguages } from '../lib/i18n'

interface UseLanguageReturn {
  currentLanguage: Language
  supportedLanguages: typeof supportedLanguages
  changeLanguage: (language: Language) => Promise<void>
  isChangingLanguage: boolean
  error: string | null
}

export const useLanguage = (user?: User | null): UseLanguageReturn => {
  const { i18n } = useTranslation()
  const [currentLanguage, setCurrentLanguage] = useState<Language>(getCurrentLanguage())
  const [isChangingLanguage, setIsChangingLanguage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load user's preferred language from database on mount
  useEffect(() => {
    const loadUserLanguage = async () => {
      if (!user?.id) return

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('language')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "not found", which is expected for new users
          console.error('Error loading user language preference:', error)
          return
        }

        if (data?.language && data.language !== currentLanguage) {
          await changeI18nLanguage(data.language as Language)
          setCurrentLanguage(data.language as Language)
        }
      } catch (err) {
        console.error('Error loading user language:', err)
      }
    }

    loadUserLanguage()
  }, [user?.id, currentLanguage])

  // Sync with i18n changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng as Language)
    }

    i18n.on('languageChanged', handleLanguageChange)
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [i18n])

  const changeLanguage = useCallback(
    async (language: Language): Promise<void> => {
      if (language === currentLanguage) return

      setIsChangingLanguage(true)
      setError(null)

      try {
        // Change i18n language
        await changeI18nLanguage(language)
        setCurrentLanguage(language)

        // Save to database if user is logged in
        if (user?.id) {
          const { error } = await supabase
            .from('user_preferences')
            .upsert(
              {
                user_id: user.id,
                language,
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: 'user_id',
              }
            )

          if (error) {
            console.error('Error saving language preference:', error)
            setError('Failed to save language preference')
          }
        }
      } catch (err) {
        console.error('Error changing language:', err)
        setError('Failed to change language')
      } finally {
        setIsChangingLanguage(false)
      }
    },
    [currentLanguage, user?.id]
  )

  return {
    currentLanguage,
    supportedLanguages,
    changeLanguage,
    isChangingLanguage,
    error,
  }
} 