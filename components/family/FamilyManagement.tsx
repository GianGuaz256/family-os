import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, getSiteUrl } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog'
import { 
  ArrowLeft, 
  Users, 
  Trash2, 
  Crown, 
  Calendar,
  AlertTriangle,
  UserPlus,
  Link2,
  Copy,
  Share2,
  Check,
  Edit3,
  Home,
  Heart,
  Star,
  TreePine,
  Flower,
  Sun,
  Moon
} from 'lucide-react'
import { IconSelector } from '../ui/IconSelector'

interface FamilyGroup {
  id: string
  name: string
  owner_id: string
  invite_code: string
  created_at: string
  icon?: string
}

interface FamilyMember {
  id: string
  user_id: string
  created_at: string
  email?: string | null
}

interface FamilyManagementProps {
  user: User
  group: FamilyGroup
  onBack: () => void
  onFamilyDeleted: () => void
  isOnline: boolean
}

export const FamilyManagement: React.FC<FamilyManagementProps> = ({
  user,
  group,
  onBack,
  onFamilyDeleted,
  isOnline
}) => {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false)
  const [showIconSelector, setShowIconSelector] = useState(false)
  const [isUpdatingIcon, setIsUpdatingIcon] = useState(false)
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<FamilyMember | null>(null)
  const [isRemovingMember, setIsRemovingMember] = useState(false)

  useEffect(() => {
    if (isOnline) {
      fetchFamilyMembers()
    }
  }, [isOnline])

  const fetchFamilyMembers = async () => {
    try {
      setError('')
      const { data, error } = await supabase
        .from('group_members')
        .select('id, user_id, created_at')
        .eq('group_id', group.id)

      if (error) throw error
      
      // For now, we'll just use the basic member data
      // In a real app, you might want to create a profiles table
      const membersWithEmails = await Promise.all(
        (data || []).map(async (member: any) => {
          // For now, we can't get email from auth.users directly via query
          // So we'll show the user_id and mark if it's the current user
          return {
            ...member,
            email: member.user_id === user.id ? user.email : null
          }
        })
      )
      
      setMembers(membersWithEmails || [])
    } catch (error: any) {
      console.error('Error fetching family members:', error)
      setError('Failed to load family members')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteFamily = async () => {
    if (!isOnline) return
    
    setIsDeleting(true)
    try {
      setError('')
      
      // First, let's check if we're actually the owner
      if (group.owner_id !== user.id) {
        throw new Error('Only family owners can delete families')
      }
      
      // Delete the family group (CASCADE DELETE will handle related data)
      const { error } = await supabase
        .from('family_groups')
        .delete()
        .eq('id', group.id)
        .eq('owner_id', user.id) // Extra safety check

      if (error) {
        console.error('Error deleting family:', error)
        throw error
      }
      
      console.log('Family deletion completed successfully!')
      setShowDeleteDialog(false)
      onFamilyDeleted()
    } catch (error: any) {
      console.error('Error deleting family:', error)
      setError(`Failed to delete family: ${error.message || 'Unknown error'}. Please try again.`)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const generateInviteLink = () => {
    const baseUrl = getSiteUrl()
    return `${baseUrl}/invite/${group.invite_code}`
  }

  const copyInviteLink = async () => {
    try {
      const inviteLink = generateInviteLink()
      await navigator.clipboard.writeText(inviteLink)
      setInviteLinkCopied(true)
      setTimeout(() => setInviteLinkCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy invite link:', error)
    }
  }

  const shareInviteLink = async () => {
    const inviteLink = generateInviteLink()
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join "${group.name}" on Family OS`,
          text: `You're invited to join "${group.name}" on Family OS!`,
          url: inviteLink
        })
      } catch (error) {
        console.error('Error sharing invite link:', error)
        // Fallback to copy if sharing fails
        copyInviteLink()
      }
    } else {
      // Fallback to copy if Web Share API is not supported
      copyInviteLink()
    }
  }

  const updateFamilyIcon = async (newIcon: string) => {
    if (!isOnline) return
    
    setIsUpdatingIcon(true)
    try {
      setError('')
      
      const { error } = await supabase
        .from('family_groups')
        .update({ icon: newIcon })
        .eq('id', group.id)
        .eq('owner_id', user.id) // Extra safety check

      if (error) throw error
      
      // Update the local group object
      group.icon = newIcon
      
    } catch (error: any) {
      console.error('Error updating family icon:', error)
      setError('Failed to update family icon. Please try again.')
    } finally {
      setIsUpdatingIcon(false)
    }
  }

  const removeMember = async () => {
    if (!isOnline || !memberToRemove) return
    
    setIsRemovingMember(true)
    try {
      setError('')
      
      // Remove the member from the family group
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberToRemove.id)
        .eq('group_id', group.id)

      if (error) throw error
      
      // Update the local members list
      setMembers(prev => prev.filter(member => member.id !== memberToRemove.id))
      
      setShowRemoveMemberDialog(false)
      setMemberToRemove(null)
    } catch (error: any) {
      console.error('Error removing member:', error)
      setError('Failed to remove member. Please try again.')
    } finally {
      setIsRemovingMember(false)
    }
  }

  const handleRemoveMember = (member: FamilyMember) => {
    setMemberToRemove(member)
    setShowRemoveMemberDialog(true)
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
      return <span className="text-lg leading-none">{currentIcon}</span>
    }
  }

  const isOwner = group.owner_id === user.id

  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              Only family owners can access family management settings.
            </p>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <Button 
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="p-2 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">Family Management</h1>
            <p className="text-muted-foreground text-sm sm:text-base truncate">Manage "{group.name}"</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4 sm:mb-6">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 w-full min-w-0">
          {/* Family Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Family Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">Family Icon</label>
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 p-2">
                    {renderFamilyIcon(group.icon)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowIconSelector(true)}
                    disabled={!isOnline || isUpdatingIcon}
                    className="text-xs"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    {isUpdatingIcon ? 'Updating...' : 'Change'}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">Family Name</label>
                <p className="text-base sm:text-lg font-semibold break-words">{group.name}</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">Invite Code</label>
                <p className="font-mono text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 px-2 sm:px-3 py-2 rounded break-all">
                  {group.invite_code}
                </p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">Created</label>
                <p className="flex items-center gap-2 text-sm sm:text-base">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{formatDate(group.created_at)}</span>
                </p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">Total Members</label>
                <p className="text-base sm:text-lg font-semibold">{members.length}</p>
              </div>
            </CardContent>
          </Card>

          {/* Family Members Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Family Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-200 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="h-3 sm:h-4 bg-slate-200 rounded w-24 sm:w-32 mb-1"></div>
                        <div className="h-2 sm:h-3 bg-slate-100 rounded w-16 sm:w-24"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 max-h-56 sm:max-h-64 overflow-y-auto">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                          {member.email?.[0]?.toUpperCase() || member.user_id.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm sm:text-base font-medium truncate">
                            {member.email || `User ${member.user_id.slice(0, 8)}...`}
                          </p>
                          {member.user_id === group.owner_id && (
                            <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {member.user_id === user.id ? 'You' : 'Family Member'}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground hidden sm:block">
                        Joined {formatDate(member.created_at)}
                      </div>
                      <div className="text-xs text-muted-foreground sm:hidden">
                        {formatDate(member.created_at).split(',')[0]}
                      </div>
                      {/* Remove member button - only show for non-owner members */}
                      {member.user_id !== group.owner_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member)}
                          disabled={!isOnline}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                          title="Remove member"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invite Members Card */}
          <Card className="lg:col-span-2 w-full min-w-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">Invite New Members</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="w-full min-w-0">
              <div className="space-y-3 sm:space-y-4 w-full">
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
                  Share this link with family members to invite them to join "{group.name}". 
                  They can sign up or log in and will be automatically added to your family.
                </p>
                
                <div className="w-full overflow-hidden">
                  <div className="flex items-center gap-2 p-2 sm:p-3 bg-slate-50 dark:bg-slate-800 rounded-lg w-full">
                    <Link2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <code className="text-xs sm:text-sm font-mono text-muted-foreground block w-full overflow-hidden text-ellipsis whitespace-nowrap">
                        {generateInviteLink()}
                      </code>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={copyInviteLink}
                        disabled={!isOnline}
                        className="h-6 w-6 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                        title="Copy invite link"
                      >
                        {inviteLinkCopied ? (
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={shareInviteLink}
                        disabled={!isOnline}
                        className="h-6 w-6 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                        title="Share invite link"
                      >
                        <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                  <Button
                    onClick={copyInviteLink}
                    disabled={!isOnline}
                    className="group flex-1 h-12 sm:h-11 text-sm min-w-0 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 dark:from-slate-700 dark:to-slate-800 dark:hover:from-slate-600 dark:hover:to-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 shadow-md hover:shadow-lg transition-all duration-200"
                    variant="outline"
                  >
                    <div className="flex items-center justify-center gap-2">
                      {inviteLinkCopied ? (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                      )}
                      <span className="font-medium truncate">
                        {inviteLinkCopied ? 'Copied!' : 'Copy Link'}
                      </span>
                    </div>
                  </Button>
                  <Button
                    onClick={shareInviteLink}
                    disabled={!isOnline}
                    className="group flex-1 h-12 sm:h-11 text-sm min-w-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Share2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                      <span className="font-medium truncate">Share Link</span>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone */}
        <Card className="mt-6 pt-8 sm:mt-8 border-red-200 dark:border-red-800">
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-red-800 dark:text-red-200 text-sm sm:text-base">Delete Family</h3>
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-300 mt-1">
                  Permanently delete this family and all its data. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={!isOnline}
                className="w-full sm:w-auto h-9 sm:h-10 text-sm flex-shrink-0"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Delete Family
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Delete Family
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{group.name}"? This will permanently remove:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All family members</li>
                  <li>All lists and items</li>
                  <li>All documents</li>
                  <li>All events</li>
                  <li>All cards</li>
                </ul>
                <strong className="text-red-600 dark:text-red-400 block mt-3">
                  This action cannot be undone.
                </strong>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={deleteFamily}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Family'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Member Confirmation Dialog */}
        <Dialog open={showRemoveMemberDialog} onOpenChange={setShowRemoveMemberDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Remove Family Member
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to remove{' '}
                <strong>
                  {memberToRemove?.email || `User ${memberToRemove?.user_id.slice(0, 8)}...`}
                </strong>{' '}
                from "{group.name}"?
                <br />
                <br />
                They will lose access to all family data including lists, documents, events, and cards.
                They can be re-invited later if needed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRemoveMemberDialog(false)
                  setMemberToRemove(null)
                }}
                disabled={isRemovingMember}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={removeMember}
                disabled={isRemovingMember}
              >
                {isRemovingMember ? 'Removing...' : 'Remove Member'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Icon Selector */}
        <IconSelector
          currentIcon={group.icon || '🏠'}
          onIconSelect={updateFamilyIcon}
          open={showIconSelector}
          onOpenChange={setShowIconSelector}
        />
      </div>
    </div>
  )
} 