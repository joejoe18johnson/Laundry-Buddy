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
  fetchNotificationsFromSupabase,
  isRemoteNotificationSyncEnabled,
  markAllNotificationsReadInSupabase,
  markNotificationReadInSupabase,
  sendNotificationToSupabase,
  subscribeToNotificationInserts,
  upsertPushToken,
} from '../lib/supabase/notificationService'
import {
  initPushNotifications,
  registerExpoPushToken,
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

function mergeNotificationLists(
  remote: AppNotification[],
  local: AppNotification[],
  activeUserId?: string,
): AppNotification[] {
  const merged = new Map<string, AppNotification>()
  for (const item of remote) {
    merged.set(item.id, item)
  }
  for (const item of local) {
    if ((!activeUserId || item.userId === activeUserId) && !merged.has(item.id)) {
      merged.set(item.id, item)
    }
  }
  return Array.from(merged.values()).slice(0, 100)
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
  const remoteSyncEnabled = isRemoteNotificationSyncEnabled()

  const reload = useCallback(async () => {
    const local = await readAllNotifications()
    if (!remoteSyncEnabled || !activeUserId) {
      setNotifications(local)
      return
    }

    const remote = await fetchNotificationsFromSupabase(activeUserId)
    const next = mergeNotificationLists(remote, local, activeUserId)
    setNotifications(next)
    await writeAllNotifications(next)
  }, [activeUserId, remoteSyncEnabled])

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
    if (!remoteSyncEnabled || !activeUserId) return

    return subscribeToNotificationInserts(activeUserId, (item) => {
      setNotifications((prev) => {
        if (prev.some((entry) => entry.id === item.id)) return prev
        const next = [item, ...prev].slice(0, 100)
        void writeAllNotifications(next)
        return next
      })

      if (shouldDeliverPhoneAlert(item.title, item.body)) {
        deliveredPhoneAlertsRef.current.add(item.id)
        void showLocalNotification(
          item.title,
          item.body,
          item.link ? linkToPushData(item.link) : undefined,
        )
      }
    })
  }, [activeUserId, remoteSyncEnabled])

  useEffect(() => {
    if (!activeUserId) return
    void (async () => {
      const token = await registerExpoPushToken()
      if (token) {
        await upsertPushToken(activeUserId, token)
      }
    })()
  }, [activeUserId])

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
      let item: AppNotification | null = null

      if (remoteSyncEnabled) {
        item = await sendNotificationToSupabase(userId, title, body, link)
      }

      if (!item) {
        item = {
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          userId,
          title,
          body,
          time: nowLabel(),
          read: false,
          link,
        }
      }

      setNotifications((prev) => {
        const next = [item!, ...prev.filter((entry) => entry.id !== item!.id)].slice(0, 100)
        void writeAllNotifications(next)
        return next
      })

      if (userId === activeUserId && shouldDeliverPhoneAlert(title, body)) {
        deliveredPhoneAlertsRef.current.add(item.id)
        await showLocalNotification(title, body, link ? linkToPushData(link) : undefined)
      }
    },
    [activeUserId, remoteSyncEnabled],
  )

  const markRead = useCallback(
    async (id: string) => {
      if (remoteSyncEnabled && !id.startsWith('notif-')) {
        await markNotificationReadInSupabase(id)
      }
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        void writeAllNotifications(next)
        return next
      })
    },
    [remoteSyncEnabled],
  )

  const markAllRead = useCallback(
    async (userId: string) => {
      if (remoteSyncEnabled) {
        await markAllNotificationsReadInSupabase(userId)
      }
      setNotifications((prev) => {
        const next = prev.map((n) => (n.userId === userId ? { ...n, read: true } : n))
        void writeAllNotifications(next)
        return next
      })
    },
    [remoteSyncEnabled],
  )

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
