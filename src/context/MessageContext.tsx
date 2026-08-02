import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AppState } from 'react-native'
import { useAuth } from './AuthContext'
import { useNotifications } from './NotificationContext'
import {
  appendThreadMessage,
  countUnreadInThread,
  loadAllThreadIds,
  loadThreadMessages,
  markAllThreadsRead,
  markThreadRead,
  mergeRemoteMessage,
} from '../lib/messageStorage'
import {
  defaultMessageKind,
  isInquiryThread,
  isSupportThread,
  parseSupportThread,
  resolveBookingChatRecipient,
  resolveInquiryChatRecipient,
  supportThreadId,
} from '../lib/chatThreads'
import { normalizeChatMessage, normalizeChatMessages } from '../lib/chatMessages'
import { listAllUsers } from '../lib/adminUsers'
import { chatLink } from '../lib/notificationLinks'
import { isSupabaseConfigured } from '../lib/supabase'
import { resolveSupabaseProfileId } from '../lib/supabase/profileIds'
import { subscribeToChatInserts } from '../lib/supabase/messageService'
import type { AppRole, Booking, ChatMessage } from '../types'

interface SendMessageInput {
  threadId: string
  text?: string
  imageUri?: string
  kind?: ChatMessage['kind']
  booking?: Booking | null
  paymentProof?: boolean
}

interface MessageState {
  getMessages: (threadId: string) => ChatMessage[]
  refreshThread: (threadId: string) => Promise<ChatMessage[]>
  refreshThreads: (threadIds: string[]) => Promise<void>
  sendMessage: (input: SendMessageInput) => Promise<ChatMessage | null>
  markRead: (threadId: string) => Promise<void>
  markAllRead: (threadIds: string[]) => Promise<void>
  unreadCount: (threadId: string) => number
  totalUnreadCount: number
  openSupportChat: () => string
  messagingUserId: string | null
}

const MessageContext = createContext<MessageState | null>(null)

function nowIso() {
  return new Date().toISOString()
}

export { formatChatTime } from '../lib/chatTimestamps'

export function MessageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { push } = useNotifications()
  const [messagesByThread, setMessagesByThread] = useState<Record<string, ChatMessage[]>>({})
  const [unreadByThread, setUnreadByThread] = useState<Record<string, number>>({})
  const [messagingUserId, setMessagingUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setMessagingUserId(null)
      return
    }
    void (async () => {
      const resolved = isSupabaseConfigured()
        ? ((await resolveSupabaseProfileId(user)) ?? user.id)
        : user.id
      setMessagingUserId(resolved)
    })()
  }, [user])

  const refreshUnread = useCallback(
    async (threadId: string, messages: ChatMessage[]) => {
      if (!user) return
      const readerId = messagingUserId ?? user.id
      const count = await countUnreadInThread(readerId, threadId, messages)
      setUnreadByThread((prev) => ({ ...prev, [threadId]: count }))
    },
    [messagingUserId, user],
  )

  const refreshThread = useCallback(
    async (threadId: string) => {
      const messages = normalizeChatMessages(await loadThreadMessages(threadId))
      setMessagesByThread((prev) => ({ ...prev, [threadId]: messages }))
      await refreshUnread(threadId, messages)
      return messages
    },
    [refreshUnread],
  )

  const refreshThreads = useCallback(
    async (threadIds: string[]) => {
      await Promise.all(threadIds.map((threadId) => refreshThread(threadId)))
    },
    [refreshThread],
  )

  useEffect(() => {
    if (!user) return

    const refreshKnownThreads = async () => {
      const supportId = supportThreadId(user.id)
      const storedIds = await loadAllThreadIds()

      let threadIds: string[]
      if (user.role === 'admin') {
        const users = await listAllUsers()
        threadIds = Array.from(
          new Set([
            ...users.map((entry) => supportThreadId(entry.id)),
            ...storedIds.filter((id) => isSupportThread(id)),
          ]),
        )
      } else {
        threadIds = Array.from(new Set([supportId, ...storedIds]))
      }
      await refreshThreads(threadIds)
    }

    void refreshKnownThreads()

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshKnownThreads()
    })

    const unsubscribeRealtime = isSupabaseConfigured()
      ? subscribeToChatInserts((message) => {
          void mergeRemoteMessage(message).then((messages) => {
            setMessagesByThread((prev) => ({ ...prev, [message.threadId]: messages }))
            void refreshUnread(message.threadId, messages)
          })
        })
      : () => {}

    return () => {
      subscription.remove()
      unsubscribeRealtime()
    }
  }, [refreshThreads, refreshUnread, user])

  const getMessages = useCallback(
    (threadId: string) => messagesByThread[threadId] ?? [],
    [messagesByThread],
  )

  const markRead = useCallback(
    async (threadId: string) => {
      if (!user) return
      const readerId = messagingUserId ?? user.id
      await markThreadRead(readerId, threadId)
      setUnreadByThread((prev) => ({ ...prev, [threadId]: 0 }))
    },
    [messagingUserId, user],
  )

  const markAllRead = useCallback(
    async (threadIds: string[]) => {
      if (!user || threadIds.length === 0) return
      const readerId = messagingUserId ?? user.id
      await markAllThreadsRead(readerId, threadIds)
      setUnreadByThread((prev) => {
        const next = { ...prev }
        for (const threadId of threadIds) {
          next[threadId] = 0
        }
        return next
      })
    },
    [messagingUserId, user],
  )

  const sendMessage = useCallback(
    async ({
      threadId,
      text,
      imageUri,
      kind,
      booking,
      paymentProof,
    }: SendMessageInput): Promise<ChatMessage | null> => {
      if (!user) return null
      const trimmed = text?.trim()
      if (!trimmed && !imageUri) return null

      const senderId = isSupabaseConfigured()
        ? ((await resolveSupabaseProfileId(user)) ?? user.id)
        : user.id

      const message: ChatMessage = normalizeChatMessage({
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        threadId,
        senderId,
        senderName: user.name,
        senderRole: user.role,
        text: trimmed || undefined,
        imageUri: imageUri || undefined,
        kind: kind ?? defaultMessageKind(imageUri, paymentProof),
        createdAt: nowIso(),
      })

      let next: ChatMessage[]
      try {
        next = await appendThreadMessage(message)
      } catch (error) {
        const messageText = error instanceof Error ? error.message : 'Could not send message.'
        throw new Error(messageText)
      }
      setMessagesByThread((prev) => ({ ...prev, [threadId]: next }))
      await markThreadRead(senderId, threadId)
      setUnreadByThread((prev) => ({ ...prev, [threadId]: 0 }))

      if (isSupportThread(threadId)) {
        if (user.role === 'admin') {
          const parsed = parseSupportThread(threadId)
          if (parsed) {
            const preview =
              message.imageUri
                ? `${user.name} sent a photo`
                : trimmed && trimmed.length > 80
                  ? `${trimmed.slice(0, 77).trim()}…`
                  : trimmed || 'New message from support'
            void push(parsed.userId, 'Support replied', preview, chatLink(threadId))
          }
          return message
        }

        if (!isSupabaseConfigured()) {
          const supportReply: ChatMessage = {
            id: `msg-${Date.now()}-support`,
            threadId,
            senderId: 'support',
            senderName: 'Laundry Buddy Support',
            senderRole: 'support',
            text: 'Thanks for your message. Our team will reply here in the app as soon as we can.',
            kind: 'system',
            createdAt: nowIso(),
          }
          const withReply = await appendThreadMessage(supportReply)
          setMessagesByThread((prev) => ({ ...prev, [threadId]: withReply }))
          void push(
            user.id,
            'Support replied',
            supportReply.text ?? 'New message from Laundry Buddy Support',
            chatLink(threadId),
          )
        }

        return message
      }

      if (isInquiryThread(threadId)) {
        const recipient = await resolveInquiryChatRecipient(threadId, user.id)
        if (recipient) {
          const preview =
            message.imageUri
              ? `${user.name} sent a photo`
              : trimmed && trimmed.length > 80
                ? `${trimmed.slice(0, 77).trim()}…`
                : trimmed || 'New message'
          void push(recipient.userId, `Message from ${user.name}`, preview, chatLink(threadId))
        }
        return message
      }

      if (booking) {
        const recipient = resolveBookingChatRecipient(booking, user.id)
        if (recipient) {
          const preview =
            message.kind === 'payment_proof'
              ? `${user.name} sent transfer proof`
              : message.imageUri
                ? `${user.name} sent a photo`
                : trimmed && trimmed.length > 80
                  ? `${trimmed.slice(0, 77).trim()}…`
                  : trimmed || 'New message'
          void push(recipient.userId, `Message from ${user.name}`, preview, chatLink(threadId, booking.id))
        }
      }

      return message
    },
    [push, user],
  )

  const unreadCount = useCallback((threadId: string) => unreadByThread[threadId] ?? 0, [unreadByThread])

  const totalUnreadCount = useMemo(
    () => Object.values(unreadByThread).reduce((sum, count) => sum + count, 0),
    [unreadByThread],
  )

  const openSupportChat = useCallback(() => {
    if (!user) return ''
    return supportThreadId(user.id)
  }, [user])

  const value = useMemo(
    () => ({
      getMessages,
      refreshThread,
      refreshThreads,
      sendMessage,
      markRead,
      markAllRead,
      unreadCount,
      totalUnreadCount,
      openSupportChat,
      messagingUserId,
    }),
    [getMessages, markAllRead, markRead, messagingUserId, openSupportChat, refreshThread, refreshThreads, sendMessage, totalUnreadCount, unreadCount],
  )

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>
}

export function useMessages() {
  const ctx = useContext(MessageContext)
  if (!ctx) throw new Error('useMessages must be used within MessageProvider')
  return ctx
}

export function senderRoleLabel(role: AppRole | 'support'): string {
  if (role === 'support') return 'Support'
  if (role === 'admin') return 'Admin'
  return role === 'host' ? 'Host' : 'Guest'
}
