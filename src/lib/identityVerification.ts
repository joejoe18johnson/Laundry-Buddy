import type { AppRole, DocumentReviewStatus, IdDocumentType, IdentityVerification, User, VerificationStatus } from '../types'
import type { VerificationCodeRequest } from './verificationRequestStorage'

export function emptyIdentityVerification(): IdentityVerification {
  return {
    status: 'none',
    phoneVerified: false,
    idUploaded: false,
  }
}

export function migrateLegacyHostVerification(
  legacy: IdentityVerification | undefined,
  user: Pick<User, 'phone'>,
): IdentityVerification | undefined {
  if (!legacy) return undefined
  return {
    ...legacy,
    phoneVerified: legacy.phoneVerified ?? !!user.phone,
    verifiedPhone: legacy.verifiedPhone ?? user.phone,
  }
}

export function getIdentityVerification(user: User): IdentityVerification {
  if (user.identityVerification) {
    return user.identityVerification
  }
  const migrated = migrateLegacyHostVerification(user.hostVerification, user)
  return migrated ?? emptyIdentityVerification()
}

export function normalizeUserIdentity(user: User): User {
  const verification = getIdentityVerification(user)
  const { hostVerification: _legacy, ...rest } = user
  return { ...rest, identityVerification: verification }
}

export function needsIdentityVerification(user: User): boolean {
  return getIdentityVerification(user).status !== 'verified'
}

export function isIdentityVerified(user: User): boolean {
  return getIdentityVerification(user).status === 'verified'
}

function verificationStatusRank(status: VerificationStatus): number {
  switch (status) {
    case 'verified':
      return 4
    case 'pending':
      return 3
    case 'rejected':
      return 2
    default:
      return 1
  }
}

/** Prefer the furthest-along verification state when local and Supabase differ. */
export function mergeIdentityVerification(
  a: IdentityVerification,
  b: IdentityVerification,
): IdentityVerification {
  const primary =
    verificationStatusRank(a.status) >= verificationStatusRank(b.status) ? a : b
  const secondary = primary === a ? b : a

  return {
    ...secondary,
    ...primary,
    phoneVerified: primary.phoneVerified || secondary.phoneVerified,
    idUploaded: primary.idUploaded || secondary.idUploaded,
    addressUploaded: primary.addressUploaded || secondary.addressUploaded,
    idPhotoUri: primary.idPhotoUri ?? secondary.idPhotoUri,
    selfiePhotoUri: primary.selfiePhotoUri ?? secondary.selfiePhotoUri,
    selfieUploaded: primary.selfieUploaded || secondary.selfieUploaded,
    addressProofUri: primary.addressProofUri ?? secondary.addressProofUri,
    addressProofMimeType: primary.addressProofMimeType ?? secondary.addressProofMimeType,
    addressProofName: primary.addressProofName ?? secondary.addressProofName,
    verifiedPhone: primary.verifiedPhone ?? secondary.verifiedPhone,
    address: primary.address ?? secondary.address,
    idType: primary.idType ?? secondary.idType,
    submittedAt: primary.submittedAt ?? secondary.submittedAt,
    codeRequestStatus: primary.codeRequestStatus ?? secondary.codeRequestStatus,
    codeRequestedAt: primary.codeRequestedAt ?? secondary.codeRequestedAt,
    codeSentAt: primary.codeSentAt ?? secondary.codeSentAt,
    assignedVerificationCode:
      primary.assignedVerificationCode ?? secondary.assignedVerificationCode,
    idReviewStatus: primary.idReviewStatus ?? secondary.idReviewStatus,
    selfieReviewStatus: primary.selfieReviewStatus ?? secondary.selfieReviewStatus,
    addressReviewStatus: primary.addressReviewStatus ?? secondary.addressReviewStatus,
  }
}

/** Merge Supabase profile data with local training cache without losing approval status. */
export function mergeUserProfiles(supabaseUser: User, localUser: User): User {
  const verification = mergeIdentityVerification(
    getIdentityVerification(supabaseUser),
    getIdentityVerification(localUser),
  )

  return normalizeUserIdentity({
    ...localUser,
    ...supabaseUser,
    password: localUser.password || supabaseUser.password,
    identityVerification: verification,
  })
}

export function canBookOrHost(user: User): boolean {
  return isIdentityVerified(user)
}

export function verificationCodeRequestFromUser(user: User): VerificationCodeRequest | null {
  const verification = getIdentityVerification(user)
  if (!verification.codeRequestStatus || verification.codeRequestStatus === 'completed') {
    return null
  }

  return {
    id: `vreq-${user.id}`,
    userId: user.id,
    userName: user.name,
    phone: verification.verifiedPhone ?? user.phone ?? '',
    requestedAt: verification.codeRequestedAt ?? verification.submittedAt ?? new Date().toISOString(),
    status: verification.codeRequestStatus,
    assignedCode: verification.assignedVerificationCode,
    codeSentAt: verification.codeSentAt,
  }
}

export function isPhoneVerificationComplete(user: User): boolean {
  return getIdentityVerification(user).phoneVerified
}

export function marketplaceLockMessage(role: AppRole, status: VerificationStatus = 'none'): string {
  if (status === 'pending') {
    return role === 'host'
      ? 'Verification is under review — you can browse the app, but hosting unlocks after approval.'
      : 'Verification is under review — you can browse dryers, but booking unlocks after approval.'
  }
  return role === 'host'
    ? 'Verify your ID to accept loads and go online.'
    : 'Verify your ID to book dryer sessions.'
}

export function hostNeedsAddressProof(role: AppRole): boolean {
  return role === 'host'
}

export function hasAddressProof(verification: IdentityVerification): boolean {
  return !!verification.addressProofUri || !!verification.addressUploaded
}

export function hasIdDocument(verification: IdentityVerification): boolean {
  return !!verification.idPhotoUri || !!verification.idUploaded
}

export function hasSelfie(verification: IdentityVerification): boolean {
  return !!verification.selfiePhotoUri || !!verification.selfieUploaded
}

export function getIdReviewStatus(verification: IdentityVerification): DocumentReviewStatus | 'none' {
  if (verification.idReviewStatus) return verification.idReviewStatus
  if (verification.status === 'verified' && hasIdDocument(verification)) return 'approved'
  if (verification.status === 'rejected' && hasIdDocument(verification)) return 'rejected'
  if (hasIdDocument(verification) && verification.status === 'pending') return 'pending'
  return 'none'
}

export function getSelfieReviewStatus(verification: IdentityVerification): DocumentReviewStatus | 'none' {
  if (verification.selfieReviewStatus) return verification.selfieReviewStatus
  if (verification.status === 'verified' && hasSelfie(verification)) return 'approved'
  if (verification.status === 'rejected' && hasSelfie(verification)) return 'rejected'
  if (hasSelfie(verification) && verification.status === 'pending') return 'pending'
  return 'none'
}

export function getAddressReviewStatus(verification: IdentityVerification): DocumentReviewStatus | 'none' {
  if (verification.addressReviewStatus) return verification.addressReviewStatus
  if (verification.status === 'verified' && hasAddressProof(verification)) return 'approved'
  if (verification.status === 'rejected' && hasAddressProof(verification)) return 'rejected'
  if (hasAddressProof(verification) && verification.status === 'pending') return 'pending'
  return 'none'
}

export function documentReviewStatusLabel(status: DocumentReviewStatus | 'none'): string {
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  if (status === 'pending') return 'Pending review'
  return 'Not submitted'
}

export function canAdminReviewId(user: User): boolean {
  const verification = getIdentityVerification(user)
  return hasIdDocument(verification) && getIdReviewStatus(verification) === 'pending'
}

export function canAdminReviewSelfie(user: User): boolean {
  const verification = getIdentityVerification(user)
  return hasSelfie(verification) && getSelfieReviewStatus(verification) === 'pending'
}

export function canAdminReviewAddress(user: User): boolean {
  if (user.role !== 'host') return false
  const verification = getIdentityVerification(user)
  return hasAddressProof(verification) && getAddressReviewStatus(verification) === 'pending'
}

/** Derive overall verification status from phone, ID, selfie, and address review states. */
export function recomputeOverallVerification(user: User, verification: IdentityVerification): IdentityVerification {
  const idStatus = getIdReviewStatus(verification)
  const selfieStatus = getSelfieReviewStatus(verification)
  const addressStatus = getAddressReviewStatus(verification)

  if (idStatus === 'rejected' || selfieStatus === 'rejected' || addressStatus === 'rejected') {
    return { ...verification, status: 'rejected' }
  }

  const idOk = idStatus === 'approved'
  const selfieOk = selfieStatus === 'approved'
  const addressOk = user.role !== 'host' || addressStatus === 'approved'

  if (verification.phoneVerified && idOk && selfieOk && addressOk) {
    return { ...verification, status: 'verified', phoneVerified: true }
  }

  if (hasIdDocument(verification) || hasSelfie(verification) || hasAddressProof(verification)) {
    return { ...verification, status: 'pending' }
  }

  return { ...verification, status: verification.status === 'rejected' ? 'rejected' : 'none' }
}

export function formatIdDocumentType(type?: IdDocumentType): string {
  if (type === 'passport') return 'Passport'
  if (type === 'drivers_license') return "Driver's License"
  if (type === 'social_security') return 'Social Security Card'
  return 'Government ID'
}

export const ID_DOCUMENT_OPTIONS: { value: IdDocumentType; label: string }[] = [
  { value: 'passport', label: 'Passport' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'social_security', label: 'Social Security' },
]

export function verificationStatusLabel(status: VerificationStatus, role: AppRole): string {
  if (status === 'verified') return role === 'host' ? 'Verified Host' : 'Verified Guest'
  if (status === 'pending') return 'Verification Pending'
  if (status === 'rejected') return 'Verification Declined'
  return 'Not Verified'
}

export function identityVerificationSteps(role: AppRole): string[] {
  return role === 'host'
    ? ['Phone number', 'Government ID', 'Selfie verification', 'Host address']
    : ['Phone number', 'Government ID', 'Selfie verification']
}

export type VerificationWizardStep = 'phone' | 'id' | 'selfie' | 'address'

export type VerificationTrackState = 'done' | 'active' | 'upcoming' | 'waiting'

export type VerificationTrackStep = {
  key: string
  label: string
  detail?: string
  state: VerificationTrackState
}

type WizardStep = VerificationWizardStep

const PHONE_WHATSAPP_DETAIL = 'Verification code sent via WhatsApp'

function teamReviewPendingDetail(role: AppRole): string {
  return role === 'host'
    ? 'Verifying your ID, selfie, and address proof. Usually done within 30 mins.'
    : 'Verifying your ID and selfie. Usually done within 30 mins.'
}

function unlockLabel(role: AppRole): string {
  return role === 'host' ? 'Hosting unlocked' : 'Booking unlocked'
}

function buildCoreTrack(
  user: User,
  states: {
    phone: VerificationTrackState
    review: VerificationTrackState
    unlock: VerificationTrackState
  },
  details?: { phone?: string; review?: string },
): VerificationTrackStep[] {
  return [
    { key: 'account', label: 'Account created', state: 'done' },
    {
      key: 'phone',
      label: 'Phone number',
      detail: details?.phone ?? (states.phone === 'active' ? PHONE_WHATSAPP_DETAIL : undefined),
      state: states.phone,
    },
    {
      key: 'review',
      label: 'Team review',
      detail: details?.review,
      state: states.review,
    },
    {
      key: 'unlock',
      label: unlockLabel(user.role),
      state: states.unlock,
    },
  ]
}

function wizardStepIndex(step: WizardStep): number {
  if (step === 'phone') return 0
  if (step === 'id') return 1
  if (step === 'selfie') return 2
  return 3
}

/** Steps shown in the Verification Center progress tracker. */
export function getVerificationTrackSteps(
  user: User,
  options?: { wizardStep?: WizardStep },
): VerificationTrackStep[] {
  const verification = getIdentityVerification(user)
  const wizard = options?.wizardStep
  const status = verification.status
  const phoneDisplay = verification.verifiedPhone ?? user.phone

  if (status === 'verified') {
    return buildCoreTrack(
      user,
      { phone: 'done', review: 'done', unlock: 'done' },
      { phone: phoneDisplay, review: 'Approved' },
    )
  }

  if (status === 'pending') {
    return buildCoreTrack(
      user,
      { phone: 'done', review: 'waiting', unlock: 'upcoming' },
      { phone: phoneDisplay, review: teamReviewPendingDetail(user.role) },
    )
  }

  if (status === 'rejected') {
    return buildCoreTrack(
      user,
      { phone: 'upcoming', review: 'active', unlock: 'upcoming' },
      { review: 'Previous submission declined — resubmit below' },
    )
  }

  const wizardIndex = wizard ? wizardStepIndex(wizard) : 0
  const phoneState: VerificationTrackState =
    wizardIndex > 0 ? 'done' : wizardIndex === 0 ? 'active' : 'upcoming'
  const reviewState: VerificationTrackState = wizardIndex >= 1 ? 'active' : 'upcoming'

  return buildCoreTrack(
    user,
    { phone: phoneState, review: reviewState, unlock: 'upcoming' },
    {
      phone:
        phoneState === 'done'
          ? phoneDisplay
          : phoneState === 'active'
            ? PHONE_WHATSAPP_DETAIL
            : undefined,
      review:
        reviewState === 'active'
          ? wizardIndex >= 3 && user.role === 'host'
            ? 'Upload your address proof'
            : wizardIndex >= 2 && user.role === 'host'
              ? 'Take a selfie to match your ID'
              : wizardIndex >= 2
                ? 'Take a selfie to match your ID'
                : wizardIndex >= 1
                  ? 'Upload your government ID'
                  : undefined
          : undefined,
    },
  )
}

export function verificationCenterHeadline(status: VerificationStatus, role: AppRole): string {
  if (status === 'verified') return 'Verification complete'
  if (status === 'pending') return 'Verification submitted'
  if (status === 'rejected') return 'Verification declined'
  return 'Verification center'
}

export function verificationCenterSubtitle(status: VerificationStatus, role: AppRole): string {
  if (status === 'verified') {
    return role === 'host'
      ? 'You are verified — hosting is unlocked. You will not need to complete verification again.'
      : 'You are verified — booking is unlocked. You will not need to complete verification again.'
  }
  if (status === 'pending') {
    return 'Browse the app while we verify your documents. Usually done within 30 minutes.'
  }
  if (status === 'rejected') {
    return 'Please resubmit clear photos and correct details below.'
  }
  return role === 'host'
    ? 'Add your phone number, verify via WhatsApp code, then submit your ID, a matching selfie, and address proof.'
    : 'Add your phone number, verify via WhatsApp code, then submit your ID and a matching selfie.'
}
