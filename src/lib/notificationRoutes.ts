import type { AppRole, Screen } from '../types'

export function getNotificationScreen(title: string, role: AppRole): Screen | null {
  const lower = title.toLowerCase()

  if (role === 'host') {
    if (lower.includes('booking') || lower.includes('request')) return 'host-dashboard'
    return 'host-dashboard'
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
    lower.includes('waiting')
  ) {
    return 'customer-tracking'
  }

  if (lower.includes('online')) return 'customer-home'

  return null
}
