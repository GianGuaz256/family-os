import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash/query params
        // This automatically exchanges the code for a session
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error during auth callback:', error)
          setVerificationStatus('error')
          setErrorMessage(error.message)
          // Redirect to home page after a delay
          setTimeout(() => {
            router.replace('/')
          }, 3000)
          return
        }

        // If we have a session, the email verification was successful
        if (data.session) {
          setVerificationStatus('success')
          // Give user time to see success message before redirecting
          setTimeout(() => {
            router.replace('/')
          }, 2000)
        } else {
          // No session, but no error - just redirect
          router.replace('/')
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error)
        setVerificationStatus('error')
        setErrorMessage('An unexpected error occurred')
        setTimeout(() => {
          router.replace('/')
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [router])

  // Show a loading/success/error state while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center">
        {verificationStatus === 'verifying' && (
          <>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
              <span className="text-2xl">👨‍👩‍👧‍👦</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Verifying your email...
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Please wait while we confirm your account.
            </p>
          </>
        )}
        
        {verificationStatus === 'success' && (
          <>
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Email verified successfully!
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Redirecting you to the app...
            </p>
          </>
        )}
        
        {verificationStatus === 'error' && (
          <>
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-2xl">✕</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Verification failed
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {errorMessage || 'There was an error verifying your email.'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Redirecting to login...
            </p>
          </>
        )}
      </div>
    </div>
  )
} 