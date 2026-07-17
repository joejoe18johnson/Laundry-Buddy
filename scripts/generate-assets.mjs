import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const assetsDir = path.join(root, 'assets')
const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res')
const iosDir = path.join(root, 'ios', 'LaundryBuddy', 'Images.xcassets')

const BG_MAX_CHANNEL = 12
const BRAND_WHITE = { r: 255, g: 255, b: 255, alpha: 1 }
const BRAND_BLACK = { r: 0, g: 0, b: 0, alpha: 1 }

const DENSITIES = [
  { folder: 'mdpi', scale: 1 },
  { folder: 'hdpi', scale: 1.5 },
  { folder: 'xhdpi', scale: 2 },
  { folder: 'xxhdpi', scale: 3 },
  { folder: 'xxxhdpi', scale: 4 },
]

/** Strip pure-black background while keeping dark line art and green accents. */
async function buildTransparentLogo(sourcePath) {
  const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const out = Buffer.alloc(data.length)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const isGreen = g > r + 18 && g > b + 18 && g > 45
    const isBackground = !isGreen && r <= BG_MAX_CHANNEL && g <= BG_MAX_CHANNEL && b <= BG_MAX_CHANNEL

    if (isBackground) {
      out[i] = 0
      out[i + 1] = 0
      out[i + 2] = 0
      out[i + 3] = 0
    } else {
      out[i] = r
      out[i + 1] = g
      out[i + 2] = b
      out[i + 3] = 255
    }
  }

  const trimmed = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim()
    .png()
    .toBuffer()

  return sharp(trimmed)
}

async function renderLogo(logoPipeline, size) {
  return logoPipeline
    .clone()
    .resize(Math.round(size), Math.round(size), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
}

async function writePng(pipeline, filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await pipeline.png().toFile(filePath)
}

async function writeWebp(pipeline, filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await pipeline.webp({ quality: 95 }).toFile(filePath)
}

/** Store / launcher icon: transparent mark on black square (matches original artwork). */
async function launcherIcon(logoPipeline, size) {
  const logoBuffer = await (await renderLogo(logoPipeline, Math.round(size * 0.92))).png().toBuffer()
  return sharp({
    create: { width: size, height: size, channels: 4, background: BRAND_BLACK },
  }).composite([{ input: logoBuffer, gravity: 'center' }])
}

async function adaptiveForeground(logoPipeline, size) {
  const logoBuffer = await (await renderLogo(logoPipeline, Math.round(size * 0.72))).png().toBuffer()
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite([{ input: logoBuffer, gravity: 'center' }])
}

async function splashScreen(logoPipeline, width, height) {
  const logoSize = Math.round(Math.min(width, height) * 0.32)
  const logoBuffer = await (await renderLogo(logoPipeline, logoSize)).png().toBuffer()
  return sharp({
    create: { width, height, channels: 4, background: BRAND_WHITE },
  }).composite([{ input: logoBuffer, gravity: 'center' }])
}

async function notificationIcon(logoPipeline, size) {
  const { data, info } = await logoPipeline
    .clone()
    .resize(Math.round(size), Math.round(size), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const out = Buffer.alloc(info.width * info.height * 4)
  for (let i = 0; i < info.width * info.height; i += 1) {
    const src = i * info.channels
    const dst = i * 4
    const alpha = info.channels === 4 ? data[src + 3] : 255
    if (alpha > 24) {
      out[dst] = 255
      out[dst + 1] = 255
      out[dst + 2] = 255
      out[dst + 3] = 255
    }
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
}

/** Extract the basket icon mark from the horizontal wordmark (no text). */
async function buildIconMarkFromWordmark(wordmarkPath) {
  const { width, height } = await sharp(wordmarkPath).metadata()
  if (!width || !height) {
    throw new Error(`Could not read dimensions for ${wordmarkPath}`)
  }

  const { data, info } = await sharp(wordmarkPath)
    .rotate()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const columnDensity = new Array(info.width).fill(0)
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * 4
      if (data[i + 3] > 10) columnDensity[x] += 1
    }
  }

  let iconEnd = 0
  let inCluster = false
  for (let x = 0; x < info.width; x += 1) {
    if (columnDensity[x] > 20) {
      inCluster = true
      iconEnd = x
    } else if (inCluster && columnDensity[x] === 0) {
      break
    }
  }

  const cropWidth = Math.min(Math.max(iconEnd + 48, 400), width)
  const cropped = await sharp(wordmarkPath)
    .rotate()
    .extract({ left: 0, top: 0, width: cropWidth, height })
    .toBuffer()

  const trimmed = await sharp(cropped).trim().toBuffer()

  return sharp(trimmed)
}

async function buildLogoPipeline(sourcePath) {
  const base = path.basename(sourcePath)
  if (base === 'lb-logo.png') {
    return buildIconMarkFromWordmark(sourcePath)
  }
  return buildTransparentLogo(sourcePath)
}

async function main() {
  const lbLogo = path.join(assetsDir, 'lb-logo.png')
  const iconSource = path.join(assetsDir, 'icon-source.png')
  let sourcePath = lbLogo
  try {
    await fs.access(lbLogo)
  } catch {
    sourcePath = iconSource
  }

  const logoPipeline = await buildLogoPipeline(sourcePath)

  await writePng(logoPipeline.clone(), path.join(assetsDir, 'logo-mark.png'))

  await writePng(await launcherIcon(logoPipeline, 1024), path.join(assetsDir, 'icon.png'))
  await writePng(await renderLogo(logoPipeline, 512), path.join(assetsDir, 'splash-icon.png'))
  await writePng(await adaptiveForeground(logoPipeline, 1024), path.join(assetsDir, 'adaptive-icon.png'))
  await writePng(await renderLogo(logoPipeline, 96), path.join(assetsDir, 'favicon.png'))
  await writePng(await notificationIcon(logoPipeline, 96), path.join(assetsDir, 'notification-icon.png'))
  await writePng(await splashScreen(logoPipeline, 1284, 2778), path.join(assetsDir, 'splash.png'))

  await writePng(await launcherIcon(logoPipeline, 1024), path.join(iosDir, 'AppIcon.appiconset', 'App-Icon-1024x1024@1x.png'))
  await writePng(await renderLogo(logoPipeline, 200), path.join(iosDir, 'SplashScreenLogo.imageset', 'image.png'))
  await writePng(await renderLogo(logoPipeline, 400), path.join(iosDir, 'SplashScreenLogo.imageset', 'image@2x.png'))
  await writePng(await renderLogo(logoPipeline, 600), path.join(iosDir, 'SplashScreenLogo.imageset', 'image@3x.png'))

  for (const { folder, scale } of DENSITIES) {
    const launcherSize = Math.round(48 * scale)
    const foregroundSize = Math.round(108 * scale)
    const splashLogoSize = Math.round(200 * scale)
    const notificationSize = Math.round(24 * scale)

    const mipmapDir = path.join(androidRes, `mipmap-${folder}`)
    const drawableDir = path.join(androidRes, `drawable-${folder}`)

    await writeWebp(await launcherIcon(logoPipeline, launcherSize), path.join(mipmapDir, 'ic_launcher.webp'))
    await writeWebp(await launcherIcon(logoPipeline, launcherSize), path.join(mipmapDir, 'ic_launcher_round.webp'))
    await writeWebp(await adaptiveForeground(logoPipeline, foregroundSize), path.join(mipmapDir, 'ic_launcher_foreground.webp'))
    await writePng(await renderLogo(logoPipeline, splashLogoSize), path.join(drawableDir, 'splashscreen_logo.png'))
    await writePng(await notificationIcon(logoPipeline, notificationSize), path.join(drawableDir, 'notification_icon.png'))
  }

  console.log(`Generated assets from assets/${path.basename(sourcePath)} (notification-icon.png + Android drawables)`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
