import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardHeader, CardContent, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Separator } from '../ui/separator'
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Bell, 
  Palette,
  Globe,
  Smartphone,
  Save,
  Check
} from 'lucide-react'

interface SettingsTabProps {
  user: User
  isOnline: boolean
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  user,
  isOnline
}) => {
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    // Initialize display name from user metadata
    if (user?.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name)
    }
  }, [user])

  const saveProfile = async () => {
    if (!isOnline) return
    
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      })

      if (error) throw error
      
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={user.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Your email cannot be changed from here
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              disabled={!isOnline}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={saveProfile}
              disabled={!isOnline || isLoading || !displayName.trim()}
              className="flex items-center gap-2"
            >
              {isSaved ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Account Created</Label>
              <p className="text-sm text-muted-foreground">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Last Sign In</Label>
              <p className="text-sm text-muted-foreground">
                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">User ID</Label>
            <p className="text-xs text-muted-foreground font-mono">
              {user.id}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preferences - Coming Soon */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Preferences
            <span className="text-xs bg-muted px-2 py-1 rounded-full">Coming Soon</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Notification Settings</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>Language & Region</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span>App Preferences</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offline Notice */}
      {!isOnline && (
        <Alert>
          <AlertDescription>
            Some settings may not be available while offline.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
} 