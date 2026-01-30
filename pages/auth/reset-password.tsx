import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import { ResetPasswordForm } from '../../components/auth/ResetPasswordForm'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isValidSession, setIsValidSession] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if we have a valid session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error checking session:', error)
          router.replace('/')
          return
        }

        if (session) {
          setIsValidSession(true)
        } else {
          // No session, redirect to home
          router.replace('/')
        }
      } catch (error) {
        console.error('Unexpected error checking session:', error)
        router.replace('/')
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [router])

  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Verifying your reset link...
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Please wait a moment.
          </p>
        </div>
      </div>
    )
  }

  // Show the reset password form if we have a valid session
  if (isValidSession) {
    return <ResetPasswordForm />
  }

  // This shouldn't render, but just in case
  return null
}
