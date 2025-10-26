import { supabase } from './client'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'status_change' | 'job_closed' | 'application_reminder' | 'general'
  related_application_id?: string
  related_job_id?: string
  is_read: boolean
  created_at: string
  related_status?: 'submitted' | 'pending' | 'accepted' | 'rejected';
}

// Create notification
export async function createNotification(notification: Omit<Notification, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select()
      .single()

    if (error) {
      console.error('Create notification error:', JSON.stringify(error, null, 2))
      throw error
    }

    return { data: data as Notification, error: null }
  } catch (error) {
    console.error('Create notification error (catch block):', JSON.stringify(error, null, 2))
    return { data: null, error }
  }
}

// Get user notifications
export async function getUserNotifications(userId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get notifications error:', error)
      throw error
    }

    return { data: data as Notification[], error: null }
  } catch (error) {
    console.error('Get notifications error:', error)
    return { data: [], error }
  }
}

// Get unread notifications count
export async function getUnreadNotificationsCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      console.error('Get unread count error:', error)
      throw error
    }

    return { data: count || 0, error: null }
  } catch (error) {
    console.error('Get unread count error:', error)
    return { data: 0, error }
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) {
      console.error('Mark as read error:', error)
      throw error
    }

    return { data: data as Notification, error: null }
  } catch (error) {
    console.error('Mark as read error:', error)
    return { data: null, error }
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      console.error('Mark all as read error:', error)
      throw error
    }

    return { error: null }
  } catch (error) {
    console.error('Mark all as read error:', error)
    return { error }
  }
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      console.error('Delete notification error:', error)
      throw error
    }

    return { error: null }
  } catch (error) {
    console.error('Delete notification error:', error)
    return { error }
  }
}

// Helper function to create notification when application status changes
export async function notifyApplicationStatusChange(
  userId: string,
  applicationId: string,
  jobId: string,
  jobTitle: string,
  companyName: string,
  newStatus: 'submitted' | 'pending' | 'accepted' | 'rejected'
) {
  const statusMessages = {
    submitted: {
        title: 'Application Submitted',
        message: `Your application for "${jobTitle}" at ${companyName} has been successfully submitted.`
    },
    pending: {
      title: 'Application Update: Under Review',
      message: `Hang tight! Your application for "${jobTitle}" at ${companyName} is currently being reviewed by the team.`
    },
    accepted: {
      title: 'Congratulations! Application Accepted',
      message: `Great news! Your application for "${jobTitle}" at ${companyName} has been accepted. We\'ll be in touch with the next steps soon.`
    },
    rejected: {
      title: 'Application Update',
      message: `Thank you for your interest in the "${jobTitle}" position at ${companyName}. After careful consideration, we\'ve decided not to move forward at this time. We wish you the best in your job search.`
    }
  }

  const { title, message } = statusMessages[newStatus]

  return await createNotification({
    user_id: userId,
    title,
    message,
    type: 'status_change',
    related_application_id: applicationId,
    related_job_id: jobId,
    is_read: false,
    related_status: newStatus
  })
}
