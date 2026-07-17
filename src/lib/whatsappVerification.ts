import { normalizePhone } from './phone'

export function isValidWhatsAppNumber(phone: string): boolean {
  const normalized = normalizePhone(phone)
  return normalized.length >= 10 && normalized.startsWith('501')
}

export function formatWhatsAppNumberDisplay(phone: string): string {
  const normalized = normalizePhone(phone)
  if (normalized.length === 10 && normalized.startsWith('501')) {
    return `+501 ${normalized.slice(3, 6)} ${normalized.slice(6)}`
  }
  return phone.startsWith('+') ? phone : `+${normalized}`
}

/** @deprecated Use formatWhatsAppNumberDisplay */
export const formatVerifiedPhoneDisplay = formatWhatsAppNumberDisplay
