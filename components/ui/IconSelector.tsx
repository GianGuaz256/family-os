import { useState } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { 
  Home, 
  Heart, 
  Star, 
  Crown, 
  TreePine, 
  Flower, 
  Sun, 
  Moon,
  Camera,
  Upload,
  Palette,
  User
} from 'lucide-react'

interface IconSelectorProps {
  currentIcon?: string
  onIconSelect: (icon: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  type?: 'family' | 'profile'
}

const EMOJI_ICONS = [
  '🏠', '🏡', '🏘️', '🏰', '🏯', '🏛️',
  '❤️', '💙', '💚', '💛', '💜', '🧡',
  '⭐', '✨', '🌟', '💫', '🔥', '💎',
  '🌸', '🌺', '🌻', '🌷', '🌹', '🌼',
  '🌞', '🌙', '⭐', '🌈', '☀️', '🌤️',
  '🎉', '🎊', '🎈', '🎁', '🎂', '🍰',
  '🐶', '🐱', '🐰', '🐻', '🐼', '🦊',
  '🍎', '🍊', '🍋', '🍌', '🍓', '🍇'
]

const PROFILE_EMOJI_ICONS = [
  '😀', '😃', '😄', '😁', '😊', '😇',
  '🙂', '🤗', '🤔', '😎', '🤓', '🧐',
  '👦', '👧', '👨', '👩', '👴', '👵',
  '👶', '🧒', '👱', '👸', '🤴', '👮',
  '🎨', '🎭', '🎪', '🎵', '🎸', '🎹',
  '🌟', '⭐', '💫', '✨', '🔥', '💎',
  '🐶', '🐱', '🐰', '🐻', '🐼', '🦊',
  '🍀', '🌸', '🌺', '🌻', '🌷', '🌹'
]

const LUCIDE_ICONS = [
  { icon: Home, name: 'Home' },
  { icon: Heart, name: 'Heart' },
  { icon: Star, name: 'Star' },
  { icon: Crown, name: 'Crown' },
  { icon: TreePine, name: 'Tree' },
  { icon: Flower, name: 'Flower' },
  { icon: Sun, name: 'Sun' },
  { icon: Moon, name: 'Moon' }
]

const PROFILE_LUCIDE_ICONS = [
  { icon: User, name: 'User' },
  { icon: Star, name: 'Star' },
  { icon: Heart, name: 'Heart' },
  { icon: Crown, name: 'Crown' },
  { icon: Sun, name: 'Sun' },
  { icon: Moon, name: 'Moon' },
  { icon: Flower, name: 'Flower' },
  { icon: Camera, name: 'Camera' }
]

export const IconSelector: React.FC<IconSelectorProps> = ({
  currentIcon = '🏠',
  onIconSelect,
  open,
  onOpenChange,
  title,
  description,
  type = 'family'
}) => {
  const [imageUrl, setImageUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const emojiIcons = type === 'profile' ? PROFILE_EMOJI_ICONS : EMOJI_ICONS
  const lucideIcons = type === 'profile' ? PROFILE_LUCIDE_ICONS : LUCIDE_ICONS
  const defaultTitle = type === 'profile' ? 'Choose Profile Picture' : 'Choose Family Icon'
  const defaultDescription = type === 'profile' 
    ? 'Select an emoji, icon, or upload your own image for your profile.'
    : 'Select an emoji, icon, or upload your own image to represent your family.'

  const handleEmojiSelect = (emoji: string) => {
    onIconSelect(emoji)
    onOpenChange(false)
  }

  const handleLucideSelect = (iconName: string) => {
    onIconSelect(`lucide:${iconName}`)
    onOpenChange(false)
  }

  const handleImageUrl = () => {
    if (imageUrl.trim()) {
      onIconSelect(imageUrl.trim())
      setImageUrl('')
      onOpenChange(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // For demo purposes, we'll use a placeholder URL
    // In a real app, you'd upload to your storage service (Supabase Storage, etc.)
    setIsUploading(true)
    
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For demo, we'll use a placeholder URL
      const demoUrl = type === 'profile' 
        ? `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=center`
        : `https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=100&h=100&fit=crop&crop=center`
      onIconSelect(demoUrl)
      onOpenChange(false)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const renderCurrentIcon = (icon: string) => {
    if (icon.startsWith('lucide:')) {
      const iconName = icon.replace('lucide:', '')
      const iconList = type === 'profile' ? PROFILE_LUCIDE_ICONS : LUCIDE_ICONS
      const LucideIcon = iconList.find(i => i.name === iconName)?.icon || (type === 'profile' ? User : Home)
      return <LucideIcon className="h-6 w-6" />
    } else if (icon.startsWith('http')) {
      return <img src={icon} alt={`${type} icon`} className="h-6 w-6 rounded object-cover" />
    } else {
      return <span className="text-2xl">{icon}</span>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'profile' ? <User className="h-5 w-5" /> : <Palette className="h-5 w-5" />}
            {title || defaultTitle}
          </DialogTitle>
          <DialogDescription>
            {description || defaultDescription}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="emoji" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="emoji">Emojis</TabsTrigger>
            <TabsTrigger value="icons">Icons</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="emoji" className="space-y-4">
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 sm:gap-3 max-h-64 overflow-y-auto p-2">
              {emojiIcons.map((emoji) => (
                <Button
                  key={emoji}
                  variant={currentIcon === emoji ? "default" : "outline"}
                  className="h-10 w-10 sm:h-12 sm:w-12 p-0 text-lg sm:text-2xl hover:scale-110 transition-transform"
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="icons" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {lucideIcons.map(({ icon: Icon, name }) => (
                <Button
                  key={name}
                  variant={currentIcon === `lucide:${name}` ? "default" : "outline"}
                  className="h-14 sm:h-16 w-full flex flex-col gap-1 sm:gap-2 hover:scale-105 transition-transform"
                  onClick={() => handleLucideSelect(name)}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-xs">{name}</span>
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="image-url">Image URL</Label>
                <div className="flex flex-col sm:flex-row gap-2 mt-1">
                  <Input
                    id="image-url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleImageUrl} disabled={!imageUrl.trim()} className="w-full sm:w-auto">
                    Use URL
                  </Button>
                </div>
              </div>

              <div className="text-center">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload an image file
                  </p>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isUploading}
                    />
                    <Button 
                      disabled={isUploading}
                      className="pointer-events-none"
                    >
                      {isUploading ? 'Uploading...' : 'Choose File'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Current Selection Preview */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Current Selection:</span>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
              {renderCurrentIcon(currentIcon)}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 