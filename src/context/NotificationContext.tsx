import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppNotification } from '../types'
import {
  initPushNotifications,
  showLocalNotification,
  updateBadgeCount,
} from '../lib/pushNotifications'

const NOTIFICATIONS_KEY = 'laundry-buddy-notifications'

function nowLabel() {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

interface NotificationState {
  notifications: AppNotification[]
  unreadCount: number
  push: (userId: string, title: string, body: string, data?: Record<string, unknown>) => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: (userId: string) => Promise<void>
}

const NotificationContext = createContext<NotificationState | null>(null)

async function readAll(): Promise<AppNotification[]> {
  const raw = await AsyncStorage.getItem(NOTIFICATIONS_KEY)
  if (!raw) return []
  return JSON.parse(raw) as AppNotification[]
}

async function writeAll(notifications: AppNotification[]) {
  await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
}

export function NotificationProvider({
  children,
  activeUserId,
}: {
  children: ReactNode
  activeUserId?: string
}) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  useEffect(() => {
    readAll().then(setNotifications)
    void initPushNotifications()
  }, [])

  const push = useCallback(
    async (userId: string, title: string, body: string, data?: Record<string, unknown>) => {
      const item: AppNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId,
        title,
        body,
        time: nowLabel(),
        read: false,
      }
      setNotifications((prev) => {
        const next = [item, ...prev].slice(0, 100)
        writeAll(next)
        return next
      })

      if (userId === activeUserId) {
        await showLocalNotification(title, body, data)
      }
    },
    [activeUserId],
  )

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      writeAll(next)
      return next
    })
  }, [])

  const markAllRead = useCallback(async (userId: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.userId === userId ? { ...n, read: true } : n))
      writeAll(next)
      return next
    })
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  )

  useEffect(() => {
    if (!activeUserId) return
    const mineUnread = notifications.filter((n) => n.userId === activeUserId && !n.read).length
    void updateBadgeCount(mineUnread)
  }, [notifications, activeUserId])

  const value = useMemo(
    () => ({ notifications, unreadCount, push, markRead, markAllRead }),
    [notifications, unreadCount, push, markRead, markAllRead],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}

export function useUserNotifications(userId: string | undefined) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const mine = useMemo(
    () => (userId ? notifications.filter((n) => n.userId === userId) : []),
    [notifications, userId],
  )
  const unread = useMemo(() => mine.filter((n) => !n.read).length, [mine])
  return { notifications: mine, unreadCount: unread, markRead, markAllRead }
}
