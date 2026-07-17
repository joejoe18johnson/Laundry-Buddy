import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const appIconsDir = path.join(root, 'assets', 'AppIcons')
const assetsDir = path.join(root, 'assets')
const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res')
const iosIconDir = path.join(root, 'ios', 'LaundryBuddy', 'Images.xcassets', 'AppIcon.appiconset')

const APP_ICON = path.join(appIconsDir, 'appstore.png')
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

async function notificationIconFromAppIcon(sourcePath, size) {
  const padded = await buildPaddedIcon(sourcePath, size, { scale: ICON_SCALE })
  const { data, info } = await padded.ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  const out = Buffer.alloc(info.width * info.height * 4)
  for (let i = 0; i < info.width * info.height; i += 1) {
    const src = i * info.channels
    const dst = i * 4
    const r = data[src]
    const g = data[src + 1]
    const b = data[src + 2]
    const lum = (r + g + b) / 3
    if (lum > 160) {
      out[dst] = 255
      out[dst + 1] = 255
      out[dst + 2] = 255
      out[dst + 3] = 255
    }
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
}

async function syncExpoAssets() {
  await writePng(APP_ICON, path.join(assetsDir, 'icon.png'), 1024, {})
  await writePng(APP_ICON, path.join(assetsDir, 'adaptive-icon.png'), 1024, { transparent: true })
  await writePng(APP_ICON, path.join(assetsDir, 'favicon.png'), 96, {})
  await (await notificationIconFromAppIcon(APP_ICON, 96))
    .png()
    .toFile(path.join(assetsDir, 'notification-icon.png'))
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

    const notificationSize = Math.round(24 * { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }[density])
    await (await notificationIconFromAppIcon(APP_ICON, notificationSize))
      .png()
      .toFile(path.join(androidRes, `drawable-${density}`, 'notification_icon.png'))
  }

  const colorsPath = path.join(androidRes, 'values', 'colors.xml')
  let colors = await fs.readFile(colorsPath, 'utf8')
  colors = colors.replace(
    /<color name="iconBackground">[^<]+<\/color>/,
    `<color name="iconBackground">${ICON_BACKGROUND}</color>`,
  )
  await fs.writeFile(colorsPath, colors)
}

async function syncSourceCatalog() {
  const catalogIcon = path.join(appIconsDir, 'Assets.xcassets', 'AppIcon.appiconset', '1024.png')
  await writePng(APP_ICON, catalogIcon, 1024, {})
  await writePng(APP_ICON, path.join(appIconsDir, 'playstore.png'), 512, {})

  for (const density of ANDROID_DENSITIES) {
    const size = ANDROID_LAUNCHER_SIZES[density]
    const mipmapDir = path.join(appIconsDir, 'android', `mipmap-${density}`)
    await writePng(APP_ICON, path.join(mipmapDir, 'ic_launcher.png'), size, {})
  }
}

async function main() {
  await fs.access(APP_ICON)
  await syncSourceCatalog()
  await syncExpoAssets()
  await syncIos()
  await syncAndroid()
  console.log(
    `Synced app icons at ${Math.round(ICON_SCALE * 100)}% scale (30% smaller) from assets/AppIcons/appstore.png`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
