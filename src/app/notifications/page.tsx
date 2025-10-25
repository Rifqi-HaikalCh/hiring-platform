'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, type Notification } from '@/lib/supabase/notifications'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/layout/Footer'
import { Bell, BellOff, Check, CheckCheck, Trash2, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  const loadNotifications = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await getUserNotifications(user.id)

      if (error) {
        toast.error('Failed to load notifications')
        console.error('Load notifications error:', error)
        return
      }

      setNotifications(data || [])
    } catch (error) {
      toast.error('Failed to load notifications')
      console.error('Load notifications error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    const { error } = await markNotificationAsRead(notificationId)

    if (error) {
      toast.error('Failed to mark as read')
      return
    }

    // Update local state
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      )
    )
  }

  const handleMarkAllAsRead = async () => {
    if (!user) return

    const { error } = await markAllNotificationsAsRead(user.id)

    if (error) {
      toast.error('Failed to mark all as read')
      return
    }

    // Update local state
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, is_read: true }))
    )

    toast.success('All notifications marked as read')
  }

  const handleDelete = async (notificationId: string) => {
    const { error } = await deleteNotification(notificationId)

    if (error) {
      toast.error('Failed to delete notification')
      return
    }

    // Update local state
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
    toast.success('Notification deleted')
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      handleMarkAsRead(notification.id)
    }

    // Navigate to related page if applicable
    if (notification.related_application_id) {
      router.push('/my-applications')
    }
  }

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications

  const unreadCount = notifications.filter(n => !n.is_read).length

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'status_change':
        return <AlertCircle className="h-5 w-5 text-blue-600" />
      case 'job_closed':
        return <BellOff className="h-5 w-5 text-orange-600" />
      case 'application_reminder':
        return <Clock className="h-5 w-5 text-purple-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 bg-teal-600 rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">Stay updated with your application status</p>
          </div>

          {/* Actions Bar */}
          <Card className="mb-6 p-4 bg-white/70 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={filter === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Unread ({unreadCount})
                </Button>
              </div>

              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all as read
                </Button>
              )}
            </div>
          </Card>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <Card className="p-12 bg-white/70 backdrop-blur-sm text-center">
              <BellOff className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
              </h3>
              <p className="text-gray-600">
                {filter === 'unread'
                  ? 'You\'ve read all your notifications'
                  : 'You don\'t have any notifications yet'}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={cn(
                    'p-4 transition-all hover:shadow-md cursor-pointer',
                    notification.is_read
                      ? 'bg-white/50 backdrop-blur-sm'
                      : 'bg-white border-l-4 border-teal-500'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h3 className={cn(
                          'text-sm font-semibold',
                          notification.is_read ? 'text-gray-700' : 'text-gray-900'
                        )}>
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-teal-600 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className={cn(
                        'text-sm mb-2',
                        notification.is_read ? 'text-gray-500' : 'text-gray-700'
                      )}>
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {new Date(notification.created_at).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkAsRead(notification.id)
                              }}
                              className="text-teal-600 hover:text-teal-700 text-xs font-medium flex items-center gap-1"
                            >
                              <Check className="h-3 w-3" />
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(notification.id)
                            }}
                            className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
