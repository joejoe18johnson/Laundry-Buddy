import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ChatMessage } from '../types'

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

export async function loadAllThreadIds(): Promise<string[]> {
  const map = await readMessageMap()
  return Object.keys(map).filter((threadId) => (map[threadId]?.length ?? 0) > 0)
}

export async function loadThreadMessages(threadId: string): Promise<ChatMessage[]> {
  const map = await readMessageMap()
  return map[threadId] ?? []
}

export async function appendThreadMessage(message: ChatMessage): Promise<ChatMessage[]> {
  const map = await readMessageMap()
  const list = [...(map[message.threadId] ?? []), message]
  map[message.threadId] = list
  await writeMessageMap(map)
  return list
}

export async function markThreadRead(userId: string, threadId: string): Promise<void> {
  const map = await readReadMap()
  map[userId] = { ...(map[userId] ?? {}), [threadId]: new Date().toISOString() }
  await writeReadMap(map)
}

export async function getThreadLastRead(userId: string, threadId: string): Promise<string | null> {
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
