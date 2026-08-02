import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const assetsDir = path.join(root, 'assets')
const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res')
const iosDir = path.join(root, 'ios', 'LaundryBuddy', 'Images.xcassets')

const LOGO_SOURCE = path.join(assetsDir, 'logo-icon.png')
const BRAND_WHITE = { r: 255, g: 255, b: 255, alpha: 1 }
/** Android 12+ masks splash icons to a 192dp circle on a 288dp canvas. */
const ANDROID_SPLASH_CANVAS_DP = 288
const ANDROID_SPLASH_IMAGE_WIDTH_DP = 168

const DENSITIES = [
  { folder: 'mdpi', scale: 1 },
  { folder: 'hdpi', scale: 1.5 },
  { folder: 'xhdpi', scale: 2 },
  { folder: 'xxhdpi', scale: 3 },
  { folder: 'xxxhdpi', scale: 4 },
]

async function writePng(pipeline, filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await pipeline.png().toFile(filePath)
}

async function renderLogo(sourcePath, size) {
  return sharp(sourcePath).resize(Math.round(size), Math.round(size), {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
}

/** Full wordmark centered on Android's 288dp splash canvas (fits inside the 192dp circle mask). */
async function androidSplashIcon(wordmarkPath, multiplier) {
  const canvasSize = Math.round(ANDROID_SPLASH_CANVAS_DP * multiplier)
  const imageSize = Math.round(ANDROID_SPLASH_IMAGE_WIDTH_DP * multiplier)
  const meta = await sharp(wordmarkPath).metadata()
  const aspect = (meta.width ?? 1) / (meta.height ?? 1)
  const logoWidth = aspect >= 1 ? imageSize : Math.round(imageSize * aspect)
  const logoHeight = aspect >= 1 ? Math.round(imageSize / aspect) : imageSize
  const logoBuffer = await sharp(wordmarkPath)
    .resize(logoWidth, logoHeight, { fit: 'contain', background: BRAND_WHITE })
    .png()
    .toBuffer()

  return sharp({
    create: { width: canvasSize, height: canvasSize, channels: 4, background: BRAND_WHITE },
  }).composite([{ input: logoBuffer, gravity: 'center' }])
}

async function main() {
  await fs.access(LOGO_SOURCE)

  await writePng(await renderLogo(LOGO_SOURCE, 200), path.join(iosDir, 'SplashScreenLogo.imageset', 'image.png'))
  await writePng(await renderLogo(LOGO_SOURCE, 400), path.join(iosDir, 'SplashScreenLogo.imageset', 'image@2x.png'))
  await writePng(await renderLogo(LOGO_SOURCE, 600), path.join(iosDir, 'SplashScreenLogo.imageset', 'image@3x.png'))

  for (const { folder, scale } of DENSITIES) {
    const drawableDir = path.join(androidRes, `drawable-${folder}`)
    await writePng(await androidSplashIcon(LOGO_SOURCE, scale), path.join(drawableDir, 'splashscreen_logo.png'))
  }

  console.log('Generated splash drawables from assets/logo-icon.png (launcher icons live in assets/AppIcons/)')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
