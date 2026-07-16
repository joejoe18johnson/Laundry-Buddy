import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const assetsDir = path.join(root, 'assets')
const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res')
const iosDir = path.join(root, 'ios', 'LaundryBuddy', 'Images.xcassets')

const LOGO_SOURCE = path.join(assetsDir, 'logo-source.png')

const BRAND_BLACK = { r: 0, g: 0, b: 0, alpha: 1 }
const BRAND_WHITE = { r: 255, g: 255, b: 255, alpha: 1 }

const DENSITIES = [
  { folder: 'mdpi', scale: 1 },
  { folder: 'hdpi', scale: 1.5 },
  { folder: 'xhdpi', scale: 2 },
  { folder: 'xxhdpi', scale: 3 },
  { folder: 'xxxhdpi', scale: 4 },
]

function logoSquare(size, background = BRAND_BLACK) {
  return sharp(LOGO_SOURCE).resize(size, size, {
    fit: 'contain',
    background,
  })
}

function logoMark(size) {
  return sharp(LOGO_SOURCE).resize(size, Math.round(size * (1024 / 791)), {
    fit: 'inside',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
}

async function writePng(pipeline, filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await pipeline.png().toFile(filePath)
}

async function writeWebp(pipeline, filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await pipeline.webp({ quality: 95 }).toFile(filePath)
}

/** White silhouette on transparent — for Android notification tray. */
async function notificationIcon(size) {
  const { data, info } = await sharp(LOGO_SOURCE)
    .resize(size, size, { fit: 'contain', background: BRAND_BLACK })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const pixels = Buffer.from(data)
  for (let i = 0; i < pixels.length; i += info.channels) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    const isLine = lum > 24
    pixels[i] = 255
    pixels[i + 1] = 255
    pixels[i + 2] = 255
    pixels[i + 3] = isLine ? 255 : 0
  }

  return sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
}

async function splashScreen(width, height) {
  const logoSize = Math.round(Math.min(width, height) * 0.32)
  const logoBuffer = await logoSquare(logoSize, BRAND_BLACK).png().toBuffer()

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BRAND_WHITE,
    },
  }).composite([{ input: logoBuffer, gravity: 'center' }])
}

async function main() {
  await fs.access(LOGO_SOURCE)

  // Expo / web source assets
  await writePng(logoSquare(1024), path.join(assetsDir, 'icon.png'))
  await writePng(logoSquare(512), path.join(assetsDir, 'splash-icon.png'))
  await writePng(logoSquare(1024), path.join(assetsDir, 'adaptive-icon.png'))
  await writePng(logoSquare(96), path.join(assetsDir, 'favicon.png'))
  await writePng(await notificationIcon(96), path.join(assetsDir, 'notification-icon.png'))
  await writePng(await splashScreen(1284, 2778), path.join(assetsDir, 'splash.png'))

  // iOS native assets
  await writePng(logoSquare(1024), path.join(iosDir, 'AppIcon.appiconset', 'App-Icon-1024x1024@1x.png'))
  await writePng(logoSquare(200), path.join(iosDir, 'SplashScreenLogo.imageset', 'image.png'))
  await writePng(logoSquare(400), path.join(iosDir, 'SplashScreenLogo.imageset', 'image@2x.png'))
  await writePng(logoSquare(600), path.join(iosDir, 'SplashScreenLogo.imageset', 'image@3x.png'))

  // Android native assets
  for (const { folder, scale } of DENSITIES) {
    const launcherSize = Math.round(48 * scale)
    const foregroundSize = Math.round(108 * scale)
    const splashLogoSize = Math.round(200 * scale)
    const notificationSize = Math.round(24 * scale)

    const mipmapDir = path.join(androidRes, `mipmap-${folder}`)
    const drawableDir = path.join(androidRes, `drawable-${folder}`)

    await writeWebp(logoSquare(launcherSize), path.join(mipmapDir, 'ic_launcher.webp'))
    await writeWebp(logoSquare(launcherSize), path.join(mipmapDir, 'ic_launcher_round.webp'))
    await writeWebp(logoSquare(foregroundSize), path.join(mipmapDir, 'ic_launcher_foreground.webp'))

    await writePng(logoSquare(splashLogoSize), path.join(drawableDir, 'splashscreen_logo.png'))
    await writePng(await notificationIcon(notificationSize), path.join(drawableDir, 'notification_icon.png'))
  }

  console.log('Generated assets from assets/logo-source.png')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
