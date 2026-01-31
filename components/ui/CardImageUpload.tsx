import React, { useState, useRef } from 'react'
import { Button } from './button'
import { Alert, AlertDescription } from './alert'
import { Upload, X, FileImage, Loader2 } from 'lucide-react'
import { processCardImage, isValidImageFile, fileToDataURL, initializeOCRWorker, terminateOCRWorker } from '../../lib/card-ocr'
import { ExtractedCardData } from '../../lib/card-ocr'

interface CardImageUploadProps {
  onDataExtracted: (data: ExtractedCardData) => void
  onError?: (error: string) => void
  onCancel?: () => void
}

export const CardImageUpload: React.FC<CardImageUploadProps> = ({
  onDataExtracted,
  onError,
  onCancel
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!isValidImageFile(file)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP)')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file is too large. Please select an image under 10MB.')
      return
    }

    setSelectedFile(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleProcessImage = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setError(null)
    setProgress('Initializing OCR engine...')

    try {
      // Initialize OCR worker
      await initializeOCRWorker()
      setProgress('Reading image...')

      // Convert file to data URL
      const dataURL = await fileToDataURL(selectedFile)
      setProgress('Analyzing card...')

      // Process the image
      const extractedData = await processCardImage(dataURL)
      setProgress('Extraction complete!')

      // Call success callback with extracted data
      onDataExtracted(extractedData)

      // Clean up
      setTimeout(() => {
        handleRemoveFile()
        setProgress('')
      }, 500)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process image'
      console.error('Image processing error:', errorMsg)
      setError(errorMsg)
      
      if (onError) {
        onError(errorMsg)
      }
    } finally {
      setIsProcessing(false)
      // Terminate worker to free resources
      await terminateOCRWorker()
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert className="border-destructive/50 text-destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onClick={handleBrowseClick}
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
        >
          <FileImage className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium mb-2">
            Click to select a card image
          </p>
          <p className="text-xs text-muted-foreground">
            Supports JPEG, PNG, and WebP (max 10MB)
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-muted">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Card preview"
                className="w-full h-auto max-h-[400px] object-contain"
              />
            )}
            
            {!isProcessing && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRemoveFile}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white"
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-6 max-w-xs w-full mx-4 text-center">
                  <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-sm font-medium">{progress}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleProcessImage}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Extract Card Data
                </>
              )}
            </Button>
            
            {!isProcessing && (
              <Button
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            The OCR will attempt to extract card details from the image
          </p>
        </div>
      )}

      {!selectedFile && onCancel && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
