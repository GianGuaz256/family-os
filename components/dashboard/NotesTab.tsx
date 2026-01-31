import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Card } from '../ui/card'
import { AppHeader } from '../ui/AppHeader'
import { usePermissions } from '../../hooks/use-permissions'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '../ui/sheet'
import { AppConfig } from '../../lib/app-types'
import { 
  Star, 
  Trash2, 
  Edit3,
  Eye,
  Calendar,
  Lock,
  Unlock
} from 'lucide-react'

interface Note {
  id: string
  group_id: string
  title: string
  content: string
  is_important: boolean
  created_by: string
  created_at: string
  updated_at: string
  edit_mode: 'private' | 'public'
  updated_by: string | null
  creator_profile?: {
    email: string | null
    display_name: string | null
    profile_image: string | null
  }
}

interface NotesTabProps {
  notes: Note[]
  groupId: string
  onUpdate: () => void
  isOnline: boolean
  currentUserId: string
  isGroupOwner: boolean
  appConfig?: AppConfig
}

export const NotesTab: React.FC<NotesTabProps> = ({
  notes,
  groupId,
  onUpdate,
  isOnline,
  currentUserId,
  isGroupOwner,
  appConfig
}) => {
  // Get permissions for current user
  const { 
    canCreate, 
    canModify, 
    canDelete, 
    isOwner, 
    isMember, 
    isViewer,
    role
  } = usePermissions({
    groupId,
    userId: currentUserId
  })
  
  // Create note modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteContent, setNewNoteContent] = useState('')
  
  // Sheet states (unified view/edit)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  
  // Other states
  const [showConfirmImportant, setShowConfirmImportant] = useState(false)
  const [noteToToggle, setNoteToToggle] = useState<Note | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Drag handle ref for drag-to-close
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef<number>(0)
  const isDragging = useRef<boolean>(false)

  // Listen for custom events from BottomActions
  useEffect(() => {
    const handleOpenModal = (event: CustomEvent) => {
      if (event.detail.type === 'note') {
        setShowCreateModal(true)
      }
    }

    window.addEventListener('openCreateModal', handleOpenModal as EventListener)
    return () => {
      window.removeEventListener('openCreateModal', handleOpenModal as EventListener)
    }
  }, [])

  const resetCreateForm = () => {
    setNewNoteTitle('')
    setNewNoteContent('')
  }

  const closeSheet = () => {
    setIsSheetOpen(false)
    setIsEditing(false)
    setActiveNote(null)
    setEditTitle('')
    setEditContent('')
  }

  // Drag-to-close handlers
  useEffect(() => {
    if (!isSheetOpen) return
    
    let cleanup: (() => void) | null = null
    
    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const handle = dragHandleRef.current
      if (!handle) return

      const getSheetContent = (): HTMLElement | null => {
        // Try multiple selectors to find the sheet content
        let element = handle.closest('[data-radix-dialog-content]') as HTMLElement
        if (element) return element
        
        element = handle.closest('[role="dialog"]') as HTMLElement
        if (element) return element
        
        // Fallback: find by querying the document
        element = document.querySelector('[data-radix-dialog-content][data-state="open"]') as HTMLElement
        if (element) return element
        
        // Last resort: traverse up the DOM tree
        let parent = handle.parentElement
        while (parent) {
          if (parent.hasAttribute('data-radix-dialog-content') || parent.getAttribute('role') === 'dialog') {
            return parent
          }
          parent = parent.parentElement
        }
        
        return null
      }

      const handleTouchStart = (e: TouchEvent) => {
        e.stopPropagation()
        dragStartY.current = e.touches[0].clientY
        isDragging.current = true
      }

      const handleTouchMove = (e: TouchEvent) => {
        if (!isDragging.current) return
        e.preventDefault()
        e.stopPropagation()
        
        const currentY = e.touches[0].clientY
        const deltaY = currentY - dragStartY.current
        
        // Only allow dragging down
        if (deltaY > 0) {
          const sheetContent = getSheetContent()
          if (sheetContent) {
            const translateY = Math.min(deltaY, 200)
            sheetContent.style.transform = `translateY(${translateY}px)`
            sheetContent.style.transition = 'none'
          }
        }
      }

      const handleTouchEnd = (e: TouchEvent) => {
        if (!isDragging.current) return
        isDragging.current = false
        
        const currentY = e.changedTouches[0].clientY
        const deltaY = currentY - dragStartY.current
        
        const sheetContent = getSheetContent()
        if (sheetContent) {
          sheetContent.style.transition = 'transform 0.2s ease-out'
          
          // If dragged down more than 80px, close the sheet
          if (deltaY > 80) {
            setIsSheetOpen(false)
            setIsEditing(false)
            setActiveNote(null)
            setEditTitle('')
            setEditContent('')
          } else {
            // Snap back
            sheetContent.style.transform = ''
          }
        }
      }

      // Make the drag handle and header area draggable
      const headerArea = handle.nextElementSibling as HTMLElement
      
      handle.addEventListener('touchstart', handleTouchStart, { passive: false })
      handle.addEventListener('touchmove', handleTouchMove, { passive: false })
      handle.addEventListener('touchend', handleTouchEnd, { passive: false })
      
      if (headerArea) {
        headerArea.addEventListener('touchstart', handleTouchStart, { passive: false })
        headerArea.addEventListener('touchmove', handleTouchMove, { passive: false })
        headerArea.addEventListener('touchend', handleTouchEnd, { passive: false })
      }

      cleanup = () => {
        handle.removeEventListener('touchstart', handleTouchStart)
        handle.removeEventListener('touchmove', handleTouchMove)
        handle.removeEventListener('touchend', handleTouchEnd)
        
        if (headerArea) {
          headerArea.removeEventListener('touchstart', handleTouchStart)
          headerArea.removeEventListener('touchmove', handleTouchMove)
          headerArea.removeEventListener('touchend', handleTouchEnd)
        }
      }
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      if (cleanup) cleanup()
    }
  }, [isSheetOpen])

  const createNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim() || !isOnline) return

    // Check permissions
    if (!canCreate) {
      toast.error('Permission denied', {
        description: 'You do not have permission to create notes.'
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('notes')
        .insert([{
          group_id: groupId,
          title: newNoteTitle.trim(),
          content: newNoteContent.trim(),
          is_important: false,
          created_by: currentUserId,
          edit_mode: 'public' // Set default edit mode
        }])

      if (error) {
        console.error('Error creating note:', error)
        toast.error('Failed to create note', {
          description: error.message || 'An error occurred while creating the note.'
        })
        throw error
      }
      
      toast.success('Note created', {
        description: 'Your note has been created successfully.'
      })
      setShowCreateModal(false)
      resetCreateForm()
      onUpdate()
    } catch (error) {
      console.error('Error creating note:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateNote = async () => {
    if (!activeNote || !editTitle.trim() || !editContent.trim() || !isOnline) return

    // Check permissions
    const modifyCheck = canModify(activeNote)
    if (!modifyCheck.allowed) {
      toast.error('Permission denied', {
        description: modifyCheck.reason || 'You do not have permission to edit this note.'
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title: editTitle.trim(),
          content: editContent.trim()
        })
        .eq('id', activeNote.id)

      if (error) {
        console.error('Error updating note:', error)
        toast.error('Failed to update note', {
          description: error.message || 'An error occurred while updating the note.'
        })
        throw error
      }
      
      toast.success('Note updated', {
        description: 'Your changes have been saved successfully.'
      })
      closeSheet()
      onUpdate()
    } catch (error) {
      console.error('Error updating note:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteNote = async (noteId: string) => {
    if (!isOnline) return

    const note = notes.find(n => n.id === noteId)
    if (!note) return

    // Check permissions
    const deleteCheck = canDelete(note)
    if (!deleteCheck.allowed) {
      toast.error('Permission denied', {
        description: deleteCheck.reason || 'You do not have permission to delete this note.'
      })
      return
    }

    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)

      if (error) {
        console.error('Error deleting note:', error)
        toast.error('Failed to delete note', {
          description: error.message || 'An error occurred while deleting the note.'
        })
        throw error
      }
      
      toast.success('Note deleted', {
        description: 'The note has been deleted successfully.'
      })
      closeSheet()
      onUpdate()
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const handleNoteClick = (note: Note) => {
    setActiveNote(note)
    setEditTitle(note.title)
    setEditContent(note.content)
    setIsEditing(false)
    setIsSheetOpen(true)
  }

  const handleToggleEditMode = () => {
    setIsEditing(!isEditing)
  }

  const handleCancelEdit = () => {
    if (activeNote) {
      setEditTitle(activeNote.title)
      setEditContent(activeNote.content)
      setIsEditing(false)
    }
  }

  const handleToggleImportant = (note: Note, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!isOwner || !isOnline) return
    
    setNoteToToggle(note)
    setShowConfirmImportant(true)
  }

  const handleToggleLock = async (note: Note) => {
    if (!isOwner || !isOnline) return

    const newEditMode = note.edit_mode === 'private' ? 'public' : 'private'
    
    try {
      const { error } = await supabase
        .from('notes')
        .update({ edit_mode: newEditMode })
        .eq('id', note.id)

      if (error) {
        console.error('Error toggling lock:', error)
        toast.error('Failed to update note', {
          description: error.message || 'An error occurred while updating the note.'
        })
        throw error
      }

      toast.success(
        newEditMode === 'private' ? 'Note locked' : 'Note unlocked',
        {
          description: newEditMode === 'private'
            ? 'Only you can edit this note now.'
            : 'All members can now edit this note.'
        }
      )
      onUpdate()
    } catch (error) {
      console.error('Error toggling lock:', error)
    }
  }

  const confirmToggleImportant = async () => {
    if (!noteToToggle) return

    try {
      // If marking as important, first unmark all other important notes in the group
      if (!noteToToggle.is_important) {
        const { error: unmarkError } = await supabase
          .from('notes')
          .update({ is_important: false })
          .eq('group_id', groupId)
          .eq('is_important', true)
          .neq('id', noteToToggle.id)

        if (unmarkError) {
          console.error('Error unmarking notes:', unmarkError)
          toast.error('Failed to update note', {
            description: unmarkError.message || 'An error occurred.'
          })
          throw unmarkError
        }
      }

      // Now toggle the current note's importance
      const { error } = await supabase
        .from('notes')
        .update({ is_important: !noteToToggle.is_important })
        .eq('id', noteToToggle.id)

      if (error) {
        console.error('Error toggling importance:', error)
        toast.error('Failed to update note', {
          description: error.message || 'An error occurred while updating the note.'
        })
        throw error
      }
      
      toast.success(
        noteToToggle.is_important ? 'Removed from important' : 'Marked as important',
        {
          description: noteToToggle.is_important 
            ? 'Note is no longer marked as important.'
            : 'This note is now marked as important for the family.'
        }
      )
      onUpdate()
      setShowConfirmImportant(false)
      setNoteToToggle(null)
    } catch (error) {
      console.error('Error toggling note importance:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getPreviewText = (content: string, maxLength: number = 80) => {
    const plainText = content
      .replace(/\n+/g, ' ')
      .trim()

    return plainText.length > maxLength ? `${plainText.slice(0, maxLength)}...` : plainText
  }

  const sortedNotes = notes.sort((a, b) => {
    // Important notes first, then by creation date (newest first)
    if (a.is_important && !b.is_important) return -1
    if (!a.is_important && b.is_important) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="space-y-6">
      {/* App Header with icon and styling */}
      {appConfig && (
        <AppHeader
          title={appConfig.name}
          appIcon={appConfig.icon}
          appColor={appConfig.color}
          appDescription={appConfig.description}
          transparent={true}
          showUserControls={false}
        />
      )}
      
      {/* Header */}
      {!appConfig && (
        <h2 className="text-xl sm:text-2xl font-bold">Notes</h2>
      )}

      {/* Notes Grid */}
      {sortedNotes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-semibold mb-2">
            No notes yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first note to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sortedNotes.map((note) => (
            <Card 
              key={note.id} 
              className={`p-3 cursor-pointer hover:shadow-md transition-shadow duration-200 ${
                note.is_important ? 'ring-2 ring-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20' : ''
              }`}
              onClick={() => handleNoteClick(note)}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-sm font-medium truncate flex-1">{note.title}</h3>
                {note.is_important && (
                  <Star className="h-3 w-3 text-amber-500 fill-current flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {getPreviewText(note.content)}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar className="h-2.5 w-2.5" />
                <span>{formatDate(note.created_at)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Note Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
            <DialogDescription>
              Write a new note for your family.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Enter note title..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Content</Label>
              <Textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Write your note content..."
                className="mt-1 min-h-[300px] text-sm resize-none"
                rows={12}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateModal(false)
                  resetCreateForm()
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={createNote}
                disabled={!newNoteTitle.trim() || !newNoteContent.trim() || isLoading || !isOnline}
              >
                {isLoading ? 'Creating...' : 'Create Note'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View/Edit Note Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
          {activeNote && (
            <>
              {/* Drag Handle */}
              <div 
                ref={dragHandleRef}
                className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
                style={{ touchAction: 'pan-y', WebkitUserSelect: 'none', userSelect: 'none' }}
              >
                <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
              </div>
              
              <SheetHeader className="px-4 sm:px-6 pt-2 sm:pt-4 pb-3 sm:pb-4 border-b select-none" style={{ touchAction: 'pan-y' }}>
                {/* Icons row on top */}
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  {/* View/Edit toggle - only show if user can modify */}
                  {activeNote && canModify(activeNote).allowed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleEditMode}
                      disabled={!isOnline}
                      className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                    >
                      {isEditing ? (
                        <>
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                          <span className="hidden sm:inline">View</span>
                        </>
                      ) : (
                        <>
                          <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </>
                      )}
                    </Button>
                  )}
                  
                  {/* Lock/Unlock toggle - only show for owners */}
                  {activeNote && isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleLock(activeNote)}
                      disabled={!isOnline}
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                      title={activeNote.edit_mode === 'private' ? 'Unlock for members' : 'Lock for owner only'}
                    >
                      {activeNote.edit_mode === 'private' ? (
                        <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      ) : (
                        <Unlock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                  )}
                  
                  {/* Star toggle (owner only) */}
                  {activeNote && isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleToggleImportant(activeNote, e)}
                      disabled={!isOnline}
                      className={`h-8 w-8 sm:h-9 sm:w-9 p-0 ${
                        activeNote.is_important ? 'text-amber-500' : ''
                      }`}
                      title={activeNote.is_important ? 'Remove from important' : 'Mark as important'}
                    >
                      <Star className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${activeNote.is_important ? 'fill-current' : ''}`} />
                    </Button>
                  )}
                  
                  {/* Delete button - only show if user can delete */}
                  {activeNote && canDelete(activeNote).allowed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNote(activeNote.id)}
                      disabled={!isOnline}
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-destructive hover:text-destructive/90"
                      title="Delete note"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  )}
                  
                  {/* Lock indicator for viewers/members */}
                  {activeNote && activeNote.edit_mode === 'private' && !isOwner && (
                    <div className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center text-muted-foreground" title="Locked by owner">
                      <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                  )}
                  
                  {/* Date info */}
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
                    <Calendar className="h-2.5 w-2.5" />
                    <span>{formatDate(activeNote.created_at)}</span>
                  </div>
                </div>
                
                {/* Title row below icons */}
                {isEditing ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-base font-semibold"
                    placeholder="Note title..."
                  />
                ) : (
                  <SheetTitle className="text-base font-semibold">
                    {activeNote.title}
                  </SheetTitle>
                )}
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
                {isEditing ? (
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-full text-sm resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                    placeholder="Write your note content..."
                  />
                ) : (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {activeNote.content}
                  </div>
                )}
              </div>
              
              {isEditing && (
                <SheetFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={handleCancelEdit}
                    className="flex-1 sm:flex-none"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={updateNote}
                    disabled={!editTitle.trim() || !editContent.trim() || isLoading || !isOnline}
                    className="flex-1 sm:flex-none"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </SheetFooter>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirmation Modal for Important Toggle */}
      <Dialog open={showConfirmImportant} onOpenChange={setShowConfirmImportant}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {noteToToggle?.is_important ? 'Remove from Important?' : 'Mark as Important?'}
            </DialogTitle>
            <DialogDescription>
              {noteToToggle?.is_important 
                ? 'This note will no longer be marked as important for the family.'
                : 'This note will be marked as important for the family. Any previously important note will be unmarked.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowConfirmImportant(false)
                setNoteToToggle(null)
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmToggleImportant}
              className={noteToToggle?.is_important ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {noteToToggle?.is_important ? 'Remove' : 'Mark Important'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 