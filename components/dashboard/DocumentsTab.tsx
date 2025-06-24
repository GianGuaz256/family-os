import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { FileUpload } from '../ui/FileUpload'
import { Alert, AlertDescription } from '../ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { 
  Plus, 
  FileText, 
  ExternalLink, 
  Trash2, 
  Download, 
  User, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Link
} from 'lucide-react'
import {
  uploadDocument,
  downloadDocument,
  deleteDocument as deleteDocumentUtil,
  triggerFileDownload,
  formatFileSize,
  getFileTypeIcon,
  type DatabaseResult
} from '../../lib/document-utils'

interface Document {
  id: string
  name: string
  url: string | null
  file_data: Uint8Array | null
  file_size: number | null
  mime_type: string | null
  file_extension: string | null
  uploaded_by: string | null
  created_at: string
  updated_at: string | null
}

interface DocumentsTabProps {
  documents: Document[]
  groupId: string
  onUpdate: () => void
  isOnline: boolean
  currentUserId: string
}

type UploadMode = 'file' | 'url'

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  groupId,
  onUpdate,
  isOnline,
  currentUserId
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [uploadMode, setUploadMode] = useState<UploadMode>('file')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [customFileName, setCustomFileName] = useState('')
  const [newDocName, setNewDocName] = useState('')
  const [newDocUrl, setNewDocUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Listen for custom events from BottomActions
  useEffect(() => {
    const handleOpenModal = (event: CustomEvent) => {
      if (event.detail.type === 'document') {
        setShowCreateModal(true)
      }
    }

    window.addEventListener('openCreateModal', handleOpenModal as EventListener)
    return () => {
      window.removeEventListener('openCreateModal', handleOpenModal as EventListener)
    }
  }, [])

  const resetForm = () => {
    setSelectedFile(null)
    setCustomFileName('')
    setNewDocName('')
    setNewDocUrl('')
    setUploadError(null)
    setUploadProgress(0)
    setUploadMode('file')
  }

  const handleFileSelect = (file: File, fileName: string) => {
    setSelectedFile(file)
    setCustomFileName(fileName)
    setUploadError(null)
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
    setCustomFileName('')
    setUploadError(null)
  }

  const addFileDocument = async () => {
    if (!selectedFile || !customFileName.trim() || !isOnline) return

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const result = await uploadDocument({
        name: customFileName,
        groupId,
        file: selectedFile,
        uploadedBy: currentUserId
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!result.success) {
        setUploadError(result.error || 'Failed to upload document')
        return
      }

      // Success - close modal and refresh
      setTimeout(() => {
        setShowCreateModal(false)
        resetForm()
        onUpdate()
      }, 500)

    } catch (error) {
      console.error('Error uploading file:', error)
      setUploadError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsUploading(false)
    }
  }

  const addUrlDocument = async () => {
    if (!newDocName.trim() || !newDocUrl.trim() || !isOnline) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const { error } = await supabase
        .from('documents')
        .insert([{
          group_id: groupId,
          name: newDocName,
          url: newDocUrl,
          uploaded_by: currentUserId,
          file_data: null,
          file_size: null,
          mime_type: null,
          file_extension: null
        }])

      if (error) throw error
      
      setShowCreateModal(false)
      resetForm()
      onUpdate()
    } catch (error) {
      console.error('Error adding URL document:', error)
      setUploadError(error instanceof Error ? error.message : 'Failed to add document')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async (doc: Document) => {
    if (!doc.file_data) return

    try {
      const result = await downloadDocument(doc.id)
      if (result.success && result.data) {
        triggerFileDownload(result.data.blob, result.data.filename)
      } else {
        console.error('Download failed:', result.error)
      }
    } catch (error) {
      console.error('Error downloading document:', error)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!isOnline || !confirm('Are you sure you want to delete this document?')) return

    try {
      const result = await deleteDocumentUtil(docId)
      if (result.success) {
        onUpdate()
      } else {
        console.error('Delete failed:', result.error)
      }
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

  const getDocumentType = (doc: Document): 'file' | 'url' => {
    return doc.file_data ? 'file' : 'url'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Documents</h2>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-lg font-semibold mb-2">
            No documents yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Upload your first document to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <div className="text-lg sm:text-xl">
                        {getDocumentType(doc) === 'file' && doc.mime_type
                          ? getFileTypeIcon(doc.mime_type)
                          : '🔗'
                        }
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-lg leading-tight break-all">
                        {doc.name.length > 20 
                          ? `${doc.name.slice(0, 8)}...${doc.name.slice(-8)}`
                          : doc.name
                        }
                      </h3>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Added {formatDate(doc.created_at)}
                        </p>
                        {getDocumentType(doc) === 'file' && doc.file_size && (
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(doc.file_size)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    disabled={!isOnline}
                    className="opacity-0 sm:group-hover:opacity-100 text-destructive hover:text-destructive/90 transition-opacity flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                
                <div className="flex gap-2 mt-2">
                  {getDocumentType(doc) === 'file' ? (
                    <Button
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      disabled={!isOnline}
                      className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  ) : doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button size="sm" className="w-full h-8 sm:h-9 text-xs sm:text-sm" disabled={!isOnline}>
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open Link
                      </Button>
                    </a>
                  ) : null}
                </div>

                {!isOnline && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Available when online
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg max-h-[90vh] w-[95vw] sm:w-[90vw] md:w-full p-4 sm:p-6 overflow-y-auto mx-auto my-4">
          <DialogHeader className="space-y-2 pb-3">
            <DialogTitle className="text-lg sm:text-xl font-semibold">Add Document</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Upload a file or add a link to a document
            </DialogDescription>
          </DialogHeader>

          <Tabs value={uploadMode} onValueChange={(value) => setUploadMode(value as UploadMode)} className="mt-4">
            <TabsList className="grid w-full grid-cols-2 h-11">
              <TabsTrigger value="file" className="text-sm">Upload File</TabsTrigger>
              <TabsTrigger value="url" className="text-sm">Add Link</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4 mt-4">
              <FileUpload
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                disabled={!isOnline || isUploading}
                error={uploadError || undefined}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
              />
              
              {selectedFile && (
                <div className="flex flex-col gap-3 pt-2">
                  <Button 
                    onClick={addFileDocument} 
                    className="w-full h-12 text-sm font-medium"
                    disabled={!customFileName.trim() || isUploading || !isOnline}
                  >
                    {isUploading ? 'Uploading...' : 'Upload Document'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false)
                      resetForm()
                    }}
                    disabled={isUploading}
                    className="w-full h-12 text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="doc-name" className="text-sm font-medium">Document Name</Label>
                <Input
                  id="doc-name"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="Insurance Policy, Recipe, etc."
                  disabled={isUploading}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-url" className="text-sm font-medium">Document URL</Label>
                <Input
                  id="doc-url"
                  value={newDocUrl}
                  onChange={(e) => setNewDocUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={isUploading}
                  className="h-12"
                />
                <p className="text-sm text-muted-foreground">
                  Enter a link to your document
                </p>
                {newDocUrl && !isValidUrl(newDocUrl) && (
                  <p className="text-sm text-destructive">Please enter a valid URL</p>
                )}
              </div>

              {uploadError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{uploadError}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <Button 
                  onClick={addUrlDocument} 
                  className="w-full h-12 text-sm font-medium"
                  disabled={!newDocName.trim() || !newDocUrl.trim() || !isValidUrl(newDocUrl) || isUploading || !isOnline}
                >
                  {isUploading ? 'Adding...' : 'Add Document'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  disabled={isUploading}
                  className="w-full h-12 text-sm"
                >
                  Cancel
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
} 