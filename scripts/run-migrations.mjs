/**
 * Apply pending Supabase SQL migrations automatically.
 *
 * Uses the Supabase CLI (linked project). One-time setup:
 *   npx supabase login
 *
 * Run:
 *   npm run db:migrate
 */

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const ROOT = path.resolve(import.meta.dirname, '..')
const ENV_PATH = path.join(ROOT, '.env')
const MIGRATIONS_DIR = path.join(ROOT, 'supabase', 'migrations')

const BENIGN_ERROR =
  /already exists|duplicate key|duplicate_object|42710|42P07|42701|23505/i

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

function runSupabase(args, { allowFailure = false } = {}) {
  const result = spawnSync('npx', ['supabase', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: process.env,
  })

  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
  if (result.status !== 0 && !allowFailure) {
    const error = new Error(output || `supabase ${args.join(' ')} failed`)
    error.output = output
    error.status = result.status
    throw error
  }

  return { output, status: result.status ?? 1 }
}

function listLocalMigrations() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((filename) => {
      const match = filename.match(/^(\d+)_(.+)\.sql$/)
      return {
        version: match?.[1] ?? filename.replace('.sql', ''),
        filename,
        filepath: path.join(MIGRATIONS_DIR, filename),
      }
    })
}

function parseRemoteVersions(queryOutput) {
  const versions = new Set()
  const jsonMatch = queryOutput.match(/\{[\s\S]*"rows"[\s\S]*\}/)
  if (!jsonMatch) return versions

  try {
    const parsed = JSON.parse(jsonMatch[0])
    for (const row of parsed.rows ?? []) {
      const version = String(row.version ?? '')
      if (version) versions.add(version)
    }
  } catch {
    // ignore parse errors — treat as empty history
  }

  return versions
}

function ensureLinked(projectRef) {
  const linkedRefPath = path.join(ROOT, 'supabase', '.temp', 'project-ref')
  const linkedRef = fs.existsSync(linkedRefPath)
    ? fs.readFileSync(linkedRefPath, 'utf8').trim()
    : null

  if (linkedRef === projectRef) {
    console.log(`Linked to Supabase project ${projectRef}`)
    return
  }

  console.log(`Linking Supabase project ${projectRef}...`)
  runSupabase(['link', '--project-ref', projectRef, '--yes'])
}

function fetchRemoteVersions() {
  const { output } = runSupabase(
    [
      'db',
      'query',
      '--linked',
      '--yes',
      'select version from supabase_migrations.schema_migrations order by version;',
    ],
    { allowFailure: true },
  )
  return parseRemoteVersions(output)
}

function applyMigrationFile(filepath) {
  return runSupabase(['db', 'query', '--linked', '--yes', '-f', filepath], {
    allowFailure: true,
  })
}

function markApplied(version) {
  runSupabase(['migration', 'repair', '--linked', '--status', 'applied', '--yes', version])
}

function main() {
  const env = loadEnv()
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL?.trim()
  const projectRef = projectRefFromUrl(supabaseUrl)

  if (!projectRef) {
    console.error('Missing or invalid EXPO_PUBLIC_SUPABASE_URL in .env')
    process.exit(1)
  }

  ensureLinked(projectRef)

  const localMigrations = listLocalMigrations()
  const remoteVersions = fetchRemoteVersions()
  const pending = localMigrations.filter((entry) => !remoteVersions.has(entry.version))

  if (pending.length === 0) {
    console.log('All migrations are already applied on the remote database.')
    return
  }

  console.log(`Applying ${pending.length} pending migration(s)...`)

  for (const migration of pending) {
    process.stdout.write(`→ ${migration.filename} ... `)

    const { output, status } = applyMigrationFile(migration.filepath)
    const benign = status !== 0 && BENIGN_ERROR.test(output)

    if (status === 0 || benign) {
      markApplied(migration.version)
      console.log(benign ? 'skipped (already applied) ✓' : 'applied ✓')
      continue
    }

    console.log('failed ✗')
    console.error(output)
    process.exit(status || 1)
  }

  console.log('\nDone. Remote database is up to date.')
}

main()
