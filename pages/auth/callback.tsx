import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error during auth callback:', error)
          // Redirect to home page even if there's an error
          router.replace('/')
          return
        }

        // If we have a session, redirect to the main page
        if (data.session) {
          router.replace('/')
        } else {
          // No session, redirect to home page
          router.replace('/')
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error)
        router.replace('/')
      }
    }

    handleAuthCallback()
  }, [router])

  // Show a loading state while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
          <span className="text-2xl">👨‍👩‍👧‍👦</span>
        </div>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
          Completing your sign up...
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Please wait while we redirect you.
        </p>
      </div>
    </div>
  )
} 