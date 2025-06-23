import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Home, Plus, Users } from 'lucide-react'

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your families...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome to Family OS
          </h1>
          <p className="text-muted-foreground">
            Choose a family to manage or create a new one
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {groups.map((group) => (
            <Card key={group.id} className="cursor-pointer hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6 text-center">
                <Home className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">{group.name}</h3>
                <Button 
                  onClick={() => onGroupJoined(group)}
                  className="w-full mb-2"
                  disabled={!isOnline}
                >
                  Enter Family
                </Button>
                <p className="text-xs text-muted-foreground">
                  Invite Code: {group.invite_code}
                </p>
              </CardContent>
            </Card>
          ))}
          
          {groups.length === 0 && (
            <div className="col-span-full text-center py-8">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                No families yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Create your first family or join an existing one to get started
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-4 justify-center">
          <Button 
            onClick={() => setShowCreateModal(true)}
            disabled={!isOnline}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Family
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setShowJoinModal(true)}
            disabled={!isOnline}
          >
            <Users className="h-4 w-4 mr-2" />
            Join Family
          </Button>
        </div>

        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Family</DialogTitle>
              <DialogDescription>
                Give your family a name to get started
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="family-name">Family Name</Label>
                <Input
                  id="family-name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="The Smith Family"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createGroup} className="flex-1">
                  Create Family
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join Family</DialogTitle>
              <DialogDescription>
                Enter the invite code shared by your family
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-code">Invite Code</Label>
                <Input
                  id="invite-code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter invite code"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={joinGroup} className="flex-1">
                  Join Family
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowJoinModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 