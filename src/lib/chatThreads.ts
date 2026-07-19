import { getHostById } from '../data/mockData'
import { formatMoney } from './bookingPayments'
import { formatWhatsAppDisplay } from './whatsapp'
import type { Booking, ChatMessageKind, User } from '../types'

export const SUPPORT_THREAD_PREFIX = 'support:'

export function supportThreadId(userId: string): string {
  return `${SUPPORT_THREAD_PREFIX}${userId}`
}

export function isSupportThread(threadId: string): boolean {
  return threadId.startsWith(SUPPORT_THREAD_PREFIX)
}

export function buildVerificationCodeRequestMessage(name: string, phone: string): string {
  const display = formatWhatsAppDisplay(phone)
  return [
    `Hi Laundry Buddy! This is ${name}.`,
    `Please send my verification code to my WhatsApp: ${display}.`,
    `I will reply here in the app with the code once I receive it.`,
  ].join('\n')
}

export function buildPaymentRequestMessage({
  hostName,
  amount,
  bankName,
  accountName,
  accountNumber,
}: {
  hostName: string
  amount: number
  bankName: string
  accountName: string
  accountNumber: string
}): string {
  return [
    `Payment request · ${formatMoney(amount)}`,
    '',
    `Transfer to ${bankName} · ${accountName} · ${accountNumber}`,
    '',
    'Submit your transfer screenshot from My loads when done.',
  ].join('\n')
}

export function buildPaymentProofChatNotice(amount: number): string {
  return `Transfer proof submitted · ${formatMoney(amount)}. Tap to view receipt.`
}

export function buildTransferProofMessage({
  guestName,
  hostName,
  amount,
  loads,
  bookingId,
  bankName,
  accountNumber,
  hasScreenshot,
}: {
  guestName: string
  hostName: string
  amount: number
  loads: number
  bookingId?: string
  bankName?: string
  accountNumber?: string
  hasScreenshot?: boolean
}): string {
  const lines = [
    `Hi ${hostName}! This is ${guestName}.`,
    `I sent a bank transfer for my Laundry Buddy booking.`,
    ``,
    `Amount: ${formatMoney(amount)}`,
    `Loads: ${loads}`,
  ]
  if (bookingId) lines.push(`Booking ref: ${bookingId}`)
  if (bankName && accountNumber) {
    lines.push(`Transferred to: ${bankName} · ${accountNumber}`)
  }
  lines.push(
    ``,
    hasScreenshot
      ? `Transfer screenshot attached below — please confirm when received.`
      : `Please confirm when received. I will send my transfer screenshot next.`,
  )
  return lines.join('\n')
}

export function resolveBookingChatRecipient(
  booking: Booking,
  senderId: string,
): { userId: string; name: string } | null {
  if (booking.customerId === senderId) {
    const host = getHostById(booking.hostId)
    if (!host?.hostUserId) return null
    return { userId: host.hostUserId, name: host.name }
  }

  if (booking.customerId) {
    return { userId: booking.customerId, name: booking.customerName }
  }

  return null
}

export function getChatThreadTitle(threadId: string, user: User, booking?: Booking | null): string {
  if (isSupportThread(threadId)) return 'Laundry Buddy Support'

  if (booking) {
    return user.role === 'customer' ? booking.hostName : booking.customerName
  }

  return 'Messages'
}

export function getChatThreadSubtitle(threadId: string, booking?: Booking | null): string | undefined {
  if (isSupportThread(threadId)) return 'Help, verification, and account support'
  if (booking) {
    return `${booking.loads} load${booking.loads === 1 ? '' : 's'} · ${booking.location}`
  }
  return undefined
}

export function defaultMessageKind(imageUri?: string | null, paymentProof?: boolean): ChatMessageKind {
  if (paymentProof && imageUri) return 'payment_proof'
  if (imageUri) return 'image'
  return 'text'
}

export function messagePreview(message: { kind?: string; text?: string; imageUri?: string }): string {
  if (message.kind === 'payment_proof') return 'Payment proof'
  if (message.imageUri) return 'Photo'
  if (message.text) {
    const trimmed = message.text.trim()
    return trimmed.length > 80 ? `${trimmed.slice(0, 77).trim()}…` : trimmed
  }
  return 'Message'
}
