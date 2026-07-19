import { markPhoneVerifiedForUser, resolveUserById } from './adminUsers'
import { saveUser } from './authStorage'
import { normalizeUserIdentity } from './identityVerification'
import { normalizePhone } from './phone'
import {
  assignVerificationCode,
  getAssignedCodeForUser,
  markVerificationCodeUsed,
} from './verificationCodeStorage'
import { isSixDigitCode } from './verificationCodes'
import {
  completeVerificationCodeRequest,
  createVerificationCodeRequest,
  getVerificationCodeRequestForUser,
  markVerificationCodeSent,
  type VerificationCodeRequest,
} from './verificationRequestStorage'

export async function requestVerificationCodeForUser(
  userId: string,
  userName: string,
  phone: string,
): Promise<VerificationCodeRequest> {
  const normalizedPhone = normalizePhone(phone)
  const user = await resolveUserById(userId)
  if (user) {
    const updated = normalizeUserIdentity({
      ...user,
      phone: normalizedPhone,
    })
    await saveUser(updated)
  }
  return createVerificationCodeRequest(userId, userName, normalizedPhone)
}

export async function adminSendVerificationCodeToUser(userId: string): Promise<{
  ok: boolean
  code?: string
  userName?: string
  error?: string
}> {
  const user = await resolveUserById(userId)
  if (!user) return { ok: false, error: 'User not found' }

  const request = await getVerificationCodeRequestForUser(userId)
  if (!request) return { ok: false, error: 'No open verification code request' }

  const code = await assignVerificationCode(userId, user.name)
  if (!code) return { ok: false, error: 'No verification codes available' }

  await markVerificationCodeSent(userId, code)
  return { ok: true, code, userName: user.name }
}

export async function submitVerificationCodeForUser(
  userId: string,
  codeInput: string,
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = codeInput.trim()
  if (!isSixDigitCode(trimmed)) {
    return { ok: false, error: 'Enter the 6-digit code from WhatsApp.' }
  }

  const assigned = await getAssignedCodeForUser(userId)
  if (!assigned || assigned.status !== 'assigned') {
    return { ok: false, error: 'Request a verification code first and wait for admin to send it.' }
  }

  if (assigned.code !== trimmed) {
    return { ok: false, error: 'That code does not match. Check the code we sent on WhatsApp.' }
  }

  await markVerificationCodeUsed(userId, trimmed)
  const request = await getVerificationCodeRequestForUser(userId)
  await markPhoneVerifiedForUser(userId, request?.phone)
  await completeVerificationCodeRequest(userId)
  return { ok: true }
}
