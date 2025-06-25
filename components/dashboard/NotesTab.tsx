import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Card, CardHeader, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { AppHeader } from '../ui/AppHeader'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { AppConfig } from '../../lib/app-types'
import { 
  Plus, 
  FileText, 
  Star, 
  Trash2, 
  Edit3,
  Calendar,
  User
} from 'lucide-react'
import MDEditor from '@uiw/react-md-editor'

interface Note {
  id: string
  group_id: string
  title: string
  content: string
  is_important: boolean
  created_by: string
  created_at: string
  updated_at: string
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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [showConfirmImportant, setShowConfirmImportant] = useState(false)
  const [noteToToggle, setNoteToToggle] = useState<Note | null>(null)
  
  // Form states
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteContent, setNewNoteContent] = useState('')
  const [editNoteTitle, setEditNoteTitle] = useState('')
  const [editNoteContent, setEditNoteContent] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  const resetEditForm = () => {
    setEditNoteTitle('')
    setEditNoteContent('')
    setEditingNote(null)
  }

  const createNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim() || !isOnline) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('notes')
        .insert([{
          group_id: groupId,
          title: newNoteTitle.trim(),
          content: newNoteContent.trim(),
          is_important: false,
          created_by: currentUserId
        }])

      if (error) throw error
      
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
    if (!editingNote || !editNoteTitle.trim() || !editNoteContent.trim() || !isOnline) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title: editNoteTitle.trim(),
          content: editNoteContent.trim()
        })
        .eq('id', editingNote.id)

      if (error) throw error
      
      setShowEditModal(false)
      resetEditForm()
      onUpdate()
    } catch (error) {
      console.error('Error updating note:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteNote = async (noteId: string) => {
    if (!isOnline || !confirm('Are you sure you want to delete this note?')) return

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const handleViewNote = (note: Note) => {
    setSelectedNote(note)
    setShowViewModal(true)
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setEditNoteTitle(note.title)
    setEditNoteContent(note.content)
    setShowEditModal(true)
  }

  const handleToggleImportant = (note: Note) => {
    if (!isGroupOwner || !isOnline) return
    
    setNoteToToggle(note)
    setShowConfirmImportant(true)
  }

  const confirmToggleImportant = async () => {
    if (!noteToToggle) return

    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_important: !noteToToggle.is_important })
        .eq('id', noteToToggle.id)

      if (error) throw error
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

  const getPreviewText = (content: string, maxLength: number = 100) => {
    // Remove markdown formatting and get plain text
    const plainText = content
      .replace(/#+\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
      .replace(/\n+/g, ' ') // Replace newlines with spaces
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
      <div className="flex justify-between items-center">
        {!appConfig && (
          <h2 className="text-xl sm:text-2xl font-bold">Notes</h2>
        )}
        <div className="flex items-center gap-2">
          {notes.filter(note => note.is_important).length > 0 && (
            <Badge variant="secondary" className="hidden sm:flex">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Important
            </Badge>
          )}
        </div>
      </div>

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedNotes.map((note) => (
            <Card 
              key={note.id} 
              className={`cursor-pointer hover:shadow-lg transition-shadow duration-200 ${
                note.is_important ? 'ring-2 ring-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:ring-amber-800' : ''
              }`}
              onClick={() => handleViewNote(note)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold truncate">{note.title}</h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isGroupOwner ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleImportant(note)
                        }}
                        disabled={!isOnline}
                        className={`h-8 w-8 p-0 ${
                          note.is_important ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'
                        }`}
                        title={note.is_important ? 'Remove from important' : 'Mark as important'}
                      >
                        <Star className={`h-5 w-5 ${note.is_important ? 'fill-current' : ''}`} />
                      </Button>
                    ) : (
                      note.is_important && (
                        <Star className="h-5 w-5 text-amber-500 fill-current" />
                      )
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {getPreviewText(note.content)}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(note.created_at)}</span>
                  </div>
                  {note.created_by === currentUserId && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditNote(note)
                        }}
                        disabled={!isOnline}
                        className="h-8 w-8 p-0"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNote(note.id)
                        }}
                        disabled={!isOnline}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Note Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
            <DialogDescription>
              Write a new note for your family. You can use markdown formatting.
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
              {isMobile ? (
                <Textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Write your note content..."
                  className="mt-1 min-h-[200px] resize-none"
                  rows={8}
                />
              ) : (
                <div className="mt-1" data-color-mode="auto">
                  <MDEditor
                    value={newNoteContent}
                    onChange={(val) => setNewNoteContent(val || '')}
                    height={300}
                    preview="edit"
                    hideToolbar={false}
                    visibleDragbar={false}
                  />
                </div>
              )}
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

      {/* View Note Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedNote && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    {selectedNote.title}
                    {selectedNote.is_important && (
                      <Star className="h-5 w-5 text-amber-500 fill-current" />
                    )}
                  </DialogTitle>
                  {selectedNote.created_by === currentUserId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowViewModal(false)
                        handleEditNote(selectedNote)
                      }}
                      disabled={!isOnline}
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Created {formatDate(selectedNote.created_at)}</span>
                  </div>
                  {selectedNote.updated_at !== selectedNote.created_at && (
                    <div className="flex items-center gap-1">
                      <Edit3 className="h-3 w-3" />
                      <span>Updated {formatDate(selectedNote.updated_at)}</span>
                    </div>
                  )}
                </div>
              </DialogHeader>
              
              <div className="bg-muted/30 rounded-lg p-4 border overflow-hidden">
                <div className="prose prose-sm max-w-none dark:prose-invert bg-background rounded-md p-4 shadow-sm" data-color-mode="auto">
                  <MDEditor.Markdown source={selectedNote.content} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Note Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Make changes to your note. You can use markdown formatting.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editNoteTitle}
                onChange={(e) => setEditNoteTitle(e.target.value)}
                placeholder="Enter note title..."
                className="mt-1"
              />
            </div>



            <div>
              <Label>Content</Label>
              {isMobile ? (
                <Textarea
                  value={editNoteContent}
                  onChange={(e) => setEditNoteContent(e.target.value)}
                  placeholder="Write your note content..."
                  className="mt-1 min-h-[200px] resize-none"
                  rows={8}
                />
              ) : (
                <div className="mt-1" data-color-mode="auto">
                  <MDEditor
                    value={editNoteContent}
                    onChange={(val) => setEditNoteContent(val || '')}
                    height={300}
                    preview="edit"
                    hideToolbar={false}
                    visibleDragbar={false}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditModal(false)
                  resetEditForm()
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={updateNote}
                disabled={!editNoteTitle.trim() || !editNoteContent.trim() || isLoading || !isOnline}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                : 'This note will be marked as important for the family. Only one note can be important at a time.'
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