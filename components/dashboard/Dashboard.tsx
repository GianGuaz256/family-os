import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { ThemeSwitcher } from '../ui/ThemeSwitcher'
import { BottomActions } from '../ui/BottomActions'
import { ListsTab } from './ListsTab'
import { DocumentsTab } from './DocumentsTab'
import { EventsTab } from './EventsTab'
import { CardsTab } from './CardsTab'
import { SettingsTab } from './SettingsTab'
import { 
  List, 
  FileText, 
  Calendar, 
  CreditCard, 
  LogOut, 
  ArrowLeft, 
  ChevronDown,
  Home,
  Users,
  Plus,
  Settings,
  Camera
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Card, CardContent } from '../ui/card'
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
}

interface DashboardProps {
  user: User
  group: FamilyGroup
  onLogout: () => void
  onLeaveGroup: () => void
  onSwitchFamily?: (newGroup: FamilyGroup) => void
  isOnline: boolean
}

type AppView = 'home' | 'lists' | 'documents' | 'events' | 'cards' | 'settings'

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  group,
  onLogout,
  onLeaveGroup,
  onSwitchFamily,
  isOnline
}) => {
  const [currentView, setCurrentView] = useState<AppView>('home')
  const [lists, setLists] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [cards, setCards] = useState<any[]>([])
  const [allGroups, setAllGroups] = useState<FamilyGroup[]>([])

  useEffect(() => {
    try {
      if (isOnline) {
        fetchData()
        fetchAllGroups()
        setupRealtimeSubscriptions()
      }
    } catch (error) {
      console.error('Dashboard useEffect error:', error)
    }
  }, [group.id, isOnline])

  const fetchData = async () => {
    try {
      // Fetch lists
      const { data: listsData } = await supabase
        .from('lists')
        .select('*')
        .eq('group_id', group.id)
        .order('created_at', { ascending: false })
      
      // Fetch documents
      const { data: documentsData } = await supabase
        .from('documents')
        .select('*')
        .eq('group_id', group.id)
        .order('created_at', { ascending: false })
      
      // Fetch events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('group_id', group.id)
        .order('date', { ascending: true })
      
      // Fetch cards
      const { data: cardsData } = await supabase
        .from('cards')
        .select('*')
        .eq('group_id', group.id)
        .order('created_at', { ascending: false })

      setLists(listsData || [])
      setDocuments(documentsData || [])
      setEvents(eventsData || [])
      setCards(cardsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const fetchAllGroups = async () => {
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
      
      setAllGroups(familyGroups || [])
    } catch (error) {
      console.error('Error fetching all groups:', error)
    }
  }

  const setupRealtimeSubscriptions = () => {
    const channel = supabase
      .channel('family-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'lists', filter: `group_id=eq.${group.id}` },
        () => fetchData()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'documents', filter: `group_id=eq.${group.id}` },
        () => fetchData()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'events', filter: `group_id=eq.${group.id}` },
        () => fetchData()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'cards', filter: `group_id=eq.${group.id}` },
        () => fetchData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleGroupSwitch = async (newGroup: FamilyGroup) => {
    if (onSwitchFamily) {
      onSwitchFamily(newGroup)
    } else {
      // Fallback - refresh page
      window.location.reload()
    }
  }

  const apps = [
    {
      id: 'lists' as const,
      name: 'Lists',
      icon: List,
      color: 'from-blue-400 to-blue-600',
      count: lists.length,
      description: 'Shopping & To-dos'
    },
    {
      id: 'documents' as const,
      name: 'Documents',
      icon: FileText,
      color: 'from-green-400 to-green-600',
      count: documents.length,
      description: 'Important Files'
    },
    {
      id: 'events' as const,
      name: 'Events',
      icon: Calendar,
      color: 'from-purple-400 to-purple-600',
      count: events.length,
      description: 'Family Calendar'
    },
    {
      id: 'cards' as const,
      name: 'Cards',
      icon: CreditCard,
      color: 'from-orange-400 to-orange-600',
      count: cards.length,
      description: 'Loyalty Cards'
    }
  ]

  const formatTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
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
          label: 'Create New List',
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
          label: 'Add Document',
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
          label: 'Add Event',
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
            label: 'Scan Card',
            onClick: () => {
              const event = new CustomEvent('openCreateModal', { detail: { type: 'scan' } })
              window.dispatchEvent(event)
            },
            variant: 'secondary' as const,
            disabled: !isOnline
          },
          {
            icon: Plus,
            label: 'Add Card',
            onClick: () => {
              const event = new CustomEvent('openCreateModal', { detail: { type: 'card' } })
              window.dispatchEvent(event)
            },
            disabled: !isOnline
          }
        )
        break
    }
    
    return actions
  }

  if (currentView !== 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* App Content */}
        <div className="p-4 pb-32">
          {currentView === 'lists' && (
            <ListsTab 
              lists={lists} 
              groupId={group.id} 
              onUpdate={fetchData}
              isOnline={isOnline}
            />
          )}
          {currentView === 'documents' && (
            <DocumentsTab 
              documents={documents} 
              groupId={group.id} 
              onUpdate={fetchData}
              isOnline={isOnline}
            />
          )}
          {currentView === 'events' && (
            <EventsTab 
              events={events} 
              groupId={group.id} 
              onUpdate={fetchData}
              isOnline={isOnline}
            />
          )}
          {currentView === 'cards' && (
            <CardsTab 
              cards={cards} 
              groupId={group.id} 
              onUpdate={fetchData}
              isOnline={isOnline}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">

      {/* Time and Date Widget */}
      <div className="px-6 py-8 text-center">
        <div className="text-6xl font-light mb-2">{formatTime()}</div>
        <div className="text-lg text-muted-foreground">{formatDate()}</div>
      </div>

      {/* Family Selector Widget */}
      <div className="px-6 mb-8">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/20 shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{group.name}</div>
                      <div className="text-sm text-muted-foreground">Current Family</div>
                    </div>
                  </div>
                  
                  {allGroups.length > 1 && (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </Card>
          </DropdownMenuTrigger>
          
          {allGroups.length > 1 && (
            <DropdownMenuContent align="center" className="w-[var(--radix-dropdown-menu-trigger-width)]">
              {allGroups.map((familyGroup) => (
                <DropdownMenuItem 
                  key={familyGroup.id}
                  onClick={() => handleGroupSwitch(familyGroup)}
                  disabled={familyGroup.id === group.id}
                  className={cn(
                    "cursor-pointer",
                    familyGroup.id === group.id && "bg-primary text-primary-foreground font-medium"
                  )}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {familyGroup.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLeaveGroup}>
                <Plus className="mr-2 h-4 w-4" />
                Manage Families
              </DropdownMenuItem>
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </div>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="px-6 mb-4">
          <Alert className="bg-orange-100 border-orange-200 text-orange-800">
            <AlertDescription className="text-center text-sm">
              ⚠️ You're offline. Some features may be limited.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* App Icons */}
      <div className="px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8 md:gap-10 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto">
          {apps.map((app) => (
            <div key={app.id} className="relative flex flex-col items-center">
              <button
                onClick={() => setCurrentView(app.id)}
                disabled={!isOnline}
                className="group relative transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center"
              >
                {/* App Icon Container */}
                <div className="relative">
                  <div className={`w-20 h-20 bg-gradient-to-br ${app.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-active:scale-95 transition-transform duration-200`}>
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
          ))}
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
  )
} 