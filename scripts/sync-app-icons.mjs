import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const appIconsDir = path.join(root, 'assets', 'AppIcons')
const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res')
const iosIconDir = path.join(root, 'ios', 'LaundryBuddy', 'Images.xcassets', 'AppIcon.appiconset')

/** Master 1024×1024 launcher icon — edit this, then run npm run sync-app-icons */
const APP_ICON = path.join(appIconsDir, 'appstore.png')
/** Notification / status-bar icon — edit this directly; used by Expo + Android native */
const STATUS_ICON = path.join(appIconsDir, 'status-icon.png')
const ANDROID_DENSITIES = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']
const ICON_BACKGROUND = '#0f1118'
/** Scale factor for the logo inside the icon canvas (0.7 = 30% smaller). */
const ICON_SCALE = 0.7

const ANDROID_LAUNCHER_SIZES = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
}

const ANDROID_NOTIFICATION_SIZES = {
  mdpi: 24,
  hdpi: 36,
  xhdpi: 48,
  xxhdpi: 72,
  xxxhdpi: 96,
}

function parseHexColor(hex) {
  const value = hex.replace('#', '')
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
    alpha: 1,
  }
}

async function buildPaddedIcon(
  sourcePath,
  size,
  { scale = ICON_SCALE, background = ICON_BACKGROUND, transparent = false } = {},
) {
  const iconSize = Math.round(size * scale)
  const offset = Math.round((size - iconSize) / 2)

  const resized = await sharp(sourcePath).resize(iconSize, iconSize, { fit: 'contain' }).toBuffer()

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: transparent ? { r: 0, g: 0, b: 0, alpha: 0 } : parseHexColor(background),
    },
  }).composite([{ input: resized, left: offset, top: offset }])
}

async function writePng(sourcePath, dest, size, options) {
  await fs.mkdir(path.dirname(dest), { recursive: true })
  await (await buildPaddedIcon(sourcePath, size, options)).png().toFile(dest)
}

async function writeWebpFromPaddedIcon(sourcePath, dest, size, options) {
  await fs.mkdir(path.dirname(dest), { recursive: true })
  await (await buildPaddedIcon(sourcePath, size, options)).webp({ quality: 95 }).toFile(dest)
}

async function writeNotificationDrawable(sourcePath, dest, size) {
  await fs.mkdir(path.dirname(dest), { recursive: true })
  await sharp(sourcePath)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(dest)
}

async function syncAppIconsCatalog() {
  const catalogIcon = path.join(appIconsDir, 'Assets.xcassets', 'AppIcon.appiconset', '1024.png')
  await writePng(APP_ICON, catalogIcon, 1024, {})
  await writePng(APP_ICON, path.join(appIconsDir, 'playstore.png'), 512, {})
  await writePng(APP_ICON, path.join(appIconsDir, 'android', 'adaptive-foreground.png'), 1024, {
    transparent: true,
  })

  for (const density of ANDROID_DENSITIES) {
    const size = ANDROID_LAUNCHER_SIZES[density]
    const mipmapDir = path.join(appIconsDir, 'android', `mipmap-${density}`)
    await writePng(APP_ICON, path.join(mipmapDir, 'ic_launcher.png'), size, {})
  }
}

async function syncIos() {
  await writePng(APP_ICON, path.join(iosIconDir, 'App-Icon-1024x1024@1x.png'), 1024, {})
}

async function syncAndroid() {
  for (const density of ANDROID_DENSITIES) {
    const size = ANDROID_LAUNCHER_SIZES[density]
    const mipmapDir = path.join(androidRes, `mipmap-${density}`)

    await writeWebpFromPaddedIcon(APP_ICON, path.join(mipmapDir, 'ic_launcher.webp'), size, {})
    await writeWebpFromPaddedIcon(APP_ICON, path.join(mipmapDir, 'ic_launcher_round.webp'), size, {})
    await writeWebpFromPaddedIcon(
      APP_ICON,
      path.join(mipmapDir, 'ic_launcher_foreground.webp'),
      size,
      { transparent: true },
    )

    const notificationSize = ANDROID_NOTIFICATION_SIZES[density]
    await writeNotificationDrawable(
      STATUS_ICON,
      path.join(androidRes, `drawable-${density}`, 'notification_icon.png'),
      notificationSize,
    )
  }

  const colorsPath = path.join(androidRes, 'values', 'colors.xml')
  let colors = await fs.readFile(colorsPath, 'utf8')
  colors = colors.replace(
    /<color name="iconBackground">[^<]+<\/color>/,
    `<color name="iconBackground">${ICON_BACKGROUND}</color>`,
  )
  await fs.writeFile(colorsPath, colors)
}

async function main() {
  await fs.access(APP_ICON)
  await fs.access(STATUS_ICON)
  await syncAppIconsCatalog()
  await syncIos()
  await syncAndroid()
  console.log(
    'Synced launcher icons from appstore.png and notification icons from status-icon.png into native projects',
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
