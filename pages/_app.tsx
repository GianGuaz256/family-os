import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'
import { ThemeProvider } from '../contexts/ThemeContext'
import { Toaster } from 'sonner'
import '../lib/i18n' // Initialize i18n
import '../styles/globals.css'

// PWA: Install prompt interface
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function App({ Component, pageProps }: AppProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // PWA: Install prompt state
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  
  // PWA: Network status
  const [isOnline, setIsOnline] = useState(true)
  const [showNetworkStatus, setShowNetworkStatus] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // PWA: Register service worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration)
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, refresh to update
                  if (confirm('New version available! Refresh to update?')) {
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }

    // PWA: Install prompt handling
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    const handleAppInstalled = () => {
      setInstallPrompt(null)
      setShowInstallPrompt(false)
      console.log('PWA was installed')
    }

    // PWA: Network status monitoring
    const handleOnline = () => {
      setIsOnline(true)
      setShowNetworkStatus(true)
      setTimeout(() => setShowNetworkStatus(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowNetworkStatus(true)
    }

    // PWA: Event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // PWA: Initial network status
    setIsOnline(navigator.onLine)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // PWA: Handle install prompt
  const handleInstallClick = async () => {
    if (!installPrompt) return

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }
      
      setInstallPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error('Error during install prompt:', error)
    }
  }

  const handleInstallDismiss = () => {
    setShowInstallPrompt(false)
    // Hide for this session
    setTimeout(() => {
      setInstallPrompt(null)
    }, 24 * 60 * 60 * 1000) // Show again after 24 hours
  }

  return (
    <ThemeProvider>
      {/* Toast Notifications */}
      <Toaster 
        position="top-center" 
        richColors 
        closeButton
        toastOptions={{
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
      
      {/* PWA: Network Status Indicator */}
      {showNetworkStatus && (
        <div className={`network-status ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? '🟢 Back online' : '🔴 You are offline'}
        </div>
      )}
      
      {/* PWA: Install Prompt */}
      {showInstallPrompt && installPrompt && (
        <div className="install-prompt">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-md mb-2">Install Family OS</h3>
              <p className="text-xs opacity-90">Add to home screen for quick access</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleInstallClick}
                className="px-3 py-1 text-xs rounded-full text-primary bg-primary-foreground hover:bg-white hover:text-primary-foreground transition-colors"
              >
                Install
              </button>
              <button
                onClick={handleInstallDismiss}
                className="px-3 py-1 text-xs rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Component {...pageProps} user={user} loading={loading} />
    </ThemeProvider>
  )
} 