import { identityVerificationLink } from './notificationLinks'
import {
  buildUserVerificationCodeSentBody,
  buildWhatsAppVerificationCodeMessage,
  VERIFICATION_CODE_SENT_TITLE,
} from './verificationCodes'
import type { VerificationCodeRequest } from './verificationRequestStorage'
import { formatWhatsAppDisplay, openWhatsAppVerificationCode, WHATSAPP_SEND_INSTRUCTION } from './whatsapp'

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

export async function deliverVerificationCodeViaWhatsApp({
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

  const message = buildWhatsAppVerificationCodeMessage(request.userName, result.code)
  const opened = await openWhatsAppVerificationCode(request.phone, message)
  if (!opened) {
    return { ok: false, error: 'Could not open WhatsApp on this device.' }
  }

  await push(
    request.userId,
    VERIFICATION_CODE_SENT_TITLE,
    buildUserVerificationCodeSentBody(formatWhatsAppDisplay(request.phone)),
    identityVerificationLink(),
  )

  return { ok: true, instruction: WHATSAPP_SEND_INSTRUCTION }
}
