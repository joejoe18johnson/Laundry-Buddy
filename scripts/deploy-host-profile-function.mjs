/**
 * Deploy the host-profile Edge Function (serves HTML with correct Content-Type).
 *
 * Requires Supabase CLI logged in: npx supabase login
 * Uses project ref from EXPO_PUBLIC_SUPABASE_URL in .env
 *
 * Run: npm run deploy:host-profile
 */

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

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
        if (index < 0) return [line.trim(), '']
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
      }),
  )
}

function projectRefFromUrl(url) {
  try {
    return new URL(url).hostname.split('.')[0]
  } catch {
    return null
  }
}

const env = loadEnv()
const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL?.trim()
const projectRef = projectRefFromUrl(supabaseUrl)
const accessToken = env.SUPABASE_ACCESS_TOKEN?.trim() || process.env.SUPABASE_ACCESS_TOKEN?.trim()

if (!projectRef) {
  console.error('Could not parse project ref from EXPO_PUBLIC_SUPABASE_URL in .env')
  process.exit(1)
}

console.log(`Deploying host-profile to project ${projectRef}...`)

const deployEnv = { ...process.env }
if (accessToken) {
  deployEnv.SUPABASE_ACCESS_TOKEN = accessToken
}

const result = spawnSync(
  'npx',
  ['supabase', 'functions', 'deploy', 'host-profile', '--project-ref', projectRef],
  { cwd: ROOT, stdio: 'inherit', env: deployEnv },
)

if (result.status !== 0) {
  console.error('\nDeploy failed.')
  console.error('1. Run: npx supabase login')
  console.error('   OR add SUPABASE_ACCESS_TOKEN to .env (Supabase dashboard → Account → Access Tokens)')
  process.exit(result.status ?? 1)
}

const publicUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/host-profile?host=HOST_ID&user=USER_ID`
console.log('\nHost profile links will use:')
console.log(`  ${publicUrl}`)
console.log('\nDone.')
