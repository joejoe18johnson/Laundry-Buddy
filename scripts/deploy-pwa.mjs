/**
 * Build and upload the Laundry Buddy PWA to Supabase Storage (app-public/pwa/).
 *
 * Requires in .env:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run:
 *   npm run deploy:pwa
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = path.resolve(import.meta.dirname, '..')
const ENV_PATH = path.join(ROOT, '.env')
const DIST_DIR = path.join(ROOT, 'dist')
const BUCKET = 'app-public'
const PREFIX = 'pwa'

const MIME_BY_EXT = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'text/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
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

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath))
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }
  return files
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return MIME_BY_EXT[ext] ?? 'application/octet-stream'
}

/** Supabase hosts the app under /storage/.../pwa/ — use relative asset paths. */
function rewriteIndexForSubfolder(distDir) {
  const indexPath = path.join(distDir, 'index.html')
  if (!fs.existsSync(indexPath)) return

  let html = fs.readFileSync(indexPath, 'utf8')
  html = html
    .replace(/src="\/_expo\//g, 'src="./_expo/')
    .replace(/href="\/favicon/g, 'href="./favicon')
    .replace(/href="\/manifest\.json"/g, 'href="./manifest.json"')
    .replace(/href="\/apple-touch-icon\.png"/g, 'href="./apple-touch-icon.png"')
    .replace(/register\('\/sw\.js'/g, "register('./sw.js'")
    .replace(/register\("\/sw\.js"/g, 'register("./sw.js"')

  fs.writeFileSync(indexPath, html)
}

async function uploadObject({ supabaseUrl, serviceRoleKey, objectPath, filePath }) {
  const body = fs.readFileSync(filePath)
  const contentType = contentTypeFor(filePath)

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
  if (!res.ok) {
    throw new Error(`${objectPath}: ${text || res.statusText}`)
  }
}

;(async () => {
  const env = loadEnv()
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
    process.exit(1)
  }

  console.log('→ Building web export…')
  execSync('npx expo export --platform web --output-dir dist', {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, EXPO_PUBLIC_DISABLE_OTA_UPDATES: 'true' },
  })

  if (!fs.existsSync(DIST_DIR)) {
    console.error('dist/ not found after export')
    process.exit(1)
  }

  rewriteIndexForSubfolder(DIST_DIR)

  const files = walkFiles(DIST_DIR)
  console.log(`\n→ Uploading ${files.length} file(s) to ${BUCKET}/${PREFIX}/ …`)

  for (const filePath of files) {
    const relative = path.relative(DIST_DIR, filePath).split(path.sep).join('/')
    const objectPath = `${PREFIX}/${relative}`
    process.stdout.write(`  ${relative} … `)
    await uploadObject({ supabaseUrl, serviceRoleKey, objectPath, filePath })
    console.log('done')
  }

  const base = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${PREFIX}`
  console.log('\n✓ PWA deployed')
  console.log(`  Open: ${base}/index.html`)
  console.log(`\nIf icons or install prompt fail, open that exact index.html URL (not the folder).`)
  console.log('\nOn iPhone: Safari → Share → Add to Home Screen')
  console.log('On Android: Chrome menu → Install app / Add to Home screen')
})().catch((err) => {
  console.error('\nDeploy failed:', err.message)
  process.exit(1)
})
