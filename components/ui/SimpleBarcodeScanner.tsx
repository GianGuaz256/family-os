import React, { useState, useRef } from 'react'
import { Button } from './button'
import { Alert, AlertDescription } from './alert'
import { Camera } from 'lucide-react'
import Quagga from '@ericblade/quagga2'

interface SimpleBarcodeScannerProps {
  onScanSuccess: (barcode: string) => void
  onError?: (error: string) => void
  onCancel?: () => void
}

export const SimpleBarcodeScanner: React.FC<SimpleBarcodeScannerProps> = ({
  onScanSuccess,
  onError,
  onCancel
}) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPreviewUrl(result)
        
        // Scan the image with Quagga2
        scanImageWithQuagga(result)
      }
      reader.readAsDataURL(file)
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to scan barcode'
      console.error('Scan error:', err)
      setError('Failed to process image. Please try again.')
      setIsProcessing(false)
      
      if (onError) {
        onError(errorMsg)
      }
    }
  }

  const scanImageWithQuagga = (imageData: string) => {
    Quagga.decodeSingle(
      {
        src: imageData,
        numOfWorkers: 0,
        inputStream: {
          size: 800
        },
        decoder: {
          readers: [
            'ean_reader',
            'ean_8_reader',
            'code_128_reader',
            'code_39_reader',
            'code_39_vin_reader',
            'codabar_reader',
            'upc_reader',
            'upc_e_reader',
            'i2of5_reader'
          ]
        },
        locate: true
      },
      (result) => {
        setIsProcessing(false)
        
        if (result && result.codeResult && result.codeResult.code) {
          console.log('Barcode detected:', result.codeResult.code)
          onScanSuccess(result.codeResult.code)
        } else {
          console.log('No barcode detected in image')
          setError('No barcode found in the image. Make sure the barcode is clear and well-lit.')
          
          if (onError) {
            onError('No barcode detected')
          }
        }
      }
    )
  }

  const handleCameraClick = () => {
    fileInputRef.current?.click()
  }

  const handleReset = () => {
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert className="border-destructive/50 text-destructive">
          <AlertDescription>
            <div className="space-y-2">
              <p>{error}</p>
              <p className="text-xs font-medium">Tips for better scanning:</p>
              <ul className="text-xs list-disc list-inside space-y-1">
                <li>Ensure good lighting without glare</li>
                <li>Hold camera steady and focus on barcode</li>
                <li>Get close - barcode should fill most of frame</li>
                <li>Keep camera perpendicular to barcode</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!previewUrl ? (
        <div className="space-y-4">
          <div
            onClick={handleCameraClick}
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors bg-muted/20"
          >
            <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              Scan Barcode
            </p>
            <p className="text-sm text-muted-foreground">
              Tap to open camera and scan a barcode
            </p>
          </div>

          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>📱 Choose: Take Photo or Pick from Library</p>
            <p>📷 Position barcode clearly in frame</p>
            <p className="font-medium text-blue-600 dark:text-blue-500">
              ✨ Works with EAN, UPC, Code 128, Code 39, and more
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-muted">
            <img
              src={previewUrl}
              alt="Scanned card"
              className="w-full h-auto max-h-[400px] object-contain"
            />
            
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-6 max-w-xs w-full mx-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm font-medium">Analyzing barcode...</p>
                </div>
              </div>
            )}
          </div>

          {!isProcessing && (
            <div className="flex gap-2">
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1"
              >
                Try Again
              </Button>
              {onCancel && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {!previewUrl && onCancel && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
