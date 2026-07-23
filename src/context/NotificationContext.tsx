import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AppState } from 'react-native'
import type { AppNotification, NotificationLink } from '../types'
import {
  readAllNotifications,
  writeAllNotifications,
} from '../lib/notificationStorage'
import {
  initPushNotifications,
  showLocalNotification,
  updateBadgeCount,
} from '../lib/pushNotifications'
import { shouldDeliverPhoneAlert } from '../lib/notificationAlerts'
import { linkToPushData } from '../lib/notificationLinks'

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
  push: (userId: string, title: string, body: string, link?: NotificationLink) => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: (userId: string) => Promise<void>
  reload: () => Promise<void>
}

const NotificationContext = createContext<NotificationState | null>(null)

export function NotificationProvider({
  children,
  activeUserId,
}: {
  children: ReactNode
  activeUserId?: string
}) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const deliveredPhoneAlertsRef = useRef<Set<string>>(new Set())

  const reload = useCallback(async () => {
    const next = await readAllNotifications()
    setNotifications(next)
  }, [])

  useEffect(() => {
    void reload()
    void initPushNotifications()

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void reload()
      }
    })

    return () => subscription.remove()
  }, [reload])

  useEffect(() => {
    if (!activeUserId) return
    const urgent = notifications.find(
      (item) =>
        item.userId === activeUserId &&
        !item.read &&
        !deliveredPhoneAlertsRef.current.has(item.id) &&
        shouldDeliverPhoneAlert(item.title, item.body),
    )
    if (!urgent) return
    deliveredPhoneAlertsRef.current.add(urgent.id)
    void showLocalNotification(
      urgent.title,
      urgent.body,
      urgent.link ? linkToPushData(urgent.link) : undefined,
    )
  }, [activeUserId, notifications])

  const push = useCallback(
    async (userId: string, title: string, body: string, link?: NotificationLink) => {
      const item: AppNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId,
        title,
        body,
        time: nowLabel(),
        read: false,
        link,
      }
      setNotifications((prev) => {
        const next = [item, ...prev].slice(0, 100)
        void writeAllNotifications(next)
        return next
      })

      if (userId === activeUserId && shouldDeliverPhoneAlert(title, body)) {
        await showLocalNotification(title, body, link ? linkToPushData(link) : undefined)
      }
    },
    [activeUserId],
  )

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      void writeAllNotifications(next)
      return next
    })
  }, [])

  const markAllRead = useCallback(async (userId: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.userId === userId ? { ...n, read: true } : n))
      void writeAllNotifications(next)
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
    () => ({ notifications, unreadCount, push, markRead, markAllRead, reload }),
    [notifications, unreadCount, push, markRead, markAllRead, reload],
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
