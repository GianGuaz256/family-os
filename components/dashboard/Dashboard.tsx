import { useState, useEffect, useCallback, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { BottomActions } from '../ui/BottomActions'
import { PullToRefreshIndicator } from '../ui/PullToRefreshIndicator'
import { ListsTab } from './ListsTab'
import { DocumentsTab } from './DocumentsTab'
import { EventsTab } from './EventsTab'
import { CardsTab } from './CardsTab'
import { SubscriptionsTab } from './SubscriptionsTab'
import { NotesTab } from './NotesTab'
import { SettingsTab } from './SettingsTab'
import { usePullToRefresh } from '../../hooks/usePullToRefresh'
import {  
  ChevronDown,
  Home,
  Plus,
  Camera,
  Heart,
  Star,
  TreePine,
  Flower,
  Sun,
  Moon,
  FolderOpen,
  CalendarDays,
  Wallet,
  RotateCcw,
  Edit3,
  CheckSquare
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Card, CardContent } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { cn } from '../../lib/utils'

interface FamilyGroup {
  id: string
  name: string
  owner_id: string
  invite_code: string
  icon?: string
}

interface DashboardProps {
  user: User
  group: FamilyGroup
  onLogout: () => void
  onLeaveGroup: () => void
  onSwitchFamily?: (newGroup: FamilyGroup) => void
  isOnline: boolean
}

type AppView = 'home' | 'lists' | 'documents' | 'events' | 'cards' | 'subscriptions' | 'notes' | 'settings'

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  group,
  onLogout,
  onLeaveGroup,
  onSwitchFamily,
  isOnline
}) => {
  const { t } = useTranslation()
  const [currentView, setCurrentView] = useState<AppView>('home')
  const [lists, setLists] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [cards, setCards] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [allGroups, setAllGroups] = useState<FamilyGroup[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isSwitchingFamily, setIsSwitchingFamily] = useState(false)

  // Debouncing refs to prevent excessive calls
  const fetchTimeoutRef = useRef<NodeJS.Timeout>()
  const lastFetchRef = useRef<number>(0)
  const DEBOUNCE_DELAY = 1000 // 1 second debounce

  // Selective fetch functions - only fetch what's needed
  const fetchSpecificData = useCallback(async (table: string) => {
    if (!isOnline) return

    const now = Date.now()
    
    // Clear any pending fetch
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }

    // Debounce rapid calls
    if (now - lastFetchRef.current < DEBOUNCE_DELAY) {
      fetchTimeoutRef.current = setTimeout(() => fetchSpecificData(table), DEBOUNCE_DELAY)
      return
    }

    lastFetchRef.current = now

    try {
      switch (table) {
        case 'lists': {
          const { data: listsData } = await supabase
            .from('lists')
            .select('*')
            .eq('group_id', group.id)
            .order('created_at', { ascending: false })
          setLists(listsData || [])
          break
        }

        case 'documents': {
          const { data: documentsData } = await supabase
            .from('documents')
            .select('*')
            .eq('group_id', group.id)
            .order('created_at', { ascending: false })
          setDocuments(documentsData || [])
          break
        }

        case 'events': {
          const { data: eventsData } = await supabase
            .from('events')
            .select('*')
            .eq('group_id', group.id)
            .order('date', { ascending: true })
          setEvents(eventsData || [])
          break
        }

        case 'cards': {
          const { data: cardsData } = await supabase
            .from('cards')
            .select('*')
            .eq('group_id', group.id)
            .order('created_at', { ascending: false })
          setCards(cardsData || [])
          break
        }

        case 'subscriptions': {
          const { data: subscriptionsData } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('group_id', group.id)
            .order('created_at', { ascending: false })
          setSubscriptions(subscriptionsData || [])
          break
        }

        case 'notes': {
          const { data: notesData } = await supabase
            .from('notes')
            .select('*')
            .eq('group_id', group.id)
            .order('created_at', { ascending: false })
          setNotes(notesData || [])
          break
        }
      }
    } catch (error) {
      console.error(`Error fetching ${table}:`, error)
    }
  }, [group.id, isOnline])

  // Optimized initial data fetch - parallel queries
  const fetchData = useCallback(async () => {
    if (!isOnline) return

    try {
      setIsLoadingData(true)
      
      // Execute all queries in parallel for initial load
      const [
        listsResult,
        documentsResult,
        eventsResult,
        cardsResult,
        subscriptionsResult,
        notesResult
      ] = await Promise.all([
        supabase.from('lists').select('*').eq('group_id', group.id).order('created_at', { ascending: false }),
        supabase.from('documents').select('*').eq('group_id', group.id).order('created_at', { ascending: false }),
        supabase.from('events').select('*').eq('group_id', group.id).order('date', { ascending: true }),
        supabase.from('cards').select('*').eq('group_id', group.id).order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('*').eq('group_id', group.id).order('created_at', { ascending: false }),
        supabase.from('notes').select('*').eq('group_id', group.id).order('created_at', { ascending: false })
      ])

      setLists(listsResult.data || [])
      setDocuments(documentsResult.data || [])
      setEvents(eventsResult.data || [])
      setCards(cardsResult.data || [])
      setSubscriptions(subscriptionsResult.data || [])
      setNotes(notesResult.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoadingData(false)
      setIsSwitchingFamily(false)
    }
  }, [group.id, isOnline])

  const fetchAllGroups = useCallback(async () => {
    if (!isOnline) return

    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          family_groups (
            id,
            name,
            owner_id,
            invite_code,
            icon
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error
      
      const familyGroups = (data as any)
        ?.map((item: any) => item.family_groups)
        .filter(Boolean) as FamilyGroup[]
      
      setAllGroups(familyGroups || [])
    } catch (error) {
      console.error('Error fetching all groups:', error)
    }
  }, [user.id, isOnline])

  // Optimized realtime subscriptions - selective updates only
  const setupRealtimeSubscriptions = useCallback(() => {
    // Remove any existing channel with the same name first
    const channelName = `optimized-family-updates-${group.id}`
    const existingChannel = supabase.getChannels().find(ch => ch.topic === `realtime:${channelName}`)
    if (existingChannel) {
      supabase.removeChannel(existingChannel)
    }

    const channel = supabase
      .channel(channelName)
      // Only update specific data when specific tables change
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'lists', filter: `group_id=eq.${group.id}` },
        () => fetchSpecificData('lists')
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'documents', filter: `group_id=eq.${group.id}` },
        () => fetchSpecificData('documents')
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'events', filter: `group_id=eq.${group.id}` },
        () => fetchSpecificData('events')
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'cards', filter: `group_id=eq.${group.id}` },
        () => fetchSpecificData('cards')
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'subscriptions', filter: `group_id=eq.${group.id}` },
        () => fetchSpecificData('subscriptions')
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notes', filter: `group_id=eq.${group.id}` },
        () => fetchSpecificData('notes')
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [group.id, fetchSpecificData])

  // Pull-to-refresh functionality - only for home view
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      fetchData(),
      fetchAllGroups()
    ])
  }, [fetchData, fetchAllGroups])

  const { isRefreshing, pullDistance, containerRef } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    enabled: isOnline && !isLoadingData && !isSwitchingFamily && currentView === 'home'
  })

  useEffect(() => {
    let cleanup: (() => void) | undefined

    const initialize = async () => {
      try {
        if (isOnline) {
          await fetchData()
          await fetchAllGroups()
          cleanup = setupRealtimeSubscriptions()
        }
      } catch (error) {
        console.error('Dashboard useEffect error:', error)
      }
    }

    initialize()

    return () => {
      if (cleanup) {
        cleanup()
      }
      // Cleanup timeout on unmount
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [group.id, isOnline, fetchData, fetchAllGroups, setupRealtimeSubscriptions])

  const handleGroupSwitch = async (newGroup: FamilyGroup) => {
    setIsSwitchingFamily(true)
    if (onSwitchFamily) {
      onSwitchFamily(newGroup)
    } else {
      // Fallback - refresh page
      window.location.reload()
    }
  }

  const renderFamilyIcon = (icon?: string) => {
    const currentIcon = icon || '🏠'
    
    if (currentIcon.startsWith('lucide:')) {
      const iconName = currentIcon.replace('lucide:', '')
      const iconMap: { [key: string]: any } = {
        'Home': Home,
        'Heart': Heart,
        'Star': Star,
        'Tree': TreePine,
        'Flower': Flower,
        'Sun': Sun,
        'Moon': Moon
      }
      const LucideIcon = iconMap[iconName] || Home
      return <LucideIcon className="h-6 w-6 text-white" />
    } else if (currentIcon.startsWith('http')) {
      return <img src={currentIcon} alt="Family icon" className="h-6 w-6 rounded object-cover" />
    } else {
      return <span className="text-xl">{currentIcon}</span>
    }
  }

  const apps = [
    {
      id: 'lists' as const,
      name: t('dashboard.tabs.lists'),
      icon: CheckSquare,
      color: 'from-cyan-400 via-blue-500 to-indigo-600',
      count: lists.length,
      description: t('lists.description')
    },
    {
      id: 'documents' as const,
      name: t('dashboard.tabs.documents'),
      icon: FolderOpen,
      color: 'from-emerald-400 via-teal-500 to-green-600',
      count: documents.length,
      description: t('documents.description')
    },
    {
      id: 'events' as const,
      name: t('dashboard.tabs.events'),
      icon: CalendarDays,
      color: 'from-violet-400 via-purple-500 to-indigo-600',
      count: events.length,
      description: t('events.description')
    },
    {
      id: 'cards' as const,
      name: t('dashboard.tabs.cards'),
      icon: Wallet,
      color: 'from-orange-400 via-red-500 to-pink-600',
      count: cards.length,
      description: t('cards.description')
    },
    {
      id: 'subscriptions' as const,
      name: t('dashboard.tabs.subscriptions'),
      icon: RotateCcw,
      color: 'from-yellow-400 via-orange-500 to-red-600',
      count: subscriptions.length,
      description: t('subscriptions.description')
    },
    {
      id: 'notes' as const,
      name: t('dashboard.tabs.notes'),
      icon: Edit3,
      color: 'from-pink-400 via-rose-500 to-purple-600',
      count: notes.length,
      description: t('notes.description')
    }
  ]

  const formatTime = () => {
    const locale = t('app.locale', { fallback: 'en-US' })
    return new Date().toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: locale.startsWith('en')
    })
  }

  const formatDate = () => {
    const locale = t('app.locale', { fallback: 'en-US' })
    return new Date().toLocaleDateString(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
  }

  // Get contextual actions based on current view
  const getContextualActions = () => {
    const actions = []
    
    switch (currentView) {
      case 'lists':
        actions.push({
          icon: Plus,
          label: t('lists.createList'),
          onClick: () => {
            // This will be handled by the ListsTab component's state
            const event = new CustomEvent('openCreateModal', { detail: { type: 'list' } })
            window.dispatchEvent(event)
          },
          disabled: !isOnline
        })
        break
      case 'documents':
        actions.push({
          icon: Plus,
          label: t('documents.uploadDocument'),
          onClick: () => {
            const event = new CustomEvent('openCreateModal', { detail: { type: 'document' } })
            window.dispatchEvent(event)
          },
          disabled: !isOnline
        })
        break
      case 'events':
        actions.push({
          icon: Plus,
          label: t('events.createEvent'),
          onClick: () => {
            const event = new CustomEvent('openCreateModal', { detail: { type: 'event' } })
            window.dispatchEvent(event)
          },
          disabled: !isOnline
        })
        break
      case 'cards':
        actions.push(
          {
            icon: Camera,
            label: t('cards.scanCard'),
            onClick: () => {
              const event = new CustomEvent('openCreateModal', { detail: { type: 'scan' } })
              window.dispatchEvent(event)
            },
            variant: 'secondary' as const,
            disabled: !isOnline
          },
          {
            icon: Plus,
            label: t('cards.addCard'),
            onClick: () => {
              const event = new CustomEvent('openCreateModal', { detail: { type: 'card' } })
              window.dispatchEvent(event)
            },
            disabled: !isOnline
          }
        )
        break
      case 'subscriptions':
        actions.push({
          icon: Plus,
          label: t('subscriptions.addSubscription'),
          onClick: () => {
            const event = new CustomEvent('openCreateModal', { detail: { type: 'subscription' } })
            window.dispatchEvent(event)
          },
          disabled: !isOnline
        })
        break
      case 'notes':
        actions.push({
          icon: Plus,
          label: t('notes.createNote'),
          onClick: () => {
            const event = new CustomEvent('openCreateModal', { detail: { type: 'note' } })
            window.dispatchEvent(event)
          },
          disabled: !isOnline
        })
        break
    }
    
    return actions
  }

  if (currentView !== 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
        {/* App Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-32">
          {currentView === 'lists' && (
            <ListsTab 
              lists={lists} 
              groupId={group.id} 
              onUpdate={fetchData}
              isOnline={isOnline}
              appConfig={apps.find(app => app.id === 'lists')}
            />
          )}
          {currentView === 'documents' && (
            <DocumentsTab 
              documents={documents} 
              groupId={group.id} 
              onUpdate={fetchData}
              isOnline={isOnline}
              currentUserId={user.id}
              appConfig={apps.find(app => app.id === 'documents')}
            />
          )}
          {currentView === 'events' && (
            <EventsTab 
              events={events}
              subscriptions={subscriptions}
              groupId={group.id} 
              onUpdate={fetchData}
              isOnline={isOnline}
              appConfig={apps.find(app => app.id === 'events')}
            />
          )}
          {currentView === 'cards' && (
            <CardsTab 
              cards={cards} 
              groupId={group.id} 
              onUpdate={fetchData}
              isOnline={isOnline}
              appConfig={apps.find(app => app.id === 'cards')}
            />
          )}
          {currentView === 'subscriptions' && (
            <SubscriptionsTab 
              subscriptions={subscriptions} 
              groupId={group.id} 
              onUpdate={fetchData}
              isOnline={isOnline}
              currentUser={user}
              appConfig={apps.find(app => app.id === 'subscriptions')}
            />
          )}
          {currentView === 'notes' && (
            <NotesTab 
              notes={notes} 
              groupId={group.id} 
              onUpdate={fetchData}
              isOnline={isOnline}
              currentUserId={user.id}
              isGroupOwner={group.owner_id === user.id}
              appConfig={apps.find(app => app.id === 'notes')}
            />
          )}
          {currentView === 'settings' && (
            <SettingsTab 
              user={user}
              isOnline={isOnline}
            />
          )}
        </div>

        {/* Bottom Actions for App Views */}
        <BottomActions
          user={user}
          onHome={() => setCurrentView('home')}
          onSettings={() => setCurrentView('settings')}
          onLogout={onLogout}
          onManageFamilies={onLeaveGroup}
          contextualActions={getContextualActions()}
          isHome={false}
        />
      </div>
    )
  }

  // Home Screen
  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col fixed inset-0 overflow-hidden"
      style={{
        paddingTop: pullDistance > 0 ? `${Math.min(pullDistance * 0.8 + 20, 100)}px` : undefined,
        transition: pullDistance === 0 ? 'padding-top 0.4s ease-out' : undefined
      }}
    >
      {/* Pull-to-Refresh Indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        threshold={80}
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Time and Date Widget */}
        <div className="px-6 py-8 text-center">
          <div className="text-6xl font-light mb-2">{formatTime()}</div>
          <div className="text-lg text-muted-foreground">{formatDate()}</div>
        </div>

        {/* Family Selector Widget */}
        <div className="px-6 mb-8 flex justify-center">
          <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/20 shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center relative">
                        {isSwitchingFamily ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        ) : (
                          renderFamilyIcon(group.icon)
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{group.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {isSwitchingFamily ? t('dashboard.switchingFamily') : t('dashboard.currentFamily')}
                        </div>
                      </div>
                    </div>
                    
                    {allGroups.length > 1 && !isSwitchingFamily && (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </DropdownMenuTrigger>
            
            {allGroups.length > 1 && !isSwitchingFamily && (
              <DropdownMenuContent align="center" className="w-[var(--radix-dropdown-menu-trigger-width)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl">
                {allGroups.map((familyGroup) => (
                  <DropdownMenuItem 
                    key={familyGroup.id}
                    onClick={() => handleGroupSwitch(familyGroup)}
                    disabled={familyGroup.id === group.id || isSwitchingFamily}
                    className={cn(
                      "cursor-pointer p-4 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors duration-200",
                      familyGroup.id === group.id && "bg-primary/10 text-primary font-medium border-l-4 border-primary"
                    )}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                        <div className="scale-90">
                          {renderFamilyIcon(familyGroup.icon)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-base truncate">{familyGroup.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {familyGroup.id === group.id ? t('dashboard.currentFamily') : t('dashboard.switchToFamily')}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-white/20 dark:bg-white/10" />
                <DropdownMenuItem 
                  onClick={onLeaveGroup}
                  className="cursor-pointer p-4 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                      <Plus className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-base">{t('dashboard.manageFamilies')}</div>
                      <div className="text-xs text-muted-foreground">{t('dashboard.manageFamiliesDescription')}</div>
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            )}
          </DropdownMenu>
          </div>
        </div>

        {/* Offline Banner */}
        {!isOnline && (
          <div className="px-6 mb-4">
            <Alert className="bg-orange-100 border-orange-200 text-orange-800">
              <AlertDescription className="text-center text-sm">
                ⚠️ {t('dashboard.offlineMessage')}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* App Icons */}
        <div className="px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8 md:gap-10 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto">
            {(isLoadingData || isSwitchingFamily) ? (
              // Skeleton loading state
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="relative flex flex-col items-center">
                  <div className="flex flex-col items-center">
                    <Skeleton className="w-20 h-20 rounded-2xl mb-3" />
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-3 w-8 rounded mt-1" />
                  </div>
                </div>
              ))
            ) : (
              apps.map((app) => (
                <div key={app.id} className="relative flex flex-col items-center">
                  <button
                    onClick={() => setCurrentView(app.id)}
                    disabled={!isOnline}
                    className="group relative transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center"
                  >
                    {/* App Icon Container */}
                    <div className="relative">
                      <div className={`w-20 h-20 bg-gradient-to-br ${app.color} rounded-[20px] flex items-center justify-center shadow-lg group-hover:scale-110 group-active:scale-95 transition-transform duration-200`}>
                        <app.icon className="h-10 w-10 text-white" />
                      </div>
                    
                    {/* Notification Badge */}
                    {app.count > 0 && (
                      <div className="absolute -top-2 -right-2 min-w-[22px] h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg px-1 z-10">
                        {app.count > 99 ? '99+' : app.count}
                      </div>
                    )}
                  </div>
                  
                  {/* App Name */}
                  <div className="text-center mt-3">
                    <div className="text-sm font-medium text-foreground/90 leading-tight">
                      {app.name}
                    </div>
                  </div>
                </button>
              </div>
            ))
            )}
          </div>
        </div>

        {/* Bottom Actions for Home Screen */}
        <BottomActions
          user={user}
          onHome={() => {}} // No action needed since we're already home
          onSettings={() => setCurrentView('settings')}
          onLogout={onLogout}
          onManageFamilies={onLeaveGroup}
          isHome={true}
        />

        <div className="h-32"></div> {/* Bottom spacing */}
      </div>
    </div>
  )
} 