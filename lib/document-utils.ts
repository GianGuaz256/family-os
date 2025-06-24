import { supabase } from './supabase'

// File upload constraints
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
]

// File type icons mapping
export const FILE_TYPE_ICONS: { [key: string]: string } = {
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'application/vnd.ms-powerpoint': '📺',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📺',
  'text/plain': '📄',
  'text/csv': '📊',
  'image/jpeg': '🖼️',
  'image/jpg': '🖼️',
  'image/png': '🖼️',
  'image/gif': '🖼️',
  'image/webp': '🖼️',
  'image/svg+xml': '🖼️'
}

export interface FileValidationResult {
  isValid: boolean
  error?: string
  fileInfo?: {
    name: string
    size: number
    type: string
    extension: string
  }
}

export interface DocumentUploadData {
  name: string
  groupId: string
  file: File
  uploadedBy: string
}

export interface DatabaseResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Validates a file for document upload
 */
export const validateFile = (file: File): FileValidationResult => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds 5MB limit. Current size: ${formatFileSize(file.size)}`
    }
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `File type '${file.type}' is not supported. Please upload PDF, Word, Excel, PowerPoint, text, or image files.`
    }
  }

  // Extract file extension
  const extension = file.name.split('.').pop()?.toLowerCase() || ''

  return {
    isValid: true,
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      extension
    }
  }
}

/**
 * Formats file size for display
 */
export const formatFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(sizeInBytes) / Math.log(k))
  
  return `${(sizeInBytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

/**
 * Gets the appropriate icon for a file type
 */
export const getFileTypeIcon = (mimeType: string): string => {
  return FILE_TYPE_ICONS[mimeType] || '📄'
}

/**
 * Converts a File object to a Uint8Array for database storage
 */
export const fileToUint8Array = async (file: File): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result))
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'))
      }
    }
    
    reader.onerror = () => reject(new Error('File reading failed'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Converts Uint8Array back to a downloadable blob
 */
export const uint8ArrayToBlob = (data: Uint8Array, mimeType: string): Blob => {
  return new Blob([data], { type: mimeType })
}

/**
 * Creates a download URL for a document
 */
export const createDownloadUrl = (data: Uint8Array, mimeType: string): string => {
  const blob = uint8ArrayToBlob(data, mimeType)
  return URL.createObjectURL(blob)
}

/**
 * Uploads a document file to the database
 */
export const uploadDocument = async (uploadData: DocumentUploadData): Promise<DatabaseResult<string>> => {
  try {
    // Validate the file
    const validation = validateFile(uploadData.file)
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      }
    }

    // Convert file to Uint8Array
    const fileData = await fileToUint8Array(uploadData.file)

    // Insert into database
    const { data, error } = await supabase
      .from('documents')
      .insert({
        group_id: uploadData.groupId,
        name: uploadData.name,
        file_data: fileData,
        file_size: uploadData.file.size,
        mime_type: uploadData.file.type,
        file_extension: validation.fileInfo?.extension,
        uploaded_by: uploadData.uploadedBy,
        url: null // Explicitly set to null since we're storing file data
      })
      .select('id')
      .single()

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: `Failed to save document: ${error.message}`
      }
    }

    return {
      success: true,
      data: data.id
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Downloads a document from the database
 */
export const downloadDocument = async (documentId: string): Promise<DatabaseResult<{ blob: Blob; filename: string }>> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('name, file_data, mime_type, file_extension')
      .eq('id', documentId)
      .single()

    if (error) {
      return {
        success: false,
        error: `Failed to fetch document: ${error.message}`
      }
    }

    if (!data.file_data) {
      return {
        success: false,
        error: 'Document file data not found'
      }
    }

    // Convert Uint8Array back to Blob
    const blob = uint8ArrayToBlob(data.file_data, data.mime_type || 'application/octet-stream')
    
    // Create filename with extension
    const filename = data.file_extension 
      ? `${data.name}.${data.file_extension}`
      : data.name

    return {
      success: true,
      data: { blob, filename }
    }
  } catch (error) {
    console.error('Download error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Triggers a file download in the browser
 */
export const triggerFileDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Deletes a document from the database
 */
export const deleteDocument = async (documentId: string): Promise<DatabaseResult<void>> => {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (error) {
      return {
        success: false,
        error: `Failed to delete document: ${error.message}`
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
} 