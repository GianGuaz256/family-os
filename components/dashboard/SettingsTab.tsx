import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardHeader, CardContent, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { IconSelector } from '../ui/IconSelector'
import { LanguageSelector } from '../ui/LanguageSelector'
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Bell, 
  Palette,
  Globe,
  Smartphone,
  Save,
  Check,
  Edit3,
  Camera
} from 'lucide-react'

interface SettingsTabProps {
  user: User
  isOnline: boolean
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  user,
  isOnline
}) => {
  const { t } = useTranslation()
  const [displayName, setDisplayName] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showImageSelector, setShowImageSelector] = useState(false)
  const [isUpdatingImage, setIsUpdatingImage] = useState(false)

  useEffect(() => {
    // Initialize display name and profile image from user metadata
    if (user?.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name)
    }
    if (user?.user_metadata?.profile_image) {
      setProfileImage(user.user_metadata.profile_image)
    }
  }, [user])

  const saveProfile = async () => {
    if (!isOnline) return
    
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          display_name: displayName,
          profile_image: profileImage
        }
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

  const updateProfileImage = async (newImage: string) => {
    if (!isOnline) return
    
    setIsUpdatingImage(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          profile_image: newImage
        }
      })

      if (error) throw error
      
      setProfileImage(newImage)
      setShowImageSelector(false)
    } catch (error) {
      console.error('Error updating profile image:', error)
    } finally {
      setIsUpdatingImage(false)
    }
  }

  const renderProfileImage = (image?: string) => {
    if (!image) return null
    
    if (image.startsWith('lucide:')) {
      const iconName = image.replace('lucide:', '')
      const iconMap: { [key: string]: any } = {
        'User': UserIcon,
        'Star': UserIcon,
        'Heart': UserIcon,
        'Crown': UserIcon,
        'Sun': UserIcon,
        'Moon': UserIcon,
        'Flower': UserIcon,
        'Camera': Camera
      }
      const LucideIcon = iconMap[iconName] || UserIcon
      return <LucideIcon className="h-10 w-10 text-primary-foreground" />
    } else if (image.startsWith('http')) {
      return <AvatarImage src={image} alt="Profile picture" className="object-cover" />
    } else {
      // Emoji - make it bigger and centered for the large avatar
      return (
        <div className="flex items-center justify-center w-full h-full">
          <span className="text-3xl leading-none">{image}</span>
        </div>
      )
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('settings.title')}</h2>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            {t('settings.profile')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile Image Section */}
          <div className="space-y-2">
            <Label>{t('settings.profilePicture')}</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {profileImage ? (
                  renderProfileImage(profileImage)
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {user.email?.[0].toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImageSelector(true)}
                  disabled={!isOnline || isUpdatingImage}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  {isUpdatingImage ? t('common.updating') : t('settings.changePicture')}
                </Button>
                {profileImage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateProfileImage('')}
                    disabled={!isOnline || isUpdatingImage}
                    className="text-muted-foreground"
                  >
                    {t('settings.removePicture')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('settings.emailAddress')}</Label>
            <Input
              id="email"
              value={user.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              {t('settings.emailCannotChange')}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="display-name">{t('settings.displayName')}</Label>
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
                  {t('common.saved')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isLoading ? t('common.saving') : t('common.save')}
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

      {/* Language Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('settings.language')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LanguageSelector user={user} />
        </CardContent>
      </Card>

      {/* Other Preferences - Coming Soon */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t('settings.theme')}
            <span className="text-xs bg-muted px-2 py-1 rounded-full">Coming Soon</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>{t('settings.notifications')}</span>
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
            {t('errors.networkError')}
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Image Selector */}
      <IconSelector
        currentIcon={profileImage || '😀'}
        onIconSelect={updateProfileImage}
        open={showImageSelector}
        onOpenChange={setShowImageSelector}
        type="profile"
      />
    </div>
  )
} 