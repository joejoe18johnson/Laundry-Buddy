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
    ? ['WhatsApp', 'Government ID', 'Host Address']
    : ['WhatsApp', 'Government ID']
}

export type VerificationTrackState = 'done' | 'active' | 'upcoming' | 'waiting'

export type VerificationTrackStep = {
  key: string
  label: string
  detail?: string
  state: VerificationTrackState
}

type WizardStep = 'phone' | 'id' | 'address'

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
  const isHost = user.role === 'host'
  const wizard = options?.wizardStep
  const status = verification.status

  if (status === 'verified') {
    return [
      { key: 'account', label: 'Account created', state: 'done' },
      {
        key: 'whatsapp',
        label: 'WhatsApp number',
        detail: verification.verifiedPhone ?? user.phone,
        state: 'done',
      },
      {
        key: 'id',
        label: 'Government ID',
        detail: verification.idType ? formatIdDocumentType(verification.idType) : undefined,
        state: 'done',
      },
      ...(isHost
        ? [{ key: 'address', label: 'Host address', detail: verification.address, state: 'done' as const }]
        : []),
      { key: 'review', label: 'Team review', state: 'done' },
      {
        key: 'unlock',
        label: isHost ? 'Hosting unlocked' : 'Booking unlocked',
        state: 'done',
      },
    ]
  }

  if (status === 'pending') {
    return [
      { key: 'account', label: 'Account created', state: 'done' },
      {
        key: 'whatsapp',
        label: 'WhatsApp number',
        detail: verification.verifiedPhone ?? user.phone,
        state: 'done',
      },
      {
        key: 'id',
        label: 'Government ID',
        detail: verification.idType ? formatIdDocumentType(verification.idType) : 'Uploaded',
        state: 'done',
      },
      ...(isHost && verification.address
        ? [{ key: 'address', label: 'Host address', detail: verification.address, state: 'done' as const }]
        : isHost
          ? [{ key: 'address', label: 'Host address', state: 'done' as const }]
          : []),
      {
        key: 'review',
        label: 'Team review',
        detail: 'Usually within 1 business day',
        state: 'waiting',
      },
      {
        key: 'unlock',
        label: isHost ? 'Hosting unlocked' : 'Booking unlocked',
        state: 'upcoming',
      },
    ]
  }

  if (status === 'rejected') {
    return [
      { key: 'account', label: 'Account created', state: 'done' },
      { key: 'whatsapp', label: 'WhatsApp number', state: 'upcoming' },
      { key: 'id', label: 'Government ID', state: 'upcoming' },
      ...(isHost ? [{ key: 'address', label: 'Host address', state: 'upcoming' as const }] : []),
      { key: 'review', label: 'Resubmit required', detail: 'Previous submission declined', state: 'active' },
      { key: 'unlock', label: isHost ? 'Hosting unlocked' : 'Booking unlocked', state: 'upcoming' },
    ]
  }

  const wizardIndex = wizard ? wizardStepIndex(wizard) : 0
  const track: VerificationTrackStep[] = [
    { key: 'account', label: 'Account created', state: 'done' },
    {
      key: 'whatsapp',
      label: 'WhatsApp number',
      state: wizardIndex > 0 ? 'done' : wizardIndex === 0 ? 'active' : 'upcoming',
    },
    {
      key: 'id',
      label: 'Government ID',
      state: wizardIndex > 1 ? 'done' : wizardIndex === 1 ? 'active' : 'upcoming',
    },
  ]

  if (isHost) {
    track.push({
      key: 'address',
      label: 'Host address',
      state: wizardIndex > 2 ? 'done' : wizardIndex === 2 ? 'active' : 'upcoming',
    })
  }

  track.push(
    { key: 'review', label: 'Team review', state: 'upcoming' },
    { key: 'unlock', label: isHost ? 'Hosting unlocked' : 'Booking unlocked', state: 'upcoming' },
  )

  return track
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
    ? 'Complete each step to unlock hosting and accept loads.'
    : 'Complete each step to unlock booking dryer sessions.'
}
