import type { ChatMessage, ChatMessageKind } from '../../types'
import { getSupabaseClient } from './client'
import type { Database } from './database.types'

type ChatMessageRow = Database['public']['Tables']['chat_messages']['Row']
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert']

function rowToMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role as ChatMessage['senderRole'],
    text: row.text ?? undefined,
    imageUri: row.image_uri ?? undefined,
    kind: row.kind,
    createdAt: row.created_at,
  }
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
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('chat_read_receipts')
    .select('read_at')
    .eq('user_id', userId)
    .eq('thread_id', threadId)
    .maybeSingle()

  if (error || !data) return null
  return data.read_at
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
        onInsert(rowToMessage(payload.new as ChatMessageRow))
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
