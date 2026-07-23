import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ChatMessage } from '../types'
import { isSupabaseConfigured } from './supabase'
import {
  fetchAccessibleThreadIdsFromSupabase,
  fetchSupportThreadIdsFromSupabase,
  fetchThreadLastReadFromSupabase,
  fetchThreadMessagesFromSupabase,
  insertChatMessageToSupabase,
  markAllThreadsReadInSupabase,
  markThreadReadInSupabase,
} from './supabase/messageService'

const MESSAGES_KEY = 'laundry-buddy-chat-messages'
const READ_KEY = 'laundry-buddy-chat-read'

async function readMessageMap(): Promise<Record<string, ChatMessage[]>> {
  const raw = await AsyncStorage.getItem(MESSAGES_KEY)
  if (!raw) return {}
  return JSON.parse(raw) as Record<string, ChatMessage[]>
}

async function writeMessageMap(map: Record<string, ChatMessage[]>) {
  await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(map))
}

async function readReadMap(): Promise<Record<string, Record<string, string>>> {
  const raw = await AsyncStorage.getItem(READ_KEY)
  if (!raw) return {}
  return JSON.parse(raw) as Record<string, Record<string, string>>
}

async function writeReadMap(map: Record<string, Record<string, string>>) {
  await AsyncStorage.setItem(READ_KEY, JSON.stringify(map))
}

async function cacheThreadMessages(threadId: string, messages: ChatMessage[]) {
  const map = await readMessageMap()
  map[threadId] = messages
  await writeMessageMap(map)
}

export async function loadAllThreadIds(): Promise<string[]> {
  if (isSupabaseConfigured()) {
    const remote = await fetchAccessibleThreadIdsFromSupabase()
    if (remote.length > 0) return remote
  }

  const map = await readMessageMap()
  return Object.keys(map).filter((threadId) => (map[threadId]?.length ?? 0) > 0)
}

export async function loadSupportThreadIds(): Promise<string[]> {
  if (isSupabaseConfigured()) {
    const remote = await fetchSupportThreadIdsFromSupabase()
    if (remote.length > 0) return remote
  }

  const map = await readMessageMap()
  return Object.keys(map).filter(
    (threadId) => threadId.startsWith('support:') && (map[threadId]?.length ?? 0) > 0,
  )
}

export async function loadThreadMessages(threadId: string): Promise<ChatMessage[]> {
  if (isSupabaseConfigured()) {
    try {
      const remote = await fetchThreadMessagesFromSupabase(threadId)
      if (remote.length > 0) {
        await cacheThreadMessages(threadId, remote)
        return remote
      }
    } catch {
      // Fall back to local cache when offline or RLS blocks read.
    }
  }

  const map = await readMessageMap()
  return map[threadId] ?? []
}

export async function appendThreadMessage(message: ChatMessage): Promise<ChatMessage[]> {
  if (isSupabaseConfigured()) {
    const list = await insertChatMessageToSupabase(message)
    await cacheThreadMessages(message.threadId, list)
    return list
  }

  const map = await readMessageMap()
  const list = [...(map[message.threadId] ?? []), message]
  map[message.threadId] = list
  await writeMessageMap(map)
  return list
}

export async function markThreadRead(userId: string, threadId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await markThreadReadInSupabase(userId, threadId)
  }

  const map = await readReadMap()
  map[userId] = { ...(map[userId] ?? {}), [threadId]: new Date().toISOString() }
  await writeReadMap(map)
}

export async function markAllThreadsRead(userId: string, threadIds: string[]): Promise<void> {
  if (threadIds.length === 0) return

  if (isSupabaseConfigured()) {
    await markAllThreadsReadInSupabase(userId, threadIds)
  }

  const map = await readReadMap()
  const now = new Date().toISOString()
  const userReads = { ...(map[userId] ?? {}) }
  for (const threadId of threadIds) {
    userReads[threadId] = now
  }
  map[userId] = userReads
  await writeReadMap(map)
}

export async function getThreadLastRead(userId: string, threadId: string): Promise<string | null> {
  if (isSupabaseConfigured()) {
    const remote = await fetchThreadLastReadFromSupabase(userId, threadId)
    if (remote) return remote
  }

  const map = await readReadMap()
  return map[userId]?.[threadId] ?? null
}

export async function countUnreadInThread(
  userId: string,
  threadId: string,
  messages: ChatMessage[],
): Promise<number> {
  const lastRead = await getThreadLastRead(userId, threadId)
  if (!lastRead) {
    return messages.filter((message) => message.senderId !== userId).length
  }
  const lastReadMs = Date.parse(lastRead)
  return messages.filter(
    (message) => message.senderId !== userId && Date.parse(message.createdAt) > lastReadMs,
  ).length
}

export async function mergeRemoteMessage(message: ChatMessage): Promise<ChatMessage[]> {
  const existing = await loadThreadMessages(message.threadId)
  if (existing.some((entry) => entry.id === message.id)) {
    return existing
  }

  const merged = [...existing, message].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  )
  await cacheThreadMessages(message.threadId, merged)
  return merged
}
