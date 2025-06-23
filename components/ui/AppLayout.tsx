import React from 'react'
import { User } from '@supabase/supabase-js'
import { AppHeader } from './AppHeader'
import { Alert, AlertDescription } from './alert'

interface AppLayoutProps {
  user?: User | null
  title?: string
  showBackButton?: boolean
  onBack?: () => void
  onLogout?: () => void
  onManageFamilies?: () => void
  showUserControls?: boolean
  transparentHeader?: boolean
  isOnline?: boolean
  children: React.ReactNode
  className?: string
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  user,
  title,
  showBackButton = false,
  onBack,
  onLogout,
  onManageFamilies,
  showUserControls = true,
  transparentHeader = false,
  isOnline = true,
  children,
  className = ''
}) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 ${className}`}>
      {/* Header */}
      <AppHeader
        user={user}
        title={title}
        showBackButton={showBackButton}
        onBack={onBack}
        onLogout={onLogout}
        onManageFamilies={onManageFamilies}
        showUserControls={showUserControls}
        transparent={transparentHeader}
      />
      
      {/* Offline Banner */}
      {!isOnline && (
        <Alert className="rounded-none border-x-0 border-t-0 bg-orange-100 border-orange-200 text-orange-800">
          <AlertDescription className="text-center text-sm">
            ⚠️ You're offline. Some features may be limited.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
} 