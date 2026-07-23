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
export const VERIFICATION_REJECTED_TITLE = 'Verification update needed'
export const VERIFICATION_DOC_APPROVED_TITLE = 'Verification step approved'
export const NEW_USER_SIGNUP_TITLE = 'New user signed up'

export type VerificationDocumentKind = 'id' | 'selfie' | 'address'

export function buildAdminVerificationRequestBody(userName: string, phone: string): string {
  return `${userName} requested a 6-digit verification code for ${phone}.`
}

export function buildAdminNewSignupBody(
  userName: string,
  phone: string,
  role: 'customer' | 'host',
): string {
  return `${userName} signed up as a ${role === 'host' ? 'host' : 'guest'} · ${phone}. Send a verification code when ready.`
}

export function buildVerificationCodeMessage(userName: string, code: string): string {
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

export function buildUserVerificationCodeSentBody(phone: string): string {
  return `We sent your 6-digit code to ${phone}. Open Verification Center and enter it to continue.`
}

/** @deprecated Use buildVerificationCodeMessage */
export const buildWhatsAppVerificationCodeMessage = buildVerificationCodeMessage

export function buildCodeAcceptedMessage(): string {
  return 'Code verified! Your account is approved — booking and hosting are now unlocked. Welcome to Laundry Buddy.'
}

export function buildCodeRejectedMessage(): string {
  return 'That code does not match. Check the 6-digit code we sent and try again.'
}

export function buildVerificationApprovedBody(role: 'customer' | 'host'): string {
  if (role === 'host') {
    return 'Your ID, selfie, and address are approved. You are verified — hosting is unlocked and you will not need to verify again.'
  }
  return 'Your ID and selfie are approved. You are verified — booking is unlocked and you will not need to verify again.'
}

export function verificationDocumentLabel(kind: VerificationDocumentKind): string {
  if (kind === 'id') return 'Government ID'
  if (kind === 'selfie') return 'Verification selfie'
  return 'Address proof'
}

export function buildVerificationRejectedBody(
  kind: VerificationDocumentKind,
  role: 'customer' | 'host',
): string {
  const label = verificationDocumentLabel(kind)
  if (kind === 'address') {
    return `${label} was declined. Open Verification Center to upload a new utility bill — your approved ID and selfie stay on file.`
  }
  if (kind === 'selfie') {
    return `${label} was declined. Retake your selfie in Verification Center — other approved documents stay on file.`
  }
  return `${label} was declined. Upload a clearer photo in Verification Center — other approved documents stay on file.`
}

export function buildVerificationDocApprovedBody(kind: VerificationDocumentKind): string {
  const label = verificationDocumentLabel(kind)
  return `${label} approved. We will notify you when the rest of your verification is complete.`
}
