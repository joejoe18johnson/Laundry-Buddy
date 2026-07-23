import AsyncStorage from '@react-native-async-storage/async-storage'
import type { AppNotification, NotificationLink } from '../types'

const NOTIFICATIONS_KEY = 'laundry-buddy-notifications'

function nowLabel() {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export async function readAllNotifications(): Promise<AppNotification[]> {
  const raw = await AsyncStorage.getItem(NOTIFICATIONS_KEY)
  if (!raw) return []
  return JSON.parse(raw) as AppNotification[]
}

export async function writeAllNotifications(notifications: AppNotification[]): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
}

export async function pushNotificationForUser(
  userId: string,
  title: string,
  body: string,
  link?: NotificationLink,
): Promise<AppNotification> {
  const item: AppNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    title,
    body,
    time: nowLabel(),
    read: false,
    link,
  }
  const all = await readAllNotifications()
  await writeAllNotifications([item, ...all].slice(0, 100))
  return item
}
