import type { AppRole, IdDocumentType, IdentityVerification, User, VerificationStatus } from '../types'

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

export function canBookOrHost(user: User): boolean {
  return isIdentityVerified(user)
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
    ? ['Phone number', 'Government ID', 'Host address']
    : ['Phone number', 'Government ID']
}

export type VerificationTrackState = 'done' | 'active' | 'upcoming' | 'waiting'

export type VerificationTrackStep = {
  key: string
  label: string
  detail?: string
  state: VerificationTrackState
}

type WizardStep = 'phone' | 'id' | 'address'

const PHONE_WHATSAPP_DETAIL = 'Verification code sent via WhatsApp'

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
  return 2
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
      { phone: phoneDisplay, review: 'Usually within 1 business day' },
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
          ? wizardIndex >= 2 && user.role === 'host'
            ? 'Upload your address proof'
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
      ? 'You can host loads and appear in guest search.'
      : 'You can book dryer sessions with verified hosts.'
  }
  if (status === 'pending') {
    return 'Browse the app while we review your details. Booking and hosting stay locked until approval.'
  }
  if (status === 'rejected') {
    return 'Please resubmit clear photos and correct details below.'
  }
  return role === 'host'
    ? 'Add your phone number, verify via WhatsApp code, then submit ID for review.'
    : 'Add your phone number, verify via WhatsApp code, then submit ID for review.'
}
