import { Linking, Platform, Share } from 'react-native'
import { formatMoney } from './bookingPayments'

export function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('501') && digits.length >= 10) return digits
  if (digits.length === 7) return `501${digits}`
  return digits
}

export function openWhatsAppChat(phone: string, message: string): void {
  const normalized = normalizeWhatsAppPhone(phone)
  if (!normalized) return
  const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
  Linking.openURL(url).catch(() => {})
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
      ? `I am sending my transfer screenshot in this chat — please confirm when received.`
      : `Please confirm when received. I will send my transfer screenshot next.`,
  )
  return lines.join('\n')
}

export async function sendTransferProofViaWhatsApp(
  hostWhatsApp: string,
  message: string,
  screenshotUri?: string | null,
): Promise<void> {
  if (screenshotUri) {
    try {
      const result = await Share.share(
        Platform.OS === 'ios'
          ? { url: screenshotUri, message }
          : { message, url: screenshotUri },
      )
      if (result.action === Share.sharedAction) return
    } catch {
      // fall back to opening WhatsApp chat below
    }
  }

  openWhatsAppChat(hostWhatsApp, message)
}

export function formatWhatsAppDisplay(phone: string): string {
  const normalized = normalizeWhatsAppPhone(phone)
  if (normalized.length === 10 && normalized.startsWith('501')) {
    return `+${normalized.slice(0, 3)} ${normalized.slice(3, 6)}-${normalized.slice(6)}`
  }
  return phone
}
