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

// Magic number signatures for file type validation
const FILE_SIGNATURES: { [mimeType: string]: number[][] } = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'application/msword': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]], // MS Office legacy
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06], [0x50, 0x4B, 0x07, 0x08]], // ZIP-based Office formats
  'application/vnd.ms-excel': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]], // MS Office legacy
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06], [0x50, 0x4B, 0x07, 0x08]], // ZIP-based Office formats
  'application/vnd.ms-powerpoint': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]], // MS Office legacy
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06], [0x50, 0x4B, 0x07, 0x08]], // ZIP-based Office formats
  'image/jpeg': [[0xFF, 0xD8, 0xFF]], // JPEG
  'image/jpg': [[0xFF, 0xD8, 0xFF]], // JPEG
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]], // PNG
  'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]], // GIF87a, GIF89a
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF (WebP starts with RIFF)
  'image/svg+xml': [[0x3C, 0x3F, 0x78, 0x6D, 0x6C], [0x3C, 0x73, 0x76, 0x67]], // <?xml, <svg
  // Text files are harder to validate by magic numbers, so we'll allow them without signature validation
  'text/plain': [],
  'text/csv': []
}

export interface DocumentUploadData {
  name: string
  groupId: string
  file: File
  uploadedBy: string
  editMode?: 'private' | 'public'
  onProgress?: (progress: number) => void
}

export interface DatabaseResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Reads the first bytes of a file to extract magic number/signature
 */
const readFileBytes = async (file: File, numBytes: number = 16): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    const slice = file.slice(0, numBytes)
    
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result))
      } else {
        reject(new Error('Failed to read file bytes'))
      }
    }
    
    reader.onerror = () => reject(new Error('File reading failed'))
    reader.readAsArrayBuffer(slice)
  })
}

/**
 * Validates file magic number/signature against expected patterns
 */
const validateFileSignature = async (file: File, mimeType: string): Promise<boolean> => {
  const signatures = FILE_SIGNATURES[mimeType]
  
  // If no signatures defined for this MIME type, skip validation (like for text files)
  if (!signatures || signatures.length === 0) {
    return true
  }
  
  try {
    // Read enough bytes to check the longest signature (16 bytes should be sufficient)
    const fileBytes = await readFileBytes(file, 16)
    
    // Check if any signature matches
    return signatures.some(signature => {
      if (signature.length > fileBytes.length) {
        return false
      }
      
      // Compare each byte in the signature
      return signature.every((expectedByte, index) => {
        return fileBytes[index] === expectedByte
      })
    })
  } catch (error) {
    console.error('Error reading file signature:', error)
    return false // Fail validation if we can't read the file
  }
}

/**
 * Enhanced file validation result interface
 */
export interface EnhancedFileValidationResult {
  isValid: boolean
  error?: string
  fileInfo?: {
    name: string
    size: number
    type: string
    extension: string
  }
}

/**
 * Basic synchronous file validation (MIME type and size only)
 * @deprecated Use validateFileEnhanced for security-enhanced validation
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
 * Enhanced file validation with magic number verification for security
 */
export const validateFileEnhanced = async (file: File): Promise<EnhancedFileValidationResult> => {
  // Step 1: Basic validation (size and MIME type)
  const basicValidation = validateFile(file)
  if (!basicValidation.isValid) {
    return basicValidation
  }

  // Step 2: Magic number validation for enhanced security
  const isValidSignature = await validateFileSignature(file, file.type)
  if (!isValidSignature) {
    return {
      isValid: false,
      error: `File signature validation failed. The file '${file.name}' may be corrupted or not a genuine ${file.type} file.`
    }
  }

  return {
    isValid: true,
    fileInfo: basicValidation.fileInfo
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
 * Converts a File object to a Uint8Array for database storage with progress tracking
 */
export const fileToUint8Array = async (
  file: File, 
  onProgress?: (progress: number) => void
): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        onProgress?.(100) // File reading complete
        resolve(new Uint8Array(reader.result))
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'))
      }
    }
    
    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 50) // File reading is 50% of total progress
        onProgress(percentComplete)
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
  return new Blob([data as BlobPart], { type: mimeType })
}

/**
 * Creates a download URL for a document
 */
export const createDownloadUrl = (data: Uint8Array, mimeType: string): string => {
  const blob = uint8ArrayToBlob(data, mimeType)
  return URL.createObjectURL(blob)
}

/**
 * Uploads a document file to the database with real progress tracking
 */
export const uploadDocument = async (uploadData: DocumentUploadData): Promise<DatabaseResult<string>> => {
  try {
    const { onProgress, editMode = 'public' } = uploadData
    
    // Step 1: Enhanced file validation with magic number verification (0-10% progress)
    onProgress?.(0)
    const validation = await validateFileEnhanced(uploadData.file)
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      }
    }
    onProgress?.(10)

    // Step 2: Convert file to Uint8Array (10-65% progress)
    const fileData = await fileToUint8Array(uploadData.file, (readProgress) => {
      // Map file reading progress from 10% to 65%
      const mappedProgress = 10 + (readProgress * 0.55)
      onProgress?.(Math.round(mappedProgress))
    })

    // Step 3: Prepare database operation (60-70% progress)
    onProgress?.(70)
    
    // Step 4: Insert into database (70-100% progress)
    onProgress?.(75)
    
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
        created_by: uploadData.uploadedBy,
        edit_mode: editMode,
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

    // Step 5: Complete (100% progress)
    onProgress?.(100)

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