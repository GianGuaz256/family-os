import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { AppLayout } from '../ui/AppLayout'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Home, Plus, Users, Settings } from 'lucide-react'

interface FamilyGroup {
  id: string
  name: string
  owner_id: string
  invite_code: string
  created_at: string
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
  const [groups, setGroups] = useState<FamilyGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')

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
            created_at
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
      setError('Failed to load family groups')
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
          user_id: user.id
        }])

      if (memberError) throw memberError

      setNewGroupName('')
      setShowCreateModal(false)
      await fetchUserGroups()
    } catch (error: any) {
      console.error('Error creating group:', error)
      setError('Failed to create family group')
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
          user_id: user.id
        }])

      if (memberError) throw memberError

      setInviteCode('')
      setShowJoinModal(false)
      await fetchUserGroups()
    } catch (error: any) {
      console.error('Error joining group:', error)
      setError('Failed to join family group. Please check the invite code.')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  // Loading state
  if (isLoading) {
    return (
      <AppLayout 
        user={user} 
        title="Family Management"
        showUserControls={true}
        onLogout={handleLogout}
        isOnline={isOnline}
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <h2 className="text-lg font-medium">Loading your families...</h2>
            <p className="text-muted-foreground">Setting up your family space</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout 
      user={user} 
      title="Family Management"
      showUserControls={true}
      onLogout={handleLogout}
      isOnline={isOnline}
    >
      <div className="p-6 max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Users className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Welcome to Family OS
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Choose a family to manage or create a new one to get started
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 max-w-2xl mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Family Groups Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-12">
          {groups.map((group) => (
            <Card key={group.id} className="group cursor-pointer hover:shadow-xl transition-all duration-300 bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/20 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Home className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{group.name}</h3>
                <Button 
                  onClick={() => onGroupJoined(group)}
                  className="w-full mb-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  size="lg"
                  disabled={!isOnline}
                >
                  Enter Family
                </Button>
                <div className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-700 rounded-full px-3 py-1">
                  Code: {group.invite_code}
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
                No families yet
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Create your first family or join an existing one to get started with Family OS
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <Button 
            onClick={() => setShowCreateModal(true)}
            disabled={!isOnline}
            size="lg"
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Family
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowJoinModal(true)}
            disabled={!isOnline}
            size="lg"
            className="flex-1 border-2"
          >
            <Users className="h-5 w-5 mr-2" />
            Join Family
          </Button>
        </div>

        {/* Create Family Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Create New Family</DialogTitle>
              <DialogDescription>
                Give your family a name to get started. You'll be able to invite other members later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="family-name" className="text-sm font-medium">Family Name</Label>
                <Input
                  id="family-name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="The Smith Family"
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
                  Create Family
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateModal(false)}
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Join Family Modal */}
        <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Join Family</DialogTitle>
              <DialogDescription>
                Enter the invite code shared by your family member to join their family.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-code" className="text-sm font-medium">Invite Code</Label>
                <Input
                  id="invite-code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter invite code"
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
                  Join Family
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowJoinModal(false)}
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
} 