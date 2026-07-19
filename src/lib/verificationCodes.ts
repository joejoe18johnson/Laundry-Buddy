/** Pre-loaded 6-digit codes for training and support testing. */
export const SEED_VERIFICATION_CODES = [
  '482913',
  '719046',
  '305827',
  '864152',
  '291638',
  '547209',
  '603481',
  '158394',
  '726850',
  '390174',
  '814265',
  '637091',
  '205748',
  '963120',
  '451806',
  '728394',
  '516072',
  '839461',
  '164927',
  '592038',
] as const

export type VerificationCodeStatus = 'available' | 'assigned' | 'used'

export type VerificationCodeRecord = {
  code: string
  status: VerificationCodeStatus
  assignedUserId?: string
  assignedUserName?: string
  assignedAt?: string
  usedAt?: string
}

export function isSixDigitCode(text: string): boolean {
  return /^\d{6}$/.test(text.trim())
}

export const VERIFICATION_CODE_REQUEST_TITLE = 'Verification code requested'
export const VERIFICATION_CODE_SENT_TITLE = 'Your verification code'
export const VERIFICATION_APPROVED_TITLE = "You're verified!"

export function buildAdminVerificationRequestBody(userName: string, phone: string): string {
  return `${userName} requested a 6-digit verification code for ${phone}.`
}

export function buildWhatsAppVerificationCodeMessage(userName: string, code: string): string {
  return [
    `Hi ${userName}!`,
    '',
    `Your Laundry Buddy verification code is:`,
    '',
    code,
    '',
    'Enter this 6-digit code in the app under Verification Center.',
  ].join('\n')
}

/** @deprecated Codes are delivered via WhatsApp, not in-app notification. */
export function buildUserVerificationCodeBody(code: string): string {
  return `Your Laundry Buddy verification code is ${code}. Enter it in Verification Center to unlock your account.`
}

export function buildCodeAcceptedMessage(): string {
  return 'Code verified! Your account is approved — booking and hosting are now unlocked. Welcome to Laundry Buddy.'
}

export function buildCodeRejectedMessage(): string {
  return 'That code does not match. Check the 6-digit code we sent and try again.'
}

export function buildVerificationApprovedBody(role: 'customer' | 'host'): string {
  if (role === 'host') {
    return 'Your ID and address are approved. You are verified — hosting is unlocked and you will not need to verify again.'
  }
  return 'Your ID is approved. You are verified — booking is unlocked and you will not need to verify again.'
}
