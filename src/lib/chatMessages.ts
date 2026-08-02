import type { ChatMessage, ChatMessageKind } from '../types'

const VALID_ROLES = new Set<ChatMessage['senderRole']>(['customer', 'host', 'admin'])
const VALID_KINDS = new Set<ChatMessageKind>(['text', 'image', 'payment_proof', 'system'])

export function normalizeChatMessageKind(
  kind: unknown,
  imageUri?: string | null,
  paymentProof?: boolean,
): ChatMessageKind {
  if (typeof kind === 'string' && VALID_KINDS.has(kind as ChatMessageKind)) {
    return kind as ChatMessageKind
  }
  if (paymentProof && imageUri) return 'payment_proof'
  if (imageUri) return 'image'
  return 'text'
}

export function normalizeChatMessage(message: ChatMessage): ChatMessage {
  const senderRole: ChatMessage['senderRole'] =
    message.senderRole === 'support'
      ? 'support'
      : VALID_ROLES.has(message.senderRole as ChatMessage['senderRole'])
        ? (message.senderRole as Exclude<ChatMessage['senderRole'], 'support'>)
        : 'customer'

  return {
    id: message.id || `msg-${Date.now()}`,
    threadId: message.threadId,
    senderId: message.senderId || 'unknown',
    senderName: message.senderName?.trim() || 'Unknown',
    senderRole,
    text: message.text?.trim() || undefined,
    imageUri: message.imageUri?.trim() || undefined,
    kind: normalizeChatMessageKind(message.kind, message.imageUri),
    createdAt: message.createdAt || new Date().toISOString(),
  }
}

export function normalizeChatMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map(normalizeChatMessage)
}
