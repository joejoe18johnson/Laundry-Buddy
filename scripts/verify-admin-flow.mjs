/**
 * Lightweight checks for admin + verification helpers.
 * Run: node scripts/verify-admin-flow.mjs
 */

import assert from 'node:assert/strict'

function hasAddressProof(verification) {
  return !!verification.addressProofUri || !!verification.addressUploaded
}

function usersPendingIdReview(users) {
  return users.filter((entry) => {
    const verification = entry.identityVerification
    if (verification.status !== 'pending' || !verification.idUploaded) return false
    if (entry.role === 'host') return hasAddressProof(verification)
    return true
  })
}

function mergeUsers(localUsers, remoteUsers) {
  const merged = new Map()
  for (const entry of remoteUsers) merged.set(entry.id, entry)
  for (const entry of localUsers) merged.set(entry.id, entry)
  return Array.from(merged.values())
}

const localTraining = [
  { id: 'user-sandra', role: 'customer', identityVerification: { status: 'pending', idUploaded: true } },
  { id: 'user-carlos', role: 'host', identityVerification: { status: 'pending', idUploaded: true, addressProofUri: 'file://bill.pdf' } },
]

const remoteOnly = [{ id: 'uuid-1', role: 'customer', identityVerification: { status: 'none', idUploaded: false } }]

assert.equal(mergeUsers(localTraining, remoteOnly).length, 3)
assert.equal(usersPendingIdReview(localTraining).length, 2)
assert.equal(
  usersPendingIdReview([
    {
      id: 'host-no-proof',
      role: 'host',
      identityVerification: { status: 'pending', idUploaded: true },
    },
  ]).length,
  0,
)

console.log('verify-admin-flow: ok')
