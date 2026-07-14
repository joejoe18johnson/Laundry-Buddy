import { Linking } from 'react-native'
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
}: {
  guestName: string
  hostName: string
  amount: number
  loads: number
  bookingId?: string
  bankName?: string
  accountNumber?: string
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
  lines.push(``, `Please confirm when received. I can send a screenshot of the transfer.`)
  return lines.join('\n')
}

export function sendTransferProofViaWhatsApp(hostWhatsApp: string, message: string): void {
  openWhatsAppChat(hostWhatsApp, message)
}
