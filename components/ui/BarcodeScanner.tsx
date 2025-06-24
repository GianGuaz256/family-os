import React, { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Button } from './button'
import { Alert, AlertDescription } from './alert'
import { X } from 'lucide-react'

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void
  onError?: (error: string) => void
  onCancel?: () => void
  isActive: boolean
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanSuccess,
  onError,
  onCancel,
  isActive
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const elementId = 'barcode-scanner-container'

  useEffect(() => {
    if (isActive && !scannerRef.current) {
      initializeScanner()
    } else if (!isActive && scannerRef.current) {
      cleanup()
    }

    return () => {
      // Cleanup when component unmounts or isActive changes
      if (scannerRef.current) {
        try {
          scannerRef.current.clear().catch(() => {
            // Ignore cleanup errors during unmount
          })
        } catch (err) {
          // Ignore cleanup errors during unmount
        } finally {
          scannerRef.current = null
        }
      }
    }
  }, [isActive])

  const initializeScanner = () => {
    try {
      // Check if the DOM element exists before initializing
      const element = document.getElementById(elementId)
      if (!element) {
        console.warn('Scanner element not found, retrying...')
        setTimeout(initializeScanner, 100)
        return
      }

      const scanner = new Html5QrcodeScanner(
        elementId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.AZTEC,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.MAXICODE,
            Html5QrcodeSupportedFormats.PDF_417,
            Html5QrcodeSupportedFormats.RSS_14,
            Html5QrcodeSupportedFormats.RSS_EXPANDED
          ],
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true
        },
        /* verbose= */ false
      )

      scanner.render(
        (decodedText, decodedResult) => {
          // Success callback
          console.log('Barcode scanned:', decodedText)
          onScanSuccess(decodedText)
          setIsScanning(false)
          
          // Add a small delay before cleanup to ensure scanner operations are complete
          setTimeout(() => {
            cleanup()
          }, 100)
        },
        (errorMessage) => {
          // Error callback - we can ignore most of these as they're just "no barcode found" messages
          if (errorMessage.includes('No MultiFormat Readers were able to detect the code')) {
            // This is normal when no barcode is detected
            return
          }
          
          // Handle permission denied errors
          if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
            setError('Camera permission denied. Please allow camera access or use the "Scan an Image File" option instead.')
            return
          }
          
          console.warn('Barcode scan error:', errorMessage)
        }
      )

      scannerRef.current = scanner
      setIsScanning(true)
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize barcode scanner'
      setError(errorMsg)
      if (onError) {
        onError(errorMsg)
      }
    }
  }

  const cleanup = () => {
    if (scannerRef.current) {
      try {
        // Stop the scanner and clear all resources
        scannerRef.current.clear().catch((err) => {
          console.warn('Error stopping scanner:', err)
        })
      } catch (err) {
        console.warn('Error cleaning up scanner:', err)
      } finally {
        scannerRef.current = null
      }
    }
    setIsScanning(false)
  }

  const handleCancel = () => {
    cleanup()
    if (onCancel) {
      onCancel()
    }
  }

  if (!isActive) {
    return null
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative bg-black rounded-lg overflow-hidden">
        <div 
          id={elementId} 
          className="w-full min-h-[280px]"
        />
        
        {isScanning && (
          <div className="absolute top-4 right-4 z-20">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancel}
              className="bg-white/90 hover:bg-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Position the barcode within the camera view to scan
        </p>
        
        <Button
          variant="outline"
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
} 