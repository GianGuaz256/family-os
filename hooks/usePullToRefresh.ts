import { useCallback, useEffect, useRef, useState } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
  resistance?: number
  enabled?: boolean
}

interface UsePullToRefreshReturn {
  isRefreshing: boolean
  pullDistance: number
  containerRef: React.RefObject<HTMLDivElement>
}

/**
 * Custom hook for implementing pull-to-refresh functionality
 * Handles touch events and provides smooth visual feedback
 */
export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true
}: UsePullToRefreshOptions): UsePullToRefreshReturn => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [startY, setStartY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing) return
    
    const container = containerRef.current
    if (!container) return
    
    // Only start pull-to-refresh if user is at the top of the page
    if (container.scrollTop > 0) return
    
    setStartY(e.touches[0].clientY)
    setIsDragging(true)
  }, [enabled, isRefreshing])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing || !isDragging) return
    
    const container = containerRef.current
    if (!container) return
    
    // Only allow pull-to-refresh when at the top
    if (container.scrollTop > 0) {
      setIsDragging(false)
      setPullDistance(0)
      return
    }
    
    const currentY = e.touches[0].clientY
    const deltaY = currentY - startY
    
    if (deltaY > 0) {
      // Prevent default scroll behavior when pulling down
      e.preventDefault()
      
      // Apply resistance to the pull distance
      const distance = Math.min(deltaY / resistance, threshold * 1.5)
      setPullDistance(distance)
    } else {
      setIsDragging(false)
      setPullDistance(0)
    }
  }, [enabled, isRefreshing, isDragging, startY, threshold, resistance])

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || isRefreshing || !isDragging) return
    
    setIsDragging(false)
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setPullDistance(0)
  }, [enabled, isRefreshing, isDragging, pullDistance, threshold, onRefresh])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return

    // Add touch event listeners
    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, enabled])

  return {
    isRefreshing,
    pullDistance,
    containerRef
  }
} 