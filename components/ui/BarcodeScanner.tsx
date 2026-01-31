import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, CameraDevice } from 'html5-qrcode'
import { Button } from './button'
import { Alert, AlertDescription } from './alert'
import { X, Camera as CameraIcon, RefreshCw } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

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
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isMountedRef = useRef<boolean>(true)
  const isCleaningUpRef = useRef<boolean>(false)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [isInitializing, setIsInitializing] = useState(false)
  const elementId = 'barcode-scanner-container'

  // Initialize camera list on mount
  useEffect(() => {
    isMountedRef.current = true
    
    if (isActive) {
      requestCameraPermissionAndListDevices()
    }

    return () => {
      isMountedRef.current = false
      // Call cleanup synchronously but don't wait for it
      // This prevents React from blocking on async cleanup
      cleanup().catch(err => console.warn('Cleanup error in unmount:', err))
    }
  }, [isActive])

  // Start scanning when camera is selected
  useEffect(() => {
    if (isActive && selectedCamera && !isScanning && !isInitializing) {
      startScanning(selectedCamera)
    }
  }, [selectedCamera, isActive])

  /**
   * Request camera permission and get available cameras
   */
  const requestCameraPermissionAndListDevices = async () => {
    try {
      setIsInitializing(true)
      setError(null)

      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not available. Please use HTTPS or a supported browser.')
      }

      // Request camera permission first
      await navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          // Stop the stream immediately - we just needed permission
          stream.getTracks().forEach(track => track.stop())
        })

      // Get available cameras
      const devices = await Html5Qrcode.getCameras()
      
      if (!isMountedRef.current) return

      if (devices && devices.length > 0) {
        setCameras(devices)
        // Auto-select the back camera if available, otherwise the first camera
        const backCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        )
        setSelectedCamera(backCamera?.id || devices[0].id)
      } else {
        setError('No cameras found on this device')
        if (onError) {
          onError('No cameras found')
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return
      
      const errorMsg = err instanceof Error ? err.message : 'Failed to access camera'
      
      if (errorMsg.includes('Permission denied') || errorMsg.includes('NotAllowedError')) {
        setError('Camera permission denied. Please allow camera access in your browser settings.')
      } else if (errorMsg.includes('Camera API') || errorMsg.includes('HTTPS')) {
        setError('Camera not available. This feature requires HTTPS or a supported browser.')
      } else {
        setError(errorMsg)
      }
      
      if (onError) {
        onError(errorMsg)
      }
    } finally {
      if (isMountedRef.current) {
        setIsInitializing(false)
      }
    }
  }

  /**
   * Start scanning with the selected camera
   */
  const startScanning = async (cameraId: string) => {
    // Don't start if already scanning or initializing
    if (isScanning || isInitializing || isCleaningUpRef.current) {
      console.warn('Scanner already active, skipping start')
      return
    }

    try {
      setIsInitializing(true)
      setError(null)

      // Clean up any existing scanner and wait for it
      await cleanup()

      if (!isMountedRef.current) return

      // Verify DOM element exists before initializing scanner
      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error('Scanner container element not found')
      }

      // Create new scanner instance
      const scanner = new Html5Qrcode(elementId)
      scannerRef.current = scanner

      // Start scanning
      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success callback
          console.log('Barcode scanned:', decodedText)
          if (isMountedRef.current) {
            onScanSuccess(decodedText)
            // Don't await cleanup here to avoid blocking
            cleanup().catch(err => console.warn('Cleanup error after scan:', err))
          }
        },
        (errorMessage) => {
          // Error callback - ignore "no barcode found" messages
          if (!errorMessage.includes('No MultiFormat Readers') && 
              !errorMessage.includes('NotFoundException')) {
            console.warn('Scan error:', errorMessage)
          }
        }
      )

      if (isMountedRef.current) {
        setIsScanning(true)
        setIsInitializing(false)
      }
    } catch (err) {
      if (!isMountedRef.current) return

      const errorMsg = err instanceof Error ? err.message : 'Failed to start scanning'
      console.error('Scanner start error:', errorMsg)
      setError(errorMsg)
      setIsInitializing(false)
      
      if (onError) {
        onError(errorMsg)
      }
    }
  }

  /**
   * Cleanup scanner resources
   */
  const cleanup = async () => {
    // Prevent multiple simultaneous cleanup calls
    if (isCleaningUpRef.current) {
      return
    }
    
    isCleaningUpRef.current = true
    
    try {
      if (scannerRef.current) {
        const scanner = scannerRef.current
        scannerRef.current = null // Clear ref immediately to prevent reuse
        
        // Check if scanner is actively scanning
        if (scanner.isScanning) {
          try {
            await scanner.stop()
          } catch (stopErr) {
            // Ignore stop errors during cleanup
            console.warn('Error stopping scanner:', stopErr)
          }
        }
        
        // Clear scanner - wrap in try-catch to handle DOM errors
        try {
          await scanner.clear()
        } catch (clearErr) {
          // Ignore all DOM-related errors during cleanup
          console.warn('Error clearing scanner (ignoring):', clearErr)
        }
      }
      
      // As a fallback, manually clear the container
      try {
        const element = document.getElementById(elementId)
        if (element) {
          // Remove all child nodes safely
          while (element.firstChild) {
            element.removeChild(element.firstChild)
          }
        }
      } catch (domErr) {
        // Ignore DOM errors
        console.warn('Error clearing container DOM (ignoring):', domErr)
      }
      
      if (isMountedRef.current) {
        setIsScanning(false)
      }
    } finally {
      isCleaningUpRef.current = false
    }
  }

  const handleCancel = () => {
    cleanup().catch(err => console.warn('Cleanup error on cancel:', err))
    if (onCancel) {
      onCancel()
    }
  }

  const handleRetry = () => {
    setError(null)
    requestCameraPermissionAndListDevices()
  }

  const handleCameraChange = (cameraId: string) => {
    setSelectedCamera(cameraId)
  }

  if (!isActive) {
    return null
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert className="mb-4 border-destructive/50 text-destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {cameras.length > 1 && !error && (
        <div className="flex items-center gap-2">
          <CameraIcon className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedCamera} onValueChange={handleCameraChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select camera" />
            </SelectTrigger>
            <SelectContent>
              {cameras.map((camera) => (
                <SelectItem key={camera.id} value={camera.id}>
                  {camera.label || `Camera ${camera.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="relative bg-black rounded-lg overflow-hidden">
        <div 
          id={elementId} 
          className="w-full min-h-[300px] flex items-center justify-center"
        >
          {isInitializing && (
            <div className="text-white text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Initializing camera...</p>
            </div>
          )}
          {!isInitializing && !isScanning && !error && (
            <div className="text-white text-center p-8">
              <CameraIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Waiting for camera...</p>
            </div>
          )}
        </div>
        
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

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          {isScanning 
            ? 'Position the barcode within the camera view to scan'
            : 'Select a camera to start scanning'
          }
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