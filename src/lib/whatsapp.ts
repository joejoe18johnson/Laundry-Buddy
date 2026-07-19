import { Linking } from 'react-native'
import { formatMoney } from './bookingPayments'
import {
  buildTransferProofMessage,
  buildVerificationCodeRequestMessage,
} from './chatThreads'
import { SUPPORT_PHONE_WHATSAPP } from './supportContact'

export { buildTransferProofMessage, buildVerificationCodeRequestMessage }

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

export function openWhatsAppVerificationCode(phone: string, message: string): void {
  openWhatsAppChat(phone, message)
}

/** @deprecated Use in-app support chat instead. */
export function openSupportWhatsApp(message: string): void {
  openWhatsAppChat(SUPPORT_PHONE_WHATSAPP, message)
}

/** @deprecated Use in-app chat with payment proof attachment instead. */
export async function sendTransferProofViaWhatsApp(
  _hostWhatsApp: string,
  _message: string,
  _screenshotUri?: string | null,
): Promise<void> {
  // Legacy no-op — transfer proof is sent in the load chat.
}

export function formatWhatsAppDisplay(phone: string): string {
  const normalized = normalizeWhatsAppPhone(phone)
  if (normalized.length === 10 && normalized.startsWith('501')) {
    return `+${normalized.slice(0, 3)} ${normalized.slice(3, 6)}-${normalized.slice(6)}`
  }
  return phone
}
