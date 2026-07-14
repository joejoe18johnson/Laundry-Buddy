import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const assetsDir = path.join(root, 'assets')

async function renderSvg(svgPath, size) {
  const svg = await fs.readFile(svgPath)
  return sharp(svg).resize(size, size)
}

async function splashImage(logoPath, width, height, background) {
  const logoSize = Math.round(Math.min(width, height) * 0.28)
  const logoBuffer = await (await renderSvg(logoPath, logoSize)).png().toBuffer()

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background,
    },
  })
    .composite([{ input: logoBuffer, gravity: 'center' }])
    .png()
}

async function adaptiveIcon(iconPath, size) {
  const iconBuffer = await (await renderSvg(iconPath, Math.round(size * 0.72))).png().toBuffer()

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 56, b: 92, alpha: 1 },
    },
  })
    .composite([{ input: iconBuffer, gravity: 'center' }])
    .png()
}

async function main() {
  await fs.mkdir(assetsDir, { recursive: true })

  const iconSvg = path.join(assetsDir, 'icon.svg')
  const logoSvg = path.join(assetsDir, 'logo-mark.svg')

  await (await renderSvg(iconSvg, 1024)).png().toFile(path.join(assetsDir, 'icon.png'))
  await (await renderSvg(logoSvg, 512)).png().toFile(path.join(assetsDir, 'splash-icon.png'))
  await (await adaptiveIcon(iconSvg, 1024)).toFile(path.join(assetsDir, 'adaptive-icon.png'))
  await (await renderSvg(logoSvg, 96)).png().toFile(path.join(assetsDir, 'favicon.png'))
  await (
    await splashImage(logoSvg, 1284, 2778, { r: 255, g: 255, b: 255, alpha: 1 })
  ).toFile(path.join(assetsDir, 'splash.png'))

  console.log('Generated assets/icon.png, splash-icon.png, adaptive-icon.png, favicon.png, splash.png')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
