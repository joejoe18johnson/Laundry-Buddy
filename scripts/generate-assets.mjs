import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const assetsDir = path.join(root, 'assets')
const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res')
const iosDir = path.join(root, 'ios', 'LaundryBuddy', 'Images.xcassets')

const BRAND_WHITE = { r: 255, g: 255, b: 255, alpha: 1 }

const DENSITIES = [
  { folder: 'mdpi', scale: 1 },
  { folder: 'hdpi', scale: 1.5 },
  { folder: 'xhdpi', scale: 2 },
  { folder: 'xxhdpi', scale: 3 },
  { folder: 'xxxhdpi', scale: 4 },
]

async function renderIcon(sourcePath, size) {
  return sharp(sourcePath).resize(Math.round(size), Math.round(size), { fit: 'contain' })
}

async function writePng(pipeline, filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await pipeline.png().toFile(filePath)
}

async function writeWebp(pipeline, filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await pipeline.webp({ quality: 95 }).toFile(filePath)
}

async function splashScreen(sourcePath, width, height) {
  const logoSize = Math.round(Math.min(width, height) * 0.32)
  const logoBuffer = await (await renderIcon(sourcePath, logoSize)).png().toBuffer()
  return sharp({
    create: { width, height, channels: 4, background: BRAND_WHITE },
  }).composite([{ input: logoBuffer, gravity: 'center' }])
}

/** White silhouette for Android notification tray (non-black pixels → white). */
async function notificationIcon(sourcePath, size) {
  const { data, info } = await sharp(sourcePath)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const out = Buffer.alloc(data.length)
  for (let i = 0; i < info.width * info.height; i += 1) {
    const offset = i * 4
    const lum = (data[offset] + data[offset + 1] + data[offset + 2]) / 3
    if (lum > 40) {
      out[offset] = 255
      out[offset + 1] = 255
      out[offset + 2] = 255
      out[offset + 3] = Math.min(255, Math.round((lum / 255) * 255))
    }
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
}

async function main() {
  const iconSource = path.join(assetsDir, 'icon-source.png')

  await writePng(await renderIcon(iconSource, 1024), path.join(assetsDir, 'icon.png'))
  await writePng(await renderIcon(iconSource, 512), path.join(assetsDir, 'logo-mark.png'))
  await writePng(await renderIcon(iconSource, 512), path.join(assetsDir, 'splash-icon.png'))
  await writePng(await renderIcon(iconSource, 1024), path.join(assetsDir, 'adaptive-icon.png'))
  await writePng(await renderIcon(iconSource, 96), path.join(assetsDir, 'favicon.png'))
  await writePng(await notificationIcon(iconSource, 96), path.join(assetsDir, 'notification-icon.png'))
  await writePng(await splashScreen(iconSource, 1284, 2778), path.join(assetsDir, 'splash.png'))

  await writePng(await renderIcon(iconSource, 1024), path.join(iosDir, 'AppIcon.appiconset', 'App-Icon-1024x1024@1x.png'))
  await writePng(await renderIcon(iconSource, 200), path.join(iosDir, 'SplashScreenLogo.imageset', 'image.png'))
  await writePng(await renderIcon(iconSource, 400), path.join(iosDir, 'SplashScreenLogo.imageset', 'image@2x.png'))
  await writePng(await renderIcon(iconSource, 600), path.join(iosDir, 'SplashScreenLogo.imageset', 'image@3x.png'))

  for (const { folder, scale } of DENSITIES) {
    const launcherSize = Math.round(48 * scale)
    const foregroundSize = Math.round(108 * scale)
    const splashLogoSize = Math.round(200 * scale)
    const notificationSize = Math.round(24 * scale)

    const mipmapDir = path.join(androidRes, `mipmap-${folder}`)
    const drawableDir = path.join(androidRes, `drawable-${folder}`)

    await writeWebp(await renderIcon(iconSource, launcherSize), path.join(mipmapDir, 'ic_launcher.webp'))
    await writeWebp(await renderIcon(iconSource, launcherSize), path.join(mipmapDir, 'ic_launcher_round.webp'))
    await writeWebp(await renderIcon(iconSource, foregroundSize), path.join(mipmapDir, 'ic_launcher_foreground.webp'))
    await writePng(await renderIcon(iconSource, splashLogoSize), path.join(drawableDir, 'splashscreen_logo.png'))
    await writePng(await notificationIcon(iconSource, notificationSize), path.join(drawableDir, 'notification_icon.png'))
  }

  console.log('Generated app assets from assets/icon-source.png')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
