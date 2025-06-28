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
 * Optimized for fixed layout containers
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

  // Get the scrollable element (could be container or child element)
  const getScrollableElement = useCallback(() => {
    const container = containerRef.current
    if (!container) return null
    
    // Helper function to check if an element is scrollable
    const isElementScrollable = (element: HTMLElement): boolean => {
      const computedStyle = window.getComputedStyle(element)
      const overflowY = computedStyle.overflowY
      const overflow = computedStyle.overflow
      
      // Check if element has scrollable overflow
      const hasScrollableOverflow = 
        overflowY === 'auto' || 
        overflowY === 'scroll' || 
        overflow === 'auto' || 
        overflow === 'scroll'
      
      // Element must have scrollable overflow AND scrollable content
      return hasScrollableOverflow && element.scrollHeight > element.clientHeight
    }
    
    // Check if container itself is scrollable
    if (isElementScrollable(container)) {
      return container
    }
    
    // Recursively check child elements for scrollability
    const findScrollableChild = (parent: HTMLElement): HTMLElement | null => {
      for (const child of Array.from(parent.children)) {
        if (child instanceof HTMLElement) {
          if (isElementScrollable(child)) {
            return child
          }
          // Recursively check nested children
          const nestedScrollable = findScrollableChild(child)
          if (nestedScrollable) {
            return nestedScrollable
          }
        }
      }
      return null
    }
    
    // Look for scrollable child element
    const scrollableChild = findScrollableChild(container)
    if (scrollableChild) {
      return scrollableChild
    }
    
    return container
  }, [])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing) return
    
    const scrollableElement = getScrollableElement()
    if (!scrollableElement) return
    
    // Only start pull-to-refresh if user is at the top of the scrollable area
    if (scrollableElement.scrollTop > 0) return
    
    setStartY(e.touches[0].clientY)
    setIsDragging(true)
  }, [enabled, isRefreshing, getScrollableElement])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing || !isDragging) return
    
    const scrollableElement = getScrollableElement()
    if (!scrollableElement) return
    
    // Only allow pull-to-refresh when at the top
    if (scrollableElement.scrollTop > 0) {
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
  }, [enabled, isRefreshing, isDragging, startY, threshold, resistance, getScrollableElement])

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

  // Handle scroll events to reset pull distance when scrolling
  const handleScroll = useCallback(() => {
    const scrollableElement = getScrollableElement()
    if (!scrollableElement) return
    
    if (scrollableElement.scrollTop > 0 && (pullDistance > 0 || isDragging)) {
      setIsDragging(false)
      setPullDistance(0)
    }
  }, [pullDistance, isDragging, getScrollableElement])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return

    // Add touch event listeners to container
    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    // Add scroll listener to scrollable element
    const scrollableElement = getScrollableElement()
    if (scrollableElement) {
      scrollableElement.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      
      if (scrollableElement) {
        scrollableElement.removeEventListener('scroll', handleScroll)
      }
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleScroll, enabled, getScrollableElement])

  return {
    isRefreshing,
    pullDistance,
    containerRef
  }
} 