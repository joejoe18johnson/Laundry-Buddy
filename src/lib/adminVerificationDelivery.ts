import { identityVerificationLink } from './notificationLinks'
import {
  buildUserVerificationCodeSentBody,
  buildVerificationCodeMessage,
  VERIFICATION_CODE_SENT_TITLE,
} from './verificationCodes'
import type { VerificationCodeRequest } from './verificationRequestStorage'
import {
  CODE_SEND_INSTRUCTION,
  formatPhoneDisplay,
  openPhoneVerificationMessage,
} from './whatsapp'

type PushFn = (
  userId: string,
  title: string,
  body: string,
  link?: ReturnType<typeof identityVerificationLink>,
) => Promise<void>

type AdminSendFn = (userId: string) => Promise<{
  ok: boolean
  code?: string
  userName?: string
  error?: string
}>

export async function deliverVerificationCodeToUser({
  request,
  adminSendVerificationCode,
  push,
}: {
  request: VerificationCodeRequest
  adminSendVerificationCode: AdminSendFn
  push: PushFn
}): Promise<{ ok: boolean; error?: string; instruction?: string }> {
  const result = await adminSendVerificationCode(request.userId)
  if (!result.ok || !result.code) {
    return { ok: false, error: result.error ?? 'Could not send verification code.' }
  }

  const message = buildVerificationCodeMessage(request.userName, result.code)
  const opened = await openPhoneVerificationMessage(request.phone, message)
  if (!opened) {
    return { ok: false, error: 'Could not open your messaging app on this device.' }
  }

  await push(
    request.userId,
    VERIFICATION_CODE_SENT_TITLE,
    buildUserVerificationCodeSentBody(formatPhoneDisplay(request.phone)),
    identityVerificationLink(),
  )

  return { ok: true, instruction: CODE_SEND_INSTRUCTION }
}

/** @deprecated Use deliverVerificationCodeToUser */
export const deliverVerificationCodeViaWhatsApp = deliverVerificationCodeToUser
