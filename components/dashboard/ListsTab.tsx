import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardHeader, CardContent } from '../ui/card'
import { Checkbox } from '../ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Plus, Trash2, Check } from 'lucide-react'

interface ListItem {
  id: number
  text: string
  completed: boolean
}

interface List {
  id: string
  title: string
  items: ListItem[]
  created_at: string
}

interface ListsTabProps {
  lists: List[]
  groupId: string
  onUpdate: () => void
  isOnline: boolean
}

export const ListsTab: React.FC<ListsTabProps> = ({
  lists,
  groupId,
  onUpdate,
  isOnline
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [newItems, setNewItems] = useState<{[listId: string]: string}>({})

  // Listen for custom events from BottomActions
  useEffect(() => {
    const handleOpenModal = (event: CustomEvent) => {
      if (event.detail.type === 'list') {
        setShowCreateModal(true)
      }
    }

    window.addEventListener('openCreateModal', handleOpenModal as EventListener)
    return () => {
      window.removeEventListener('openCreateModal', handleOpenModal as EventListener)
    }
  }, [])

  const createList = async () => {
    if (!newListTitle.trim() || !isOnline) return

    try {
      const { error } = await supabase
        .from('lists')
        .insert([{
          group_id: groupId,
          title: newListTitle,
          items: []
        }])

      if (error) throw error
      
      setNewListTitle('')
      setShowCreateModal(false)
      onUpdate()
    } catch (error) {
      console.error('Error creating list:', error)
    }
  }

  const addItemToList = async (listId: string, currentItems: ListItem[]) => {
    const newItemText = newItems[listId]
    if (!newItemText?.trim() || !isOnline) return

    try {
      const updatedItems = [
        ...currentItems,
        { 
          id: Date.now(), 
          text: newItemText, 
          completed: false 
        }
      ]

      const { error } = await supabase
        .from('lists')
        .update({ items: updatedItems })
        .eq('id', listId)

      if (error) throw error
      
      setNewItems(prev => ({ ...prev, [listId]: '' }))
      onUpdate()
    } catch (error) {
      console.error('Error adding item:', error)
    }
  }

  const toggleItem = async (listId: string, itemId: number, currentItems: ListItem[]) => {
    if (!isOnline) return

    try {
      const updatedItems = currentItems.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )

      const { error } = await supabase
        .from('lists')
        .update({ items: updatedItems })
        .eq('id', listId)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error toggling item:', error)
    }
  }

  const deleteItem = async (listId: string, itemId: number, currentItems: ListItem[]) => {
    if (!isOnline) return

    try {
      const updatedItems = currentItems.filter(item => item.id !== itemId)

      const { error } = await supabase
        .from('lists')
        .update({ items: updatedItems })
        .eq('id', listId)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const deleteList = async (listId: string) => {
    if (!isOnline || !confirm('Are you sure you want to delete this list?')) return

    try {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error deleting list:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lists</h2>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-semibold mb-2">
            No lists yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first list to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Card key={list.id} className="h-fit">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <h3 className="text-lg font-semibold truncate">{list.title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteList(list.id)}
                  disabled={!isOnline}
                  className="text-destructive hover:text-destructive/90 px-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                  {list.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2 group">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => toggleItem(list.id, item.id, list.items)}
                        disabled={!isOnline}
                      />
                      <span className={`flex-1 text-sm ${
                        item.completed 
                          ? 'line-through text-muted-foreground' 
                          : ''
                      }`}>
                        {item.text}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteItem(list.id, item.id, list.items)}
                        disabled={!isOnline}
                        className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/90 px-1 py-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {list.items.length === 0 && (
                    <p className="text-muted-foreground text-sm italic">No items yet</p>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add new item..."
                    value={newItems[list.id] || ''}
                    onChange={(e) => setNewItems(prev => ({ 
                      ...prev, 
                      [list.id]: e.target.value 
                    }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addItemToList(list.id, list.items)
                      }
                    }}
                    disabled={!isOnline}
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => addItemToList(list.id, list.items)}
                    disabled={!isOnline || !newItems[list.id]?.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
            <DialogDescription>
              Give your list a title to get started
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="list-title">List Title</Label>
              <Input
                id="list-title"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="Shopping List, To-Do, etc."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    createList()
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createList} className="flex-1">
                Create List
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
    </div>
  )
} 