import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { LoginForm } from '../components/auth/LoginForm'
import { FamilyGroupSetup } from '../components/family/FamilyGroupSetup'
import { Dashboard } from '../components/dashboard/Dashboard'
import { supabase } from '../lib/supabase'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Skeleton } from '../components/ui/skeleton'

interface HomeProps {
  user: User | null
  loading: boolean
}

interface FamilyGroup {
  id: string
  name: string
  owner_id: string
  invite_code: string
}

export default function Home({ user, loading }: HomeProps) {
  const [selectedGroup, setSelectedGroup] = useState<FamilyGroup | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [showFamilyManagement, setShowFamilyManagement] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-fetch family groups when user is available
  useEffect(() => {
    if (user && isOnline && !selectedGroup && !showFamilyManagement) {
      fetchUserGroups()
    }
  }, [user, isOnline, selectedGroup, showFamilyManagement])

  const fetchUserGroups = async () => {
    if (!user) return
    
    setIsLoadingGroups(true)
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          family_groups (
            id,
            name,
            owner_id,
            invite_code
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error
      
      const familyGroups = (data as any)
        ?.map((item: any) => item.family_groups)
        .filter(Boolean) as FamilyGroup[]
      
      if (familyGroups && familyGroups.length > 0) {
        // Auto-select the first family group
        setSelectedGroup(familyGroups[0])
      } else {
        // No family groups, show family management
        setShowFamilyManagement(true)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
      setShowFamilyManagement(true)
    } finally {
      setIsLoadingGroups(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSelectedGroup(null)
    setShowFamilyManagement(false)
  }

  const handleGroupJoined = (group: FamilyGroup) => {
    setSelectedGroup(group)
    setShowFamilyManagement(false)
  }

  const handleLeaveGroup = () => {
    setSelectedGroup(null)
    setShowFamilyManagement(true)
  }

  const handleSwitchFamily = (newGroup: FamilyGroup) => {
    setSelectedGroup(newGroup)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center space-y-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Loading Family OS...</h1>
          <p className="text-muted-foreground">Setting up your family space</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm onSuccess={() => {}} />
  }

  // Show loading while fetching groups
  if (isLoadingGroups && !selectedGroup && !showFamilyManagement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold">Loading your families...</h1>
          <p className="text-muted-foreground">Setting up your dashboard</p>
        </div>
      </div>
    )
  }

  // Show family management only when explicitly requested or no groups exist
  if (showFamilyManagement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Offline banner */}
        {!isOnline && (
          <Alert className="rounded-none border-x-0 border-t-0">
            <AlertDescription className="text-center">
              ⚠️ You're offline. Some features may be limited.
            </AlertDescription>
          </Alert>
        )}
        <FamilyGroupSetup 
          user={user} 
          onGroupJoined={handleGroupJoined}
          isOnline={isOnline}
        />
      </div>
    )
  }

  // Main dashboard - should have a selected group by now
  if (!selectedGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">No Family Selected</h1>
          <p className="text-muted-foreground">Please create or join a family to continue</p>
        </div>
      </div>
    )
  }

  return (
    <Dashboard
      user={user}
      group={selectedGroup}
      onLogout={handleLogout}
      onLeaveGroup={handleLeaveGroup}
      onSwitchFamily={handleSwitchFamily}
      isOnline={isOnline}
    />
  )
} 