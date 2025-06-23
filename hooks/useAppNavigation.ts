import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export const useAppNavigation = () => {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      // The auth state change will be handled by _app.tsx
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  const goToFamilyManagement = () => {
    router.push('/?view=families')
  }

  const goToDashboard = () => {
    router.push('/')
  }

  return {
    handleLogout,
    handleBack,
    goToFamilyManagement,
    goToDashboard,
    router
  }
} 