import type { AppNotification, AppRole, NotificationLink } from '../types'

export function bookingTrackingLink(bookingId: string): NotificationLink {
  return { screen: 'customer-tracking', bookingId }
}

export function hostReviewLink(hostId: string, bookingId?: string): NotificationLink {
  return { screen: 'customer-leave-review', hostId, bookingId }
}

export function hostDashboardLink(bookingId?: string): NotificationLink {
  return { screen: 'host-dashboard', bookingId }
}

export function hostProfileLink(hostId: string): NotificationLink {
  return { screen: 'customer-host-profile', hostId }
}

export function chatLink(threadId: string, bookingId?: string): NotificationLink {
  return { screen: 'chat', threadId, bookingId }
}

export function linkFromPushData(data: Record<string, unknown>): NotificationLink | undefined {
  const screen = data.screen as NotificationLink['screen'] | undefined
  if (!screen) return undefined

  if (screen === 'customer-tracking' && typeof data.bookingId === 'string') {
    return { screen, bookingId: data.bookingId }
  }
  if (screen === 'customer-leave-review' && typeof data.hostId === 'string') {
    return {
      screen,
      hostId: data.hostId,
      bookingId: typeof data.bookingId === 'string' ? data.bookingId : undefined,
    }
  }
  if (screen === 'customer-host-profile' && typeof data.hostId === 'string') {
    return { screen, hostId: data.hostId }
  }
  if (screen === 'host-dashboard') {
    return {
      screen,
      bookingId: typeof data.bookingId === 'string' ? data.bookingId : undefined,
    }
  }
  if (screen === 'chat' && typeof data.threadId === 'string') {
    return {
      screen,
      threadId: data.threadId,
      bookingId: typeof data.bookingId === 'string' ? data.bookingId : undefined,
    }
  }
  if (screen === 'customer-home' || screen === 'history') {
    return { screen }
  }
  return undefined
}

export function linkToPushData(link: NotificationLink): Record<string, string> {
  const data: Record<string, string> = { screen: link.screen }
  if ('bookingId' in link && link.bookingId) data.bookingId = link.bookingId
  if ('hostId' in link && link.hostId) data.hostId = link.hostId
  if ('threadId' in link && link.threadId) data.threadId = link.threadId
  return data
}

/** Fallback for notifications saved before link metadata existed. */
export function inferNotificationLink(title: string, role: AppRole): NotificationLink | null {
  const lower = title.toLowerCase()

  if (
    lower.includes('message from') ||
    lower.includes('support replied') ||
    lower.includes('transfer proof')
  ) {
    return { screen: 'chat', threadId: '' }
  }

  if (role === 'host') {
    return { screen: 'host-dashboard' }
  }

  if (lower.includes('review')) {
    return { screen: 'customer-leave-review', hostId: '' }
  }

  if (
    lower.includes('accepted') ||
    lower.includes('declined') ||
    lower.includes('request sent') ||
    lower.includes('booking') ||
    lower.includes('payment') ||
    lower.includes('bag') ||
    lower.includes('dry') ||
    lower.includes('ready') ||
    lower.includes('waiting') ||
    lower.includes('pickup') ||
    lower.includes('picked up')
  ) {
    return { screen: 'customer-tracking', bookingId: '' }
  }

  if (lower.includes('online')) {
    return { screen: 'customer-home' }
  }

  return null
}

export function resolveNotificationLink(notification: AppNotification, role: AppRole): NotificationLink | null {
  if (notification.link) return notification.link
  return inferNotificationLink(notification.title, role)
}

export function notificationHasDestination(notification: AppNotification, role: AppRole): boolean {
  return resolveNotificationLink(notification, role) !== null
}
