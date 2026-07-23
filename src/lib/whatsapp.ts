import { Linking, Platform } from 'react-native'
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

function buildWhatsAppUrls(phone: string, message: string): { appUrl: string; webUrl: string } {
  const normalized = normalizeWhatsAppPhone(phone)
  const text = encodeURIComponent(message)
  return {
    appUrl: `whatsapp://send?phone=${normalized}&text=${text}`,
    webUrl: `https://wa.me/${normalized}?text=${text}`,
  }
}

/** Opens WhatsApp with a pre-filled message and no recipient (share sheet style). */
export async function openWhatsAppShareText(message: string): Promise<boolean> {
  const text = encodeURIComponent(message)
  const appUrl = `whatsapp://send?text=${text}`
  const webUrl = `https://wa.me/?text=${text}`

  if (Platform.OS !== 'web') {
    try {
      const canOpenApp = await Linking.canOpenURL(appUrl)
      if (canOpenApp) {
        await Linking.openURL(appUrl)
        return true
      }
    } catch {
      // fall through to wa.me
    }
  }

  try {
    await Linking.openURL(webUrl)
    return true
  } catch {
    return false
  }
}

/** Opens WhatsApp with a pre-filled message. Admin still taps Send inside WhatsApp. */
export async function openWhatsAppChat(phone: string, message: string): Promise<boolean> {
  const normalized = normalizeWhatsAppPhone(phone)
  if (!normalized) return false

  const { appUrl, webUrl } = buildWhatsAppUrls(phone, message)

  if (Platform.OS !== 'web') {
    try {
      const canOpenApp = await Linking.canOpenURL(appUrl)
      if (canOpenApp) {
        await Linking.openURL(appUrl)
        return true
      }
    } catch {
      // fall through to wa.me
    }
  }

  try {
    await Linking.openURL(webUrl)
    return true
  } catch {
    return false
  }
}

export async function openWhatsAppVerificationCode(phone: string, message: string): Promise<boolean> {
  return openWhatsAppChat(phone, message)
}

/** Opens the user's messaging app with a pre-filled verification code. */
export async function openPhoneVerificationMessage(phone: string, message: string): Promise<boolean> {
  return openWhatsAppChat(phone, message)
}

export const CODE_SEND_INSTRUCTION =
  'Messaging app opened with the code ready — tap Send to deliver it to the user.'

/** @deprecated Use CODE_SEND_INSTRUCTION */
export const WHATSAPP_SEND_INSTRUCTION = CODE_SEND_INSTRUCTION

/** @deprecated Use in-app support chat instead. */
export function openSupportWhatsApp(message: string): void {
  void openWhatsAppChat(SUPPORT_PHONE_WHATSAPP, message)
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

/** @deprecated Use formatPhoneDisplay */
export const formatPhoneDisplay = formatWhatsAppDisplay
