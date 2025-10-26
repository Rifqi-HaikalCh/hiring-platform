'use client'

import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationBadgeProps {
  className?: string
  count?: number
}

export function NotificationBadge({ className, count }: NotificationBadgeProps) {
  return (
    <div
      className={cn(
        'relative p-2 rounded-lg transition-colors',
        className
      )}
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      {count && count > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  )
}
