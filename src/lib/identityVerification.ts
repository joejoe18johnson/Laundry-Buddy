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

export function hostNeedsAddressProof(role: AppRole): boolean {
  return role === 'host'
}

export function formatIdDocumentType(type?: IdDocumentType): string {
  if (type === 'passport') return 'Passport'
  if (type === 'social_security') return 'Social Security Card'
  return 'Government ID'
}

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
