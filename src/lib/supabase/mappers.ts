import type { IdentityVerification, User } from '../../types'
import { emptyIdentityVerification, getIdentityVerification, normalizeUserIdentity } from '../identityVerification'
import type { Database } from './database.types'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

function parseIdentityVerification(raw: unknown): IdentityVerification {
  if (!raw || typeof raw !== 'object') return emptyIdentityVerification()
  const value = raw as Partial<IdentityVerification>
  return {
    ...emptyIdentityVerification(),
    ...value,
  }
}

export function profileRowToUser(row: ProfileRow): User {
  const user: User = {
    id: row.id,
    name: row.name,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    password: '',
    role: row.role,
    createdAt: row.created_at,
    identityVerification: parseIdentityVerification(row.identity_verification),
  }
  return normalizeUserIdentity(user)
}

export function identityVerificationToJson(verification: IdentityVerification): Database['public']['Tables']['profiles']['Update']['identity_verification'] {
  return verification as unknown as Database['public']['Tables']['profiles']['Update']['identity_verification']
}
