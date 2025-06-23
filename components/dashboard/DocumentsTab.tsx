import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent } from '../ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Plus, FileText, ExternalLink, Trash2 } from 'lucide-react'

interface Document {
  id: string
  name: string
  url: string
  created_at: string
}

interface DocumentsTabProps {
  documents: Document[]
  groupId: string
  onUpdate: () => void
  isOnline: boolean
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  groupId,
  onUpdate,
  isOnline
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newDocName, setNewDocName] = useState('')
  const [newDocUrl, setNewDocUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const addDocument = async () => {
    if (!newDocName.trim() || !newDocUrl.trim() || !isOnline) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('documents')
        .insert([{
          group_id: groupId,
          name: newDocName,
          url: newDocUrl
        }])

      if (error) throw error
      
      setNewDocName('')
      setNewDocUrl('')
      setShowCreateModal(false)
      onUpdate()
    } catch (error) {
      console.error('Error adding document:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteDocument = async (docId: string) => {
    if (!isOnline || !confirm('Are you sure you want to delete this document?')) return

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Family Documents</h2>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-lg font-semibold mb-2">
            No documents yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Add your first document to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-xl transition-all duration-200 cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <FileText className="h-8 w-8 text-primary-600 flex-shrink-0" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDocument(doc.id)}
                    disabled={!isOnline}
                    className="text-red-600 hover:text-red-700 px-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {doc.name}
                </h3>
                
                <p className="text-xs text-gray-500 mb-3">
                  Added {formatDate(doc.created_at)}
                </p>
                
                {isOnline ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary-600 hover:text-primary-800 text-sm font-medium transition-colors"
                  >
                    Open Document
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                ) : (
                  <span className="text-gray-500 text-sm">
                    Available when online
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          onClick={() => setShowCreateModal(true)}
          disabled={!isOnline}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <Dialog
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
          </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doc-name">Document Name</Label>
            <Input
              id="doc-name"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              placeholder="Insurance Policy, Recipe, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-url">Document URL</Label>
            <Input
              id="doc-url"
              value={newDocUrl}
              onChange={(e) => setNewDocUrl(e.target.value)}
              placeholder="https://..."
            />
            <p className="text-sm text-muted-foreground">
              Enter a link to your document (Google Drive, Dropbox, etc.)
            </p>
            {newDocUrl && !isValidUrl(newDocUrl) && (
              <p className="text-sm text-destructive">Please enter a valid URL</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={addDocument} 
              className="flex-1"
              disabled={!newDocName.trim() || !newDocUrl.trim() || !isValidUrl(newDocUrl) || isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Document'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false)
                setNewDocName('')
                setNewDocUrl('')
              }}
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