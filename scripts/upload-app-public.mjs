/**
 * Upload hosted app pages to Supabase Storage (app-public bucket).
 *
 * Requires in .env:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (Settings → API → service_role — never ship in the app)
 *
 * Run:
 *   npm run upload:app-public
 *   node scripts/upload-app-public.mjs --file host-profile.html
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const ENV_PATH = path.join(ROOT, '.env')
const PUBLIC_DIR = path.join(ROOT, 'supabase', 'public')
const BUCKET = 'app-public'

const MIME_BY_EXT = {
  '.html': 'text/html; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
}

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return {}
  return Object.fromEntries(
    fs
      .readFileSync(ENV_PATH, 'utf8')
      .split('\n')
      .filter((line) => line.trim() && !line.trim().startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=')
        if (index < 0) return [line.trim(), '']
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
      }),
  )
}

function parseArgs(argv) {
  const fileIndex = argv.indexOf('--file')
  if (fileIndex >= 0) {
    const value = argv[fileIndex + 1]
    if (!value || value.startsWith('-')) {
      console.error('Missing value for --file (example: --file host-profile.html)')
      process.exit(1)
    }
    return { singleFile: value }
  }
  return { singleFile: null }
}

function listUploadFiles(singleFile) {
  if (!fs.existsSync(PUBLIC_DIR)) {
    throw new Error(`Missing folder: ${PUBLIC_DIR}`)
  }

  const entries = fs
    .readdirSync(PUBLIC_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith('.'))

  if (singleFile) {
    const normalized = path.basename(singleFile)
    if (!entries.includes(normalized)) {
      throw new Error(`File not found in supabase/public: ${normalized}`)
    }
    return [normalized]
  }

  if (entries.length === 0) {
    throw new Error(`No files found in ${PUBLIC_DIR}`)
  }

  return entries.sort()
}

function contentTypeFor(filename) {
  const ext = path.extname(filename).toLowerCase()
  return MIME_BY_EXT[ext] ?? 'application/octet-stream'
}

function publicObjectUrl(supabaseUrl, objectPath) {
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${objectPath}`
}

async function uploadObject({ supabaseUrl, serviceRoleKey, objectPath, filePath }) {
  const body = fs.readFileSync(filePath)
  const contentType = contentTypeFor(objectPath)

  const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
      'Cache-Control': 'public, max-age=300',
    },
    body,
  })

  const text = await res.text()
  let parsed
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = text
  }

  if (!res.ok) {
    const message =
      typeof parsed === 'object' && parsed !== null
        ? parsed.message ?? parsed.error ?? JSON.stringify(parsed)
        : String(parsed || res.statusText)
    throw new Error(`${objectPath}: ${message}`)
  }

  return publicObjectUrl(supabaseUrl, objectPath)
}

;(async () => {
  const { singleFile } = parseArgs(process.argv.slice(2))
  const env = loadEnv()
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!supabaseUrl) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL in .env')
    process.exit(1)
  }

  if (!serviceRoleKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env')
    console.error('Add it from Supabase → Settings → API → service_role (secret).')
    console.error('Never put this key in the mobile app — scripts and server only.')
    process.exit(1)
  }

  const files = listUploadFiles(singleFile)
  console.log(`Uploading ${files.length} file(s) to ${BUCKET} on ${supabaseUrl}\n`)

  const urls = []
  for (const filename of files) {
    const filePath = path.join(PUBLIC_DIR, filename)
    process.stdout.write(`→ ${filename} … `)
    const url = await uploadObject({
      supabaseUrl,
      serviceRoleKey,
      objectPath: filename,
      filePath,
    })
    urls.push({ filename, url })
    console.log('done')
  }

  console.log('\nPublic URLs:')
  for (const entry of urls) {
    console.log(`  ${entry.filename}`)
    console.log(`    ${entry.url}`)
  }

  const authCallback = urls.find((entry) => entry.filename === 'auth-callback.html')
  const hostProfile = urls.find((entry) => entry.filename === 'host-profile.html')

  console.log('\nSuggested .env entries:')
  if (authCallback) {
    console.log(`EXPO_PUBLIC_AUTH_REDIRECT_URL=${authCallback.url}`)
  }
  if (hostProfile) {
    console.log(`# Host profile links use the Edge Function (not storage HTML):`)
    console.log(`# ${supabaseUrl.replace(/\/$/, '')}/functions/v1/host-profile?host=HOST_ID&user=USER_ID`)
    console.log(`# Deploy once: npm run deploy:host-profile`)
  }

  console.log('\nDone.')
})().catch((err) => {
  console.error('\nUpload failed:', err.message)
  process.exit(1)
})
