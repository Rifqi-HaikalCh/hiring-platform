'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { getUnreadNotificationsCount } from '@/lib/supabase/notifications'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

interface NotificationBadgeProps {
  className?: string
}

export function NotificationBadge({ className }: NotificationBadgeProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user) {
      loadUnreadCount()

      // Poll for updates every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const loadUnreadCount = async () => {
    if (!user) return

    try {
      const { data } = await getUnreadNotificationsCount(user.id)
      setUnreadCount(data || 0)
    } catch (error) {
      console.error('Failed to load unread count:', error)
    }
  }

  const handleClick = () => {
    router.push('/notifications')
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
        className
      )}
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
