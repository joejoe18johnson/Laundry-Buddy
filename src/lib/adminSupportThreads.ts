import type { ChatMessage, User } from '../types'
import { normalizeChatMessage } from './chatMessages'
import { isSupportThread, messagePreview, parseSupportThread } from './chatThreads'
import { isSupabaseConfigured } from './supabase'
import {
  fetchSupportMessagesFromSupabase,
  fetchThreadLastReadsFromSupabase,
} from './supabase/messageService'

export type AdminSupportThreadRow = {
  threadId: string
  user?: User
  preview: string
  time?: string
  unread: number
}

function countUnread(
  adminUserId: string,
  messages: ChatMessage[],
  lastRead: string | null,
): number {
  if (messages.length === 0) return 0
  if (!lastRead) {
    return messages.filter((message) => message.senderId !== adminUserId).length
  }
  const lastReadMs = Date.parse(lastRead)
  return messages.filter(
    (message) => message.senderId !== adminUserId && Date.parse(message.createdAt) > lastReadMs,
  ).length
}

function buildRows(
  adminUserId: string,
  messagesByThread: Map<string, ChatMessage[]>,
  readByThread: Record<string, string | null>,
  userMap: Map<string, User>,
  formatTime: (iso: string) => string,
): AdminSupportThreadRow[] {
  const rows: AdminSupportThreadRow[] = []

  for (const [threadId, messages] of messagesByThread) {
    if (messages.length === 0) continue
    const last = messages[messages.length - 1]
    const parsed = parseSupportThread(threadId)
    const endUser = parsed ? userMap.get(parsed.userId) : undefined

    rows.push({
      threadId,
      user: endUser,
      preview: last ? messagePreview(last) : 'No messages yet',
      time: last ? formatTime(last.createdAt) : undefined,
      unread: countUnread(adminUserId, messages, readByThread[threadId] ?? null),
    })
  }

  rows.sort((a, b) => {
    const aThread = messagesByThread.get(a.threadId)
    const bThread = messagesByThread.get(b.threadId)
    const aMs = aThread?.length ? Date.parse(aThread[aThread.length - 1].createdAt) : 0
    const bMs = bThread?.length ? Date.parse(bThread[bThread.length - 1].createdAt) : 0
    return bMs - aMs
  })

  return rows
}

async function loadLocalSupportThreads(): Promise<Map<string, ChatMessage[]>> {
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage')
  const raw = await AsyncStorage.getItem('laundry-buddy-chat-messages')
  const map = raw ? (JSON.parse(raw) as Record<string, ChatMessage[]>) : {}
  const grouped = new Map<string, ChatMessage[]>()

  for (const [threadId, messages] of Object.entries(map)) {
    if (!isSupportThread(threadId) || !messages?.length) continue
    grouped.set(threadId, messages.map(normalizeChatMessage))
  }

  return grouped
}

async function loadLocalReadMap(adminUserId: string): Promise<Record<string, string | null>> {
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage')
  const raw = await AsyncStorage.getItem('laundry-buddy-chat-read')
  const map = raw ? (JSON.parse(raw) as Record<string, Record<string, string>>) : {}
  const reads: Record<string, string | null> = {}
  for (const [threadId, readAt] of Object.entries(map[adminUserId] ?? {})) {
    reads[threadId] = readAt
  }
  return reads
}

export async function loadAdminSupportThreadRows(
  adminUserId: string,
  users: User[],
  formatTime: (iso: string) => string,
): Promise<AdminSupportThreadRow[]> {
  const userMap = new Map(users.filter((entry) => entry.role !== 'admin').map((entry) => [entry.id, entry]))

  if (isSupabaseConfigured()) {
    try {
      const grouped = await fetchSupportMessagesFromSupabase()
      const threadIds = Array.from(grouped.keys())
      const readByThread =
        threadIds.length > 0
          ? await fetchThreadLastReadsFromSupabase(adminUserId, threadIds)
          : {}

      return buildRows(adminUserId, grouped, readByThread, userMap, formatTime)
    } catch {
      // Fall back to local cache below.
    }
  }

  const grouped = await loadLocalSupportThreads()
  const readByThread = await loadLocalReadMap(adminUserId)
  return buildRows(adminUserId, grouped, readByThread, userMap, formatTime)
}
