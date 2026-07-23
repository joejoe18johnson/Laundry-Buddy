import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { formatChatTime, useMessages } from '../context/MessageContext'
import { listAllUsers } from '../lib/adminUsers'
import {
  isSupportThread,
  messagePreview,
  parseSupportThread,
  supportThreadId,
} from '../lib/chatThreads'
import { countUnreadInThread, loadAllThreadIds, loadSupportThreadIds, loadThreadMessages } from '../lib/messageStorage'
import { formatAdminLogin } from '../screens/admin/adminStyles'
import type { User } from '../types'

export type AdminSupportThreadRow = {
  threadId: string
  user?: User
  preview: string
  time?: string
  unread: number
  lastCreatedAt?: string
}

export function useAdminSupportMessages(refreshKey = 0) {
  const { user } = useAuth()
  const { refreshThreads } = useMessages()
  const [threads, setThreads] = useState<AdminSupportThreadRow[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user || user.role !== 'admin') {
      setThreads([])
      setLoading(false)
      return
    }

    setLoading(true)
    const users = await listAllUsers()
    const userMap = new Map(users.filter((entry) => entry.role !== 'admin').map((entry) => [entry.id, entry]))
    const [storedIds, remoteSupportIds] = await Promise.all([loadAllThreadIds(), loadSupportThreadIds()])
    const threadIds = Array.from(
      new Set([
        ...remoteSupportIds,
        ...storedIds.filter((threadId) => isSupportThread(threadId)),
        ...Array.from(userMap.keys()).map((userId) => supportThreadId(userId)),
      ]),
    )

    const rows: AdminSupportThreadRow[] = []

    for (const threadId of threadIds) {
      const messages = await loadThreadMessages(threadId)
      if (messages.length === 0) continue

      const parsed = parseSupportThread(threadId)
      const endUser = parsed ? userMap.get(parsed.userId) : undefined
      const last = messages[messages.length - 1]
      const unread = await countUnreadInThread(user.id, threadId, messages)

      rows.push({
        threadId,
        user: endUser,
        preview: last ? messagePreview(last) : 'No messages yet',
        time: last ? formatChatTime(last.createdAt) : undefined,
        unread,
        lastCreatedAt: last?.createdAt,
      })
    }

    rows.sort((a, b) => {
      const aMs = a.lastCreatedAt ? Date.parse(a.lastCreatedAt) : 0
      const bMs = b.lastCreatedAt ? Date.parse(b.lastCreatedAt) : 0
      return bMs - aMs
    })

    await refreshThreads(rows.map((row) => row.threadId))
    setThreads(rows.map(({ lastCreatedAt: _lastCreatedAt, ...row }) => row))
    setLoading(false)
  }, [refreshThreads, user])

  useEffect(() => {
    void reload()
  }, [reload, refreshKey])

  const totalUnread = useMemo(() => threads.reduce((sum, row) => sum + row.unread, 0), [threads])

  const formatUserLabel = useCallback((entry?: User) => {
    if (!entry) return 'Unknown user'
    const login = formatAdminLogin(entry)
    return `${entry.name} · ${entry.role === 'host' ? 'Host' : 'Guest'} · ${login}`
  }, [])

  return {
    threads,
    loading,
    reload,
    totalUnread,
    formatUserLabel,
  }
}
