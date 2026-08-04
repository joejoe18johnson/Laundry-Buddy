import type { ChatMessage, ChatMessageKind } from '../../types'
import { normalizeChatMessage } from '../chatMessages'
import { getSupabaseClient } from './client'
import type { Database } from './database.types'

type ChatMessageRow = Database['public']['Tables']['chat_messages']['Row']
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert']

function rowToMessage(row: ChatMessageRow): ChatMessage {
  return normalizeChatMessage({
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    senderName: row.sender_name ?? 'Unknown',
    senderRole: row.sender_role as ChatMessage['senderRole'],
    text: row.text ?? undefined,
    imageUri: row.image_uri ?? undefined,
    kind: row.kind,
    createdAt: row.created_at,
  })
}

function messageToInsert(message: ChatMessage): ChatMessageInsert {
  return {
    thread_id: message.threadId,
    sender_id: message.senderId,
    sender_name: message.senderName,
    sender_role: message.senderRole,
    text: message.text ?? null,
    image_uri: message.imageUri ?? null,
    kind: message.kind,
    created_at: message.createdAt,
  }
}

export async function fetchThreadMessagesFromSupabase(threadId: string): Promise<ChatMessage[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data.map(rowToMessage)
}

export async function insertChatMessageToSupabase(message: ChatMessage): Promise<ChatMessage[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return [message]

  const { error } = await supabase.from('chat_messages').insert(messageToInsert(message))
  if (error) {
    throw new Error(error.message)
  }

  return fetchThreadMessagesFromSupabase(message.threadId)
}

export async function fetchAccessibleThreadIdsFromSupabase(): Promise<string[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase.from('chat_messages').select('thread_id')
  if (error || !data) return []

  return Array.from(new Set(data.map((row) => row.thread_id).filter(Boolean)))
}

export async function fetchSupportThreadIdsFromSupabase(): Promise<string[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('chat_messages')
    .select('thread_id')
    .like('thread_id', 'support:%')

  if (error || !data) return []
  return Array.from(new Set(data.map((row) => row.thread_id).filter(Boolean)))
}

export async function markThreadReadInSupabase(userId: string, threadId: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  await supabase.from('chat_read_receipts').upsert(
    {
      user_id: userId,
      thread_id: threadId,
      read_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,thread_id' },
  )
}

export async function markAllThreadsReadInSupabase(
  userId: string,
  threadIds: string[],
): Promise<void> {
  if (threadIds.length === 0) return
  const supabase = getSupabaseClient()
  if (!supabase) return

  const now = new Date().toISOString()
  await supabase.from('chat_read_receipts').upsert(
    threadIds.map((threadId) => ({
      user_id: userId,
      thread_id: threadId,
      read_at: now,
    })),
    { onConflict: 'user_id,thread_id' },
  )
}

export async function fetchThreadLastReadFromSupabase(
  userId: string,
  threadId: string,
): Promise<string | null> {
  const reads = await fetchThreadLastReadsFromSupabase(userId, [threadId])
  return reads[threadId] ?? null
}

export async function fetchThreadLastReadsFromSupabase(
  userId: string,
  threadIds: string[],
): Promise<Record<string, string>> {
  const supabase = getSupabaseClient()
  if (!supabase || threadIds.length === 0) return {}

  const { data, error } = await supabase
    .from('chat_read_receipts')
    .select('thread_id, read_at')
    .eq('user_id', userId)
    .in('thread_id', threadIds)

  if (error || !data) return {}

  const reads: Record<string, string> = {}
  for (const row of data) {
    if (row.thread_id && row.read_at) reads[row.thread_id] = row.read_at
  }
  return reads
}

export async function fetchSupportMessagesFromSupabase(): Promise<Map<string, ChatMessage[]>> {
  const supabase = getSupabaseClient()
  const grouped = new Map<string, ChatMessage[]>()
  if (!supabase) return grouped

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .like('thread_id', 'support:%')
    .order('created_at', { ascending: true })

  if (error || !data) return grouped

  for (const row of data) {
    const message = rowToMessage(row)
    const list = grouped.get(message.threadId) ?? []
    list.push(message)
    grouped.set(message.threadId, list)
  }

  return grouped
}

export function subscribeToChatInserts(onInsert: (message: ChatMessage) => void): () => void {
  const supabase = getSupabaseClient()
  if (!supabase) return () => {}

  const channel = supabase
    .channel('chat-messages-sync')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      },
      (payload) => {
        try {
          onInsert(rowToMessage(payload.new as ChatMessageRow))
        } catch {
          // Ignore malformed realtime payloads.
        }
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export function isRemoteMessageKind(value: string): value is ChatMessageKind {
  return value === 'text' || value === 'image' || value === 'payment_proof' || value === 'system'
}
