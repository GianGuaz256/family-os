import { useCallback, useState } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Progress } from './progress'
import { Alert, AlertDescription } from './alert'
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { validateFile, formatFileSize, getFileTypeIcon, type FileValidationResult } from '../../lib/document-utils'
import { cn } from '../../lib/utils'

interface FileUploadProps {
  onFileSelect: (file: File, fileName: string) => void
  onFileRemove: () => void
  disabled?: boolean
  accept?: string
  maxSize?: number
  className?: string
  error?: string
  isUploading?: boolean
  uploadProgress?: number
}

interface FilePreview {
  file: File
  fileName: string
  validation: FileValidationResult
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileRemove,
  disabled = false,
  accept,
  maxSize,
  className,
  error,
  isUploading = false,
  uploadProgress = 0
}) => {
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null)
  const [customFileName, setCustomFileName] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [internalError, setInternalError] = useState<string | null>(null)

  const handleFileValidation = useCallback((file: File) => {
    setInternalError(null)
    const validation = validateFile(file)
    
    if (!validation.isValid) {
      setInternalError(validation.error || 'File validation failed')
      return null
    }

    const preview: FilePreview = {
      file,
      fileName: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension for customization
      validation
    }

    setFilePreview(preview)
    setCustomFileName(preview.fileName)
    return preview
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    if (disabled || isUploading) return

    const preview = handleFileValidation(file)
    if (preview) {
      onFileSelect(file, preview.fileName)
    }
  }, [disabled, isUploading, handleFileValidation, onFileSelect])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    if (!disabled && !isUploading) {
      setIsDragOver(true)
    }
  }, [disabled, isUploading])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)

    if (disabled || isUploading) return

    const files = event.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [disabled, isUploading, handleFileSelect])

  const handleRemoveFile = () => {
    setFilePreview(null)
    setCustomFileName('')
    setInternalError(null)
    onFileRemove()
  }

  const handleFileNameChange = (newName: string) => {
    setCustomFileName(newName)
    if (filePreview) {
      onFileSelect(filePreview.file, newName)
    }
  }

  const displayError = error || internalError

  return (
    <div className={cn('space-y-4', className)}>
      {!filePreview ? (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors',
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 dark:border-gray-600',
            disabled || isUploading
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer hover:border-primary hover:bg-primary/5'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isUploading) {
              document.getElementById('file-upload-input')?.click()
            }
          }}
        >
          <Upload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-2 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">
            {isDragOver ? 'Drop file here' : 'Upload Document'}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4">
            Drag and drop a file here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Supports PDF, Word, Excel, PowerPoint, text, and images up to 5MB
          </p>
          <input
            id="file-upload-input"
            type="file"
            accept={accept || '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg'}
            onChange={handleInputChange}
            disabled={disabled || isUploading}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {/* File Preview */}
          <div className="border rounded-lg p-3 sm:p-4 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2 sm:gap-3 flex-1">
                  <div className="text-xl sm:text-2xl">
                    {getFileTypeIcon(filePreview.file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base break-all">
                      {filePreview.file.name.length > 15 
                        ? `${filePreview.file.name.slice(0, 5)}...${filePreview.file.name.slice(-5)}`
                        : filePreview.file.name
                      }
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {formatFileSize(filePreview.file.size)} • {filePreview.file.type}
                    </p>
                    {filePreview.validation.isValid && (
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-green-600 mt-1">
                        <CheckCircle className="h-3 w-3" />
                        File is valid
                      </div>
                    )}
                  </div>
                </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                disabled={disabled || isUploading}
                className="text-destructive hover:text-destructive/90"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Custom File Name Input */}
          <div className="space-y-2">
            <Label htmlFor="custom-file-name" className="text-sm font-medium">Document Name</Label>
            <Input
              id="custom-file-name"
              value={customFileName}
              onChange={(e) => handleFileNameChange(e.target.value)}
              placeholder="Enter a custom name"
              disabled={disabled || isUploading}
              className="h-12"
            />
            <p className="text-sm text-muted-foreground">
              This name will identify the document in your family OS
            </p>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {displayError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}
    </div>
  )
} 