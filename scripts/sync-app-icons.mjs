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

async function copyFile(src, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true })
  await fs.copyFile(src, dest)
}

async function writeWebpFromPng(src, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true })
  await sharp(src).webp({ quality: 95 }).toFile(dest)
}

async function notificationIconFromAppIcon(sourcePath, size) {
  const { data, info } = await sharp(sourcePath)
    .resize(Math.round(size), Math.round(size))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

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
  await copyFile(APP_ICON, path.join(assetsDir, 'icon.png'))
  await copyFile(APP_ICON, path.join(assetsDir, 'adaptive-icon.png'))
  await sharp(APP_ICON).resize(96, 96).png().toFile(path.join(assetsDir, 'favicon.png'))
  await (await notificationIconFromAppIcon(APP_ICON, 96))
    .png()
    .toFile(path.join(assetsDir, 'notification-icon.png'))
}

async function syncIos() {
  await copyFile(APP_ICON, path.join(iosIconDir, 'App-Icon-1024x1024@1x.png'))
}

async function syncAndroid() {
  for (const density of ANDROID_DENSITIES) {
    const src = path.join(appIconsDir, 'android', `mipmap-${density}`, 'ic_launcher.png')
    const mipmapDir = path.join(androidRes, `mipmap-${density}`)

    await writeWebpFromPng(src, path.join(mipmapDir, 'ic_launcher.webp'))
    await writeWebpFromPng(src, path.join(mipmapDir, 'ic_launcher_round.webp'))
    await writeWebpFromPng(src, path.join(mipmapDir, 'ic_launcher_foreground.webp'))

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

async function main() {
  await fs.access(APP_ICON)
  await syncExpoAssets()
  await syncIos()
  await syncAndroid()
  console.log('Synced app icons from assets/AppIcons (Expo assets, iOS, Android, notification icon)')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
