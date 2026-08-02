import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const assetsDir = path.join(__dirname, '..', 'assets')

const BRAND_ASSETS = [
  {
    file: path.join(assetsDir, 'logo-icon.png'),
    maxWidth: 1200,
    maxHeight: 1200,
  },
  {
    file: path.join(assetsDir, 'lb-mascot.png'),
    maxWidth: 512,
    maxHeight: 512,
  },
]

async function optimizeAsset({ file, maxWidth, maxHeight }) {
  const before = (await fs.stat(file)).size
  const meta = await sharp(file).metadata()
  const needsResize = (meta.width ?? 0) > maxWidth || (meta.height ?? 0) > maxHeight

  let pipeline = sharp(file)
  if (needsResize) {
    pipeline = pipeline.resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  const buffer = await pipeline.png({ compressionLevel: 9, palette: false }).toBuffer()
  await fs.writeFile(file, buffer)
  const after = buffer.length
  const name = path.basename(file)
  console.log(
    `${name}: ${Math.round(before / 1024)}KB → ${Math.round(after / 1024)}KB${needsResize ? ' (resized)' : ' (compressed)'}`,
  )
}

async function main() {
  for (const asset of BRAND_ASSETS) {
    await fs.access(asset.file)
    await optimizeAsset(asset)
  }
  console.log('Brand PNGs optimized for bundle size')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
