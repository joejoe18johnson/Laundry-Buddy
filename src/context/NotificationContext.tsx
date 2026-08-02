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
import { useAuth } from './AuthContext'
import {
  readAllNotifications,
  writeAllNotifications,
} from '../lib/notificationStorage'
import {
  fetchNotificationsFromSupabase,
  isRemoteNotificationSyncEnabled,
  markAllNotificationsReadInSupabase,
  markNotificationReadInSupabase,
  registerPushTokenForUser,
  resolveNotificationTargetId,
  resolveNotificationUserId,
  sendNotificationToSupabase,
  subscribeToNotificationInserts,
} from '../lib/supabase/notificationService'
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
  resolvedActiveUserId?: string
  push: (userId: string, title: string, body: string, link?: NotificationLink) => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: (userId: string) => Promise<void>
  reload: () => Promise<void>
  refreshPushRegistration: () => Promise<void>
}

const NotificationContext = createContext<NotificationState | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const localUserId = user?.id
  const [resolvedActiveUserId, setResolvedActiveUserId] = useState<string | undefined>()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const deliveredPhoneAlertsRef = useRef<Set<string>>(new Set())
  const remoteSyncEnabled = isRemoteNotificationSyncEnabled()

  useEffect(() => {
    if (!user) {
      setResolvedActiveUserId(undefined)
      return
    }

    let cancelled = false
    void (async () => {
      const resolved = await resolveNotificationUserId(user)
      if (!cancelled) {
        setResolvedActiveUserId(resolved ?? undefined)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user?.id, user?.phone, user?.email])

  const activeUserId = resolvedActiveUserId ?? localUserId

  const refreshPushRegistration = useCallback(async () => {
    if (!user || !remoteSyncEnabled) return
    await registerPushTokenForUser(user)
  }, [remoteSyncEnabled, user])

  const reload = useCallback(async () => {
    if (!remoteSyncEnabled || !activeUserId) {
      if (!remoteSyncEnabled) {
        const local = await readAllNotifications()
        setNotifications(local)
      }
      return
    }

    const remote = await fetchNotificationsFromSupabase(activeUserId)
    setNotifications(remote.slice(0, 100))
    await writeAllNotifications(remote.slice(0, 100))
  }, [activeUserId, remoteSyncEnabled])

  useEffect(() => {
    void reload()
    void initPushNotifications()

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void reload()
        void refreshPushRegistration()
      }
    })

    return () => subscription.remove()
  }, [reload, refreshPushRegistration])

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
    if (!user) return
    void refreshPushRegistration()
  }, [refreshPushRegistration, user?.id])

  useEffect(() => {
    if (!activeUserId) return
    const urgent = notifications.find(
      (item) =>
        (item.userId === activeUserId || item.userId === localUserId) &&
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
  }, [activeUserId, localUserId, notifications])

  const push = useCallback(
    async (userId: string, title: string, body: string, link?: NotificationLink) => {
      const resolvedTargetId = remoteSyncEnabled ? await resolveNotificationTargetId(userId) : userId
      const isForMe =
        userId === localUserId ||
        userId === activeUserId ||
        resolvedTargetId === activeUserId

      let item: AppNotification | null = null

      if (remoteSyncEnabled) {
        item = await sendNotificationToSupabase(userId, title, body, link)
        if (!item) {
          if (__DEV__) {
            console.warn('[notifications] remote send failed — recipient may not receive alert')
          }
          return
        }
      } else {
        item = {
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          userId: resolvedTargetId ?? userId,
          title,
          body,
          time: nowLabel(),
          read: false,
          link,
        }
      }

      if (isForMe) {
        setNotifications((prev) => {
          const next = [item!, ...prev.filter((entry) => entry.id !== item!.id)].slice(0, 100)
          if (!remoteSyncEnabled) {
            void writeAllNotifications(next)
          }
          return next
        })
      }

      if (isForMe && shouldDeliverPhoneAlert(title, body)) {
        deliveredPhoneAlertsRef.current.add(item.id)
        await showLocalNotification(title, body, link ? linkToPushData(link) : undefined)
      }
    },
    [activeUserId, localUserId, remoteSyncEnabled],
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
      const resolved = remoteSyncEnabled ? await resolveNotificationTargetId(userId) : userId
      const targetId = resolved ?? userId
      if (remoteSyncEnabled && targetId) {
        await markAllNotificationsReadInSupabase(targetId)
      }
      setNotifications((prev) => {
        const next = prev.map((n) =>
          n.userId === targetId || n.userId === userId ? { ...n, read: true } : n,
        )
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
    if (!activeUserId && !localUserId) return
    const mineUnread = notifications.filter(
      (n) => (n.userId === activeUserId || n.userId === localUserId) && !n.read,
    ).length
    void updateBadgeCount(mineUnread)
  }, [notifications, activeUserId, localUserId])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      resolvedActiveUserId: activeUserId,
      push,
      markRead,
      markAllRead,
      reload,
      refreshPushRegistration,
    }),
    [
      notifications,
      unreadCount,
      activeUserId,
      push,
      markRead,
      markAllRead,
      reload,
      refreshPushRegistration,
    ],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}

export function useUserNotifications(userId: string | undefined) {
  const { notifications, markRead, markAllRead, reload, resolvedActiveUserId } = useNotifications()
  const mine = useMemo(() => {
    if (!userId) return []
    const ownerIds = new Set([userId, resolvedActiveUserId].filter(Boolean) as string[])
    return notifications.filter((n) => ownerIds.has(n.userId))
  }, [notifications, resolvedActiveUserId, userId])
  const unread = useMemo(() => mine.filter((n) => !n.read).length, [mine])
  return { notifications: mine, unreadCount: unread, markRead, markAllRead, reload }
}
