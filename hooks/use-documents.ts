import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  uploadDocument,
  downloadDocument,
  deleteDocument as deleteDocumentUtil,
  triggerFileDownload,
  type DatabaseResult,
  type DocumentUploadData
} from '../lib/document-utils'

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

interface UseDocumentsOptions {
  groupId: string
  currentUserId: string
  isOnline: boolean
}

interface UseDocumentsReturn {
  documents: Document[]
  loading: boolean
  error: string | null
  uploadFile: (file: File, name: string) => Promise<DatabaseResult<string>>
  uploadUrl: (name: string, url: string) => Promise<DatabaseResult<void>>
  downloadFile: (documentId: string) => Promise<void>
  deleteDocument: (documentId: string) => Promise<DatabaseResult<void>>
  refetch: () => Promise<void>
  clearError: () => void
}

export const useDocuments = ({ 
  groupId, 
  currentUserId, 
  isOnline 
}: UseDocumentsOptions): UseDocumentsReturn => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch documents from the database
  const fetchDocuments = async () => {
    if (!isOnline) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setDocuments(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch documents'
      setError(errorMessage)
      console.error('Error fetching documents:', err)
    } finally {
      setLoading(false)
    }
  }

  // Upload a file document
  const uploadFile = async (file: File, name: string): Promise<DatabaseResult<string>> => {
    if (!isOnline) {
      return {
        success: false,
        error: 'Cannot upload files while offline'
      }
    }

    try {
      setError(null)
      const uploadData: DocumentUploadData = {
        name,
        groupId,
        file,
        uploadedBy: currentUserId
      }

      const result = await uploadDocument(uploadData)
      
      if (result.success) {
        // Refresh the documents list
        await fetchDocuments()
      } else {
        setError(result.error || 'Upload failed')
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  // Upload a URL document
  const uploadUrl = async (name: string, url: string): Promise<DatabaseResult<void>> => {
    if (!isOnline) {
      return {
        success: false,
        error: 'Cannot add documents while offline'
      }
    }

    try {
      setError(null)
      const { error: insertError } = await supabase
        .from('documents')
        .insert([{
          group_id: groupId,
          name,
          url,
          uploaded_by: currentUserId,
          file_data: null,
          file_size: null,
          mime_type: null,
          file_extension: null
        }])

      if (insertError) {
        throw new Error(insertError.message)
      }

      // Refresh the documents list
      await fetchDocuments()

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add document'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  // Download a file document
  const downloadFile = async (documentId: string): Promise<void> => {
    if (!isOnline) {
      setError('Cannot download files while offline')
      return
    }

    try {
      setError(null)
      const result = await downloadDocument(documentId)
      
      if (result.success && result.data) {
        triggerFileDownload(result.data.blob, result.data.filename)
      } else {
        setError(result.error || 'Download failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed'
      setError(errorMessage)
      console.error('Error downloading document:', err)
    }
  }

  // Delete a document
  const deleteDocument = async (documentId: string): Promise<DatabaseResult<void>> => {
    if (!isOnline) {
      return {
        success: false,
        error: 'Cannot delete documents while offline'
      }
    }

    try {
      setError(null)
      const result = await deleteDocumentUtil(documentId)
      
      if (result.success) {
        // Refresh the documents list
        await fetchDocuments()
      } else {
        setError(result.error || 'Delete failed')
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  // Clear error state
  const clearError = () => {
    setError(null)
  }

  // Refetch documents
  const refetch = async () => {
    setLoading(true)
    await fetchDocuments()
  }

  // Initial fetch and setup realtime subscription
  useEffect(() => {
    fetchDocuments()

    // Set up realtime subscription for document changes
    if (isOnline) {
      const channel = supabase
        .channel(`documents-${groupId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'documents', 
            filter: `group_id=eq.${groupId}` 
          },
          () => {
            fetchDocuments()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [groupId, isOnline])

  return {
    documents,
    loading,
    error,
    uploadFile,
    uploadUrl,
    downloadFile,
    deleteDocument,
    refetch,
    clearError
  }
} 