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
import { useAuth } from '../context/AuthContext'
import { formatChatTime } from '../context/MessageContext'
import { listAllUsers } from '../lib/adminUsers'
import { loadAdminSupportThreadRows, type AdminSupportThreadRow } from '../lib/adminSupportThreads'
import { isSupportThread } from '../lib/chatThreads'
import { isSupabaseConfigured } from '../lib/supabase'
import { subscribeToChatInserts } from '../lib/supabase/messageService'
import { formatAdminLogin } from '../screens/admin/adminStyles'
import type { User } from '../types'

type AdminSupportMessagesContextValue = {
  threads: AdminSupportThreadRow[]
  loading: boolean
  reload: () => Promise<void>
  totalUnread: number
  formatUserLabel: (entry?: User) => string
}

const AdminSupportMessagesContext = createContext<AdminSupportMessagesContextValue | null>(null)

export function AdminSupportMessagesProvider({
  refreshKey = 0,
  children,
}: {
  refreshKey?: number
  children: ReactNode
}) {
  const { user } = useAuth()
  const [threads, setThreads] = useState<AdminSupportThreadRow[]>([])
  const [loading, setLoading] = useState(true)
  const reloadInFlightRef = useRef(false)
  const hasLoadedRef = useRef(false)
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reload = useCallback(async () => {
    if (!user || user.role !== 'admin') {
      setThreads([])
      setLoading(false)
      hasLoadedRef.current = false
      return
    }

    if (reloadInFlightRef.current) return
    reloadInFlightRef.current = true

    if (!hasLoadedRef.current) setLoading(true)

    try {
      const users = await listAllUsers()
      const rows = await loadAdminSupportThreadRows(user.id, users, formatChatTime)
      setThreads(rows)
      hasLoadedRef.current = true
    } finally {
      setLoading(false)
      reloadInFlightRef.current = false
    }
  }, [user])

  useEffect(() => {
    void reload()
  }, [reload, refreshKey])

  const reloadRef = useRef(reload)
  reloadRef.current = reload

  useEffect(() => {
    if (!user || user.role !== 'admin') return

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void reloadRef.current()
    })

    return () => {
      subscription.remove()
    }
  }, [user?.id, user?.role])

  useEffect(() => {
    if (!user || user.role !== 'admin' || !isSupabaseConfigured()) return

    return subscribeToChatInserts((message) => {
      if (!isSupportThread(message.threadId)) return
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current)
      reloadTimerRef.current = setTimeout(() => {
        void reloadRef.current()
      }, 350)
    })
  }, [user?.id, user?.role])

  const totalUnread = useMemo(() => threads.reduce((sum, row) => sum + row.unread, 0), [threads])

  const formatUserLabel = useCallback((entry?: User) => {
    if (!entry) return 'Unknown user'
    const login = formatAdminLogin(entry)
    return `${entry.name} · ${entry.role === 'host' ? 'Host' : 'Guest'} · ${login}`
  }, [])

  const value = useMemo(
    () => ({
      threads,
      loading,
      reload,
      totalUnread,
      formatUserLabel,
    }),
    [formatUserLabel, loading, reload, threads, totalUnread],
  )

  return (
    <AdminSupportMessagesContext.Provider value={value}>{children}</AdminSupportMessagesContext.Provider>
  )
}

export function useAdminSupportMessages() {
  const ctx = useContext(AdminSupportMessagesContext)
  if (!ctx) {
    throw new Error('useAdminSupportMessages must be used within AdminSupportMessagesProvider')
  }
  return ctx
}

export type { AdminSupportThreadRow }
