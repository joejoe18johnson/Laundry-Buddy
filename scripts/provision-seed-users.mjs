/**
 * Create Laundry Buddy training accounts in Supabase Auth + profiles.
 * Run: node scripts/provision-seed-users.mjs
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const ENV_PATH = path.join(ROOT, '.env')

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return {}
  return Object.fromEntries(
    fs
      .readFileSync(ENV_PATH, 'utf8')
      .split('\n')
      .filter((line) => line.trim() && !line.trim().startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=')
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
      }),
  )
}

const env = loadEnv()
const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL
const ANON_KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY
const PASSWORD = 'demo1234'

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

const VERIFIED_GUEST = {
  status: 'verified',
  phoneVerified: true,
  verifiedPhone: '5016001111',
  idType: 'passport',
  idUploaded: true,
  submittedAt: '2026-06-01T10:00:00.000Z',
}

const VERIFIED_HOST = {
  status: 'verified',
  phoneVerified: true,
  verifiedPhone: '5016001234',
  idType: 'passport',
  idUploaded: true,
  addressUploaded: true,
  address: '22 Coconut St., Las Flores, Cayo',
  submittedAt: '2026-06-15T10:00:00.000Z',
}

const MARIA_HOST_SETTINGS = {
  isOnline: true,
  acceptCash: true,
  acceptBankTransfer: true,
  bankDetails: {
    bankName: 'Belize Bank',
    accountName: 'Maria Flores',
    accountNumber: '1234567890',
  },
  notifyNewRequests: true,
  notifyBookingUpdates: true,
  notifyGuestsWhenOnline: true,
  pricing: { dryPrice: 3, foldingPrice: 3, sheetsPrice: 1 },
  listing: {
    bio: 'UB student sharing my home dryer with neighbors. Usually home afternoons and weekends — happy to help during rainy season.',
    location: 'Las Flores',
    district: 'Cayo',
    address: '22 Coconut St.',
    gateCode: '4421',
    whatsapp: '5016001234',
    latitude: 17.158,
    longitude: -89.072,
    turnaroundHours: 2,
    slotsLeft: 3,
    hasGenerator: false,
    setup: ['Clean laundry room', 'Samsung dryer', 'Covered porch drop-off'],
    rules: ['Drop off in labeled bag', 'No high heat unless noted', 'Pick up within 24 hrs'],
  },
  dropOffAvailability: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
}

const SEED_USERS = [
  {
    label: 'Ana (guest)',
    email: 'ana@ub.edu.bz',
    phone: '5016001111',
    name: 'Ana',
    role: 'customer',
    identity_verification: VERIFIED_GUEST,
  },
  {
    label: 'Maria (host)',
    email: 'maria@example.com',
    phone: '5016001234',
    name: 'Maria Garcia',
    role: 'host',
    identity_verification: VERIFIED_HOST,
    host: {
      id: 'maria',
      name: 'Maria Garcia',
      location: 'Las Flores',
      district: 'Cayo',
      rating: 4.9,
      review_count: 47,
      price: 3,
      folding_price: 3,
      sheets_price: 1,
      slots_left: 3,
      turnaround_hours: 2,
      dryer_type: 'Electric',
      has_generator: false,
      address: '22 Coconut St.',
      gate_code: '4421',
      whatsapp: '5016001234',
      latitude: 17.158,
      longitude: -89.072,
      photos: ['Clean laundry room', 'Samsung dryer', 'Covered porch drop-off'],
      rules: ['Drop off in labeled bag', 'No high heat unless noted', 'Pick up within 24 hrs'],
      bio: MARIA_HOST_SETTINGS.listing.bio,
      is_online: true,
    },
    host_settings: MARIA_HOST_SETTINGS,
  },
]

function authHeaders(token = ANON_KEY) {
  return {
    apikey: ANON_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function signIn(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password: PASSWORD }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, error: body.msg ?? body.error_description ?? res.statusText }
  return { ok: true, user: body.user, accessToken: body.access_token }
}

async function signUp(user) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      email: user.email,
      password: PASSWORD,
      data: {
        name: user.name,
        role: user.role,
        phone: user.phone,
        login_email: user.email,
      },
    }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, error: body.msg ?? body.error_description ?? res.statusText }
  return {
    ok: true,
    user: body.user,
    accessToken: body.access_token,
    needsConfirmation: !body.access_token,
  }
}

async function updateProfile(accessToken, userId, patch) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(accessToken),
      Prefer: 'return=representation',
    },
    body: JSON.stringify(patch),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.message ?? body.error ?? `Profile update failed (${res.status})`)
  }
  return body[0]
}

async function upsertHost(accessToken, hostUserId, host) {
  const payload = { ...host, host_user_id: hostUserId }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/hosts`, {
    method: 'POST',
    headers: {
      ...authHeaders(accessToken),
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.message ?? body.error ?? `Host upsert failed (${res.status})`)
  }
  return Array.isArray(body) ? body[0] : body
}

async function upsertHostSettings(accessToken, hostUserId, settings) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/host_settings`, {
    method: 'POST',
    headers: {
      ...authHeaders(accessToken),
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({
      host_user_id: hostUserId,
      settings,
    }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.message ?? body.error ?? `Host settings upsert failed (${res.status})`)
  }
  return Array.isArray(body) ? body[0] : body
}

async function ensureUser(seed) {
  console.log(`\n→ ${seed.label}`)

  let session = await signIn(seed.email)
  if (!session.ok) {
    console.log('  sign-in missing — creating account…')
    const created = await signUp(seed)
    if (!created.ok) {
      session = await signIn(seed.email)
      if (!session.ok) {
        throw new Error(`${seed.label}: ${created.error ?? session.error}`)
      }
      console.log('  account already existed — signed in')
    } else if (created.needsConfirmation) {
      session = await signIn(seed.email)
      if (!session.ok) {
        throw new Error(
          `${seed.label}: account created but email confirmation is required. Disable "Confirm email" in Supabase Auth settings, then re-run.`,
        )
      }
      console.log('  account created')
    } else {
      session = { ok: true, user: created.user, accessToken: created.accessToken }
      console.log('  account created')
    }
  } else {
    console.log('  already exists — signed in')
  }

  const userId = session.user.id
  await updateProfile(session.accessToken, userId, {
    name: seed.name,
    phone: seed.phone,
    email: seed.email,
    role: seed.role,
    identity_verification: seed.identity_verification,
  })
  console.log('  profile verified')

  if (seed.host) {
    await upsertHost(session.accessToken, userId, seed.host)
    console.log('  host listing synced')
  }
  if (seed.host_settings) {
    await upsertHostSettings(session.accessToken, userId, seed.host_settings)
    console.log('  host settings synced')
  }

  console.log(`  login: ${seed.email} / ${PASSWORD}`)
  if (seed.role === 'customer') {
    console.log(`         or phone 6001111 (+501)`)
  } else if (seed.role === 'host') {
    console.log(`         or phone 6001234 (+501)`)
  }
}

;(async () => {
  console.log(`Provisioning seed users on ${SUPABASE_URL}`)
  for (const seed of SEED_USERS) {
    await ensureUser(seed)
  }
  console.log('\nDone. You can log in from the app now.')
})().catch((err) => {
  console.error('\nFailed:', err.message)
  process.exit(1)
})
