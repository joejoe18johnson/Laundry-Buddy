import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const assetsDir = path.join(root, 'assets')
const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res')
const iosDir = path.join(root, 'ios', 'LaundryBuddy', 'Images.xcassets')

const BRAND_BLACK = { r: 0, g: 0, b: 0, alpha: 1 }
const BRAND_WHITE = { r: 255, g: 255, b: 255, alpha: 1 }

const DENSITIES = [
  { folder: 'mdpi', scale: 1 },
  { folder: 'hdpi', scale: 1.5 },
  { folder: 'xhdpi', scale: 2 },
  { folder: 'xxhdpi', scale: 3 },
  { folder: 'xxxhdpi', scale: 4 },
]

async function renderSvg(svgPath, size) {
  const svg = await fs.readFile(svgPath)
  return sharp(svg).resize(Math.round(size), Math.round(size))
}

async function writePng(pipeline, filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await pipeline.png().toFile(filePath)
}

async function writeWebp(pipeline, filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await pipeline.webp({ quality: 95 }).toFile(filePath)
}

async function adaptiveForeground(logoPath, size) {
  const logoBuffer = await (await renderSvg(logoPath, Math.round(size * 0.62))).png().toBuffer()
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite([{ input: logoBuffer, gravity: 'center' }])
}

async function splashScreen(logoPath, width, height) {
  const logoSize = Math.round(Math.min(width, height) * 0.28)
  const logoBuffer = await (await renderSvg(logoPath, logoSize)).png().toBuffer()
  return sharp({
    create: { width, height, channels: 4, background: BRAND_WHITE },
  }).composite([{ input: logoBuffer, gravity: 'center' }])
}

async function main() {
  const iconSvg = path.join(assetsDir, 'icon.svg')
  const logoSvg = path.join(assetsDir, 'logo-mark.svg')
  const notificationSvg = path.join(assetsDir, 'notification-icon.svg')

  await writePng(await renderSvg(iconSvg, 1024), path.join(assetsDir, 'icon.png'))
  await writePng(await renderSvg(logoSvg, 512), path.join(assetsDir, 'splash-icon.png'))
  await writePng(await adaptiveForeground(logoSvg, 1024), path.join(assetsDir, 'adaptive-icon.png'))
  await writePng(await renderSvg(logoSvg, 96), path.join(assetsDir, 'favicon.png'))
  await writePng(await renderSvg(notificationSvg, 96), path.join(assetsDir, 'notification-icon.png'))
  await writePng(await splashScreen(logoSvg, 1284, 2778), path.join(assetsDir, 'splash.png'))

  await writePng(await renderSvg(iconSvg, 1024), path.join(iosDir, 'AppIcon.appiconset', 'App-Icon-1024x1024@1x.png'))
  await writePng(await renderSvg(logoSvg, 200), path.join(iosDir, 'SplashScreenLogo.imageset', 'image.png'))
  await writePng(await renderSvg(logoSvg, 400), path.join(iosDir, 'SplashScreenLogo.imageset', 'image@2x.png'))
  await writePng(await renderSvg(logoSvg, 600), path.join(iosDir, 'SplashScreenLogo.imageset', 'image@3x.png'))

  for (const { folder, scale } of DENSITIES) {
    const launcherSize = Math.round(48 * scale)
    const foregroundSize = Math.round(108 * scale)
    const splashLogoSize = Math.round(200 * scale)
    const notificationSize = Math.round(24 * scale)

    const mipmapDir = path.join(androidRes, `mipmap-${folder}`)
    const drawableDir = path.join(androidRes, `drawable-${folder}`)

    await writeWebp(await renderSvg(iconSvg, launcherSize), path.join(mipmapDir, 'ic_launcher.webp'))
    await writeWebp(await renderSvg(iconSvg, launcherSize), path.join(mipmapDir, 'ic_launcher_round.webp'))
    await writeWebp(await adaptiveForeground(logoSvg, foregroundSize), path.join(mipmapDir, 'ic_launcher_foreground.webp'))
    await writePng(await renderSvg(logoSvg, splashLogoSize), path.join(drawableDir, 'splashscreen_logo.png'))
    await writePng(await renderSvg(notificationSvg, notificationSize), path.join(drawableDir, 'notification_icon.png'))
  }

  console.log('Generated brand washer assets from assets/icon.svg + logo-mark.svg')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
