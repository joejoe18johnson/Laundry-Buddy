import type { User } from '../types'
import { listAllUsers, markPhoneVerifiedForUser, resolveUserById } from './adminUsers'
import { saveUser } from './authStorage'
import { getIdentityVerification, normalizeUserIdentity } from './identityVerification'
import { normalizePhone } from './phone'
import { isSupabaseConfigured } from './supabase'
import { supabaseUpdateProfile } from './supabase/authService'
import { adminPatchIdentityVerification } from './supabase/verificationService'
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

async function syncCodeRequestToProfile(userId: string, patch: Record<string, unknown>) {
  const user = await resolveUserById(userId)
  if (!user || !isSupabaseConfigured()) return

  const verification = {
    ...getIdentityVerification(user),
    ...patch,
  }

  try {
    const updated = await supabaseUpdateProfile(
      normalizeUserIdentity({
        ...user,
        identityVerification: verification,
      }),
    )
    await saveUser(updated)
  } catch {
    // Local AsyncStorage still holds the request for offline / training use.
  }
}

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
      identityVerification: {
        ...getIdentityVerification(user),
        verifiedPhone: normalizedPhone,
        codeRequestStatus: 'pending',
        codeRequestedAt: new Date().toISOString(),
      },
    })
    await saveUser(updated)
    if (isSupabaseConfigured()) {
      try {
        const remote = await supabaseUpdateProfile(updated)
        await saveUser(remote)
      } catch {
        // Keep local copy — admin may still see request after listAllUsers merge.
      }
    }
  }

  return createVerificationCodeRequest(userId, userName, normalizedPhone)
}

export async function adminSendVerificationCodeToUser(
  userId: string,
  actingUser?: User | null,
): Promise<{
  ok: boolean
  code?: string
  userName?: string
  error?: string
}> {
  const user = await resolveUserById(userId)
  if (!user) return { ok: false, error: 'User not found' }

  const request = await getOpenVerificationCodeRequest(userId)
  if (!request) return { ok: false, error: 'No open verification code request' }

  const code = await assignVerificationCode(userId, user.name)
  if (!code) return { ok: false, error: 'No verification codes available' }

  await markVerificationCodeSent(userId, code)

  if (isSupabaseConfigured()) {
    const patchResult = await adminPatchIdentityVerification(
      userId,
      {
        ...getIdentityVerification(user),
        codeRequestStatus: 'code_sent',
        codeSentAt: new Date().toISOString(),
        assignedVerificationCode: code,
        verifiedPhone: request.phone,
      },
      actingUser,
    )
    if (!patchResult.ok) {
      return { ok: false, error: patchResult.error }
    }
  }

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

  const user = await resolveUserById(userId)
  const verification = user ? getIdentityVerification(user) : null

  const assigned = await getAssignedCodeForUser(userId)
  const remoteCode =
    verification?.assignedVerificationCode &&
    verification.codeRequestStatus === 'code_sent'
      ? verification.assignedVerificationCode
      : null
  const expectedCode = assigned?.code ?? remoteCode

  if (!expectedCode) {
    return { ok: false, error: 'Request a verification code first and wait for support to send it on WhatsApp.' }
  }

  if (expectedCode !== trimmed) {
    return { ok: false, error: 'That code does not match. Check the code we sent on WhatsApp.' }
  }

  if (assigned) {
    await markVerificationCodeUsed(userId, trimmed)
  }

  const request = await getVerificationCodeRequestForUser(userId)
  await markPhoneVerifiedForUser(userId, request?.phone ?? verification?.verifiedPhone)
  await completeVerificationCodeRequest(userId)

  await syncCodeRequestToProfile(userId, {
    codeRequestStatus: 'completed',
    phoneVerified: true,
    assignedVerificationCode: undefined,
  })

  return { ok: true }
}

export async function getOpenVerificationCodeRequest(
  userId: string,
): Promise<VerificationCodeRequest | null> {
  const user = await resolveUserById(userId)
  const verification = user ? getIdentityVerification(user) : null

  if (verification?.codeRequestStatus && verification.codeRequestStatus !== 'completed') {
    return {
      id: `vreq-${userId}`,
      userId,
      userName: user!.name,
      phone: verification.verifiedPhone ?? user!.phone ?? '',
      requestedAt: verification.codeRequestedAt ?? new Date().toISOString(),
      status: verification.codeRequestStatus,
      assignedCode: verification.assignedVerificationCode,
      codeSentAt: verification.codeSentAt,
    }
  }

  return getVerificationCodeRequestForUser(userId)
}

export async function listOpenVerificationCodeRequests(): Promise<VerificationCodeRequest[]> {
  const localRequests = await import('./verificationRequestStorage').then((m) =>
    m.getActiveVerificationCodeRequests(),
  )

  if (!isSupabaseConfigured()) {
    return localRequests
  }

  const users = await listAllUsers()
  const remoteRequests: VerificationCodeRequest[] = []

  for (const entry of users) {
    const verification = getIdentityVerification(entry)
    if (!verification.codeRequestStatus || verification.codeRequestStatus === 'completed') {
      continue
    }
    remoteRequests.push({
      id: `vreq-${entry.id}`,
      userId: entry.id,
      userName: entry.name,
      phone: verification.verifiedPhone ?? entry.phone ?? '',
      requestedAt: verification.codeRequestedAt ?? new Date().toISOString(),
      status: verification.codeRequestStatus,
      assignedCode: verification.assignedVerificationCode,
      codeSentAt: verification.codeSentAt,
    })
  }

  const merged = new Map<string, VerificationCodeRequest>()
  for (const entry of remoteRequests) merged.set(entry.userId, entry)
  for (const entry of localRequests) {
    if (!merged.has(entry.userId)) merged.set(entry.userId, entry)
  }

  return Array.from(merged.values()).sort(
    (a, b) => Date.parse(b.requestedAt) - Date.parse(a.requestedAt),
  )
}
