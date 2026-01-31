import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { BottomActions } from '../ui/BottomActions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { Home, Plus, Users, Settings, Eye } from 'lucide-react'
import { FamilyManagement } from './FamilyManagement'
import { GradientText } from '../ui/gradient-text'

interface FamilyGroup {
  id: string
  name: string
  owner_id: string
  invite_code: string
  created_at: string
  icon?: string
}

interface FamilyGroupSetupProps {
  user: User
  onGroupJoined: (group: FamilyGroup) => void
  isOnline: boolean
}

export const FamilyGroupSetup: React.FC<FamilyGroupSetupProps> = ({
  user,
  onGroupJoined,
  isOnline
}) => {
  const { t } = useTranslation()
  const [groups, setGroups] = useState<FamilyGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create')
  const [newGroupName, setNewGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')

  const [selectedGroupForManagement, setSelectedGroupForManagement] = useState<FamilyGroup | null>(null)

  useEffect(() => {
    if (isOnline) {
      fetchUserGroups()
    }
  }, [isOnline])

  const fetchUserGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          family_groups (
            id,
            name,
            owner_id,
            invite_code,
            created_at,
            icon
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error
      
      const familyGroups = (data as any)
        ?.map((item: any) => item.family_groups)
        .filter(Boolean) as FamilyGroup[]
      
      setGroups(familyGroups || [])
    } catch (error: any) {
      console.error('Error fetching groups:', error)
      setError(t('errors.loadFamilyGroups'))
    } finally {
      setIsLoading(false)
    }
  }

  const createGroup = async () => {
    if (!newGroupName.trim() || !isOnline) return

    try {
      setError('')
      const inviteCode = Math.random().toString(36).substring(2, 15)
      
      const { data: group, error: groupError } = await supabase
        .from('family_groups')
        .insert([{
          name: newGroupName,
          owner_id: user.id,
          invite_code: inviteCode
        }])
        .select()
        .single()

      if (groupError) throw groupError

      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{
          group_id: group.id,
          user_id: user.id,
          role: 'owner' // Set creator as owner
        }])

      if (memberError) throw memberError

      setNewGroupName('')
      setShowAddFamilyModal(false)
      await fetchUserGroups()
    } catch (error: any) {
      console.error('Error creating group:', error)
      setError(t('errors.createFamilyGroup'))
    }
  }

  const joinGroup = async () => {
    if (!inviteCode.trim() || !isOnline) return

    try {
      setError('')
      
      const { data: group, error: groupError } = await supabase
        .from('family_groups')
        .select('id')
        .eq('invite_code', inviteCode)
        .single()

      if (groupError) throw groupError

      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{
          group_id: group.id,
          user_id: user.id,
          role: 'member' // Set default role as member when joining via code
        }])

      if (memberError) throw memberError

      setInviteCode('')
      setShowAddFamilyModal(false)
      await fetchUserGroups()
    } catch (error: any) {
      console.error('Error joining group:', error)
      setError(t('errors.joinFamilyGroup'))
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const renderFamilyIcon = (icon?: string) => {
    const currentIcon = icon || '🏠'
    
    if (currentIcon.startsWith('lucide:')) {
      const iconName = currentIcon.replace('lucide:', '')
      const iconMap: { [key: string]: any } = {
        'Home': Home,
        'Heart': Home, // We'll use Home as fallback since Heart isn't imported
        'Star': Home,
        'Tree': Home,
        'Flower': Home,
        'Sun': Home,
        'Moon': Home
      }
      const LucideIcon = iconMap[iconName] || Home
      return <LucideIcon className="h-6 w-6 text-white" />
    } else if (currentIcon.startsWith('http')) {
      return <img src={currentIcon} alt="Family icon" className="h-6 w-6 rounded object-cover" />
    } else {
      return <span className="text-xl">{currentIcon}</span>
    }
  }



  // Show family management if a group is selected for management
  if (selectedGroupForManagement) {
    return (
      <FamilyManagement
        user={user}
        group={selectedGroupForManagement}
        onBack={() => setSelectedGroupForManagement(null)}
        onFamilyDeleted={() => {
          setSelectedGroupForManagement(null)
          fetchUserGroups() // Refresh the groups list
        }}
        isOnline={isOnline}
      />
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="p-6 max-w-6xl mx-auto pt-12">
          {/* Animated Welcome Header */}
          <div className="text-center mb-12">
            <GradientText
              colors={["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#6366f1"]}
              animationSpeed={6}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4"
            >
              Family OS
            </GradientText>
            <GradientText
              colors={["#10b981", "#3b82f6", "#8b5cf6", "#10b981"]}
              animationSpeed={4}
              className="text-lg sm:text-xl font-medium opacity-80"
            >
              Connect • Organize • Thrive Together
            </GradientText>
          </div>
          
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <h2 className="text-lg font-medium">{t('family.loadingFamilies')}</h2>
              <p className="text-muted-foreground">{t('family.settingUpSpace')}</p>
            </div>
          </div>
        </div>
        <BottomActions
          user={user}
          onLogout={handleLogout}
          isHome={true}
          showHomeButton={false}
        />
      </div>
    )
  }

  return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="p-6 max-w-6xl mx-auto pt-12 pb-32">
          
          {/* Animated Welcome Header */}
          <div className="text-center mb-12">
            <GradientText
              colors={["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#6366f1"]}
              animationSpeed={6}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4"
            >
              Family OS
            </GradientText>
            <GradientText
              colors={["#10b981", "#3b82f6", "#8b5cf6", "#10b981"]}
              animationSpeed={4}
              className="text-lg sm:text-xl font-medium opacity-80"
            >
              {t('app.description')}
            </GradientText>
          </div>

        {error && (
          <Alert variant="destructive" className="mb-8 max-w-2xl mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Family Groups Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {groups.map((group) => (
            <Card key={group.id} className="group cursor-pointer hover:shadow-xl transition-all duration-300 bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/20 shadow-lg">
              <CardContent className="p-4">
                {/* Compact Header with Icon and Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    {renderFamilyIcon(group.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">{group.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {group.owner_id === user.id ? t('family.owner') : t('family.member')}
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button 
                    onClick={() => onGroupJoined(group)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    size="sm"
                    disabled={!isOnline}
                  >
                    {t('family.enterFamily')}
                  </Button>
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedGroupForManagement(group)
                    }}
                    variant={group.owner_id === user.id ? "outline" : "ghost"}
                    className={group.owner_id === user.id 
                      ? "w-full" 
                      : "w-full text-muted-foreground hover:text-foreground border border-muted-foreground/30 hover:border-muted-foreground/50"
                    }
                    size="sm"
                    disabled={!isOnline}
                  >
                    {group.owner_id === user.id ? (
                      <Settings className="h-4 w-4 mr-2" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    {group.owner_id === user.id ? t('family.manageFamily') : t('family.viewFamilyInfo')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {groups.length === 0 && (
            <div className="col-span-full text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-12 w-12 text-slate-500 dark:text-slate-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">
                {t('family.noFamilies')}
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                {t('family.noFamiliesDescription')}
              </p>
            </div>
          )}
        </div>



        {/* Add Family Modal with Tabs */}
        <Dialog open={showAddFamilyModal} onOpenChange={setShowAddFamilyModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl">{t('family.addFamily')}</DialogTitle>
              <DialogDescription>
                {t('family.noFamiliesDescription')}
              </DialogDescription>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'create' | 'join')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create">{t('family.createGroup')}</TabsTrigger>
                <TabsTrigger value="join">{t('family.joinGroup')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="create" className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="family-name" className="text-sm font-medium">{t('family.groupName')}</Label>
                  <Input
                    id="family-name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder={t('family.groupNamePlaceholder')}
                    className="text-base"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        createGroup()
                      }
                    }}
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={createGroup} className="flex-1" size="lg">
                    {t('family.createGroup')}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddFamilyModal(false)}
                    size="lg"
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="join" className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-code" className="text-sm font-medium">{t('family.inviteCode')}</Label>
                  <Input
                    id="invite-code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder={t('family.inviteCodePlaceholder')}
                    className="text-base font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        joinGroup()
                      }
                    }}
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={joinGroup} className="flex-1" size="lg">
                    {t('family.joinGroup')}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddFamilyModal(false)}
                    size="lg"
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      
      <BottomActions
        user={user}
        onLogout={handleLogout}
        isHome={true}
        showHomeButton={false}
        contextualActions={[
          {
            icon: Plus,
            label: t('family.addFamily'),
            onClick: () => {
              setActiveTab('create')
              setShowAddFamilyModal(true)
            },
            disabled: !isOnline
          }
        ]}
      />
    </div>
  )
} 