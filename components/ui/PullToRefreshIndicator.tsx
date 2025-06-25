import React from 'react'
import { RotateCcw, ArrowDown } from 'lucide-react'
import { cn } from '../../lib/utils'

interface PullToRefreshIndicatorProps {
  pullDistance: number
  isRefreshing: boolean
  threshold?: number
  className?: string
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  pullDistance,
  isRefreshing,
  threshold = 80,
  className
}) => {
  const progress = Math.min(pullDistance / threshold, 1)
  const shouldShowIndicator = pullDistance > 10 || isRefreshing
  
  // Determine the state of the indicator
  const isReadyToRefresh = pullDistance >= threshold && !isRefreshing
  
  if (!shouldShowIndicator) return null

  return (
    <div 
      className={cn(
        "absolute top-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-out",
        className
      )}
      style={{
        transform: `translate(-50%, ${Math.max(pullDistance * 0.3, 0)}px)`,
        opacity: Math.min(progress * 3, 1)
      }}
    >
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-full p-2 shadow-md border border-white/30 dark:border-white/20">
        {isRefreshing ? (
          <RotateCcw 
            className="h-4 w-4 text-blue-500 animate-spin" 
          />
        ) : (
          <ArrowDown 
            className={cn(
              "h-4 w-4 transition-all duration-300 ease-out",
              isReadyToRefresh 
                ? "text-green-500" 
                : "text-blue-500"
            )}
            style={{
              transform: isReadyToRefresh ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          />
        )}
      </div>
    </div>
  )
} 