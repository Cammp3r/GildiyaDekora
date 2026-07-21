/**
 * Generates small "-thumb" WebP variants of every product image.
 *
 * Product photos are shot/exported at ~1920px, but most of them are only
 * ever displayed as small swatches (texture/color pickers, catalog grid
 * cards, extra-photo strips) — 100-300px on screen. Serving the full-size
 * original there is the single biggest contributor to the site's poor
 * mobile PageSpeed score (hundreds of KB of oversized images per page).
 *
 * Runs after `vite build` (which already copied public/products/** into
 * dist/products/**), so it resizes the copies in dist/ only — the
 * originals in public/ (and git) stay untouched.
 */

import sharp from 'sharp'
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const TARGET_DIR = path.join(ROOT, 'dist', 'products')
const CONCURRENCY = 8

// Two variants per source image:
//  -thumb  480px  — texture/color swatches, catalog grid cards, extra-photo strip
//  -lg    1600px  — the main product photo (loading="eager", the LCP candidate);
//                   guards against the handful of ~1920px originals exported at 300-650KB
const VARIANTS = [
  { suffix: '-thumb.webp', width: 480, quality: 72 },
  { suffix: '-lg.webp', width: 1600, quality: 80 },
]

async function collectImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectImages(fullPath)))
    } else if (/\.(webp|jpe?g|png)$/i.test(entry.name) && !/-(thumb|lg)\.\w+$/i.test(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}

async function makeThumb(filePath) {
  const ext = path.extname(filePath)
  const base = filePath.slice(0, -ext.length)

  let anyCreated = false
  for (const variant of VARIANTS) {
    const outPath = base + variant.suffix
    try {
      await stat(outPath)
      continue // already generated
    } catch {
      // doesn't exist yet — generate it
    }

    await sharp(filePath)
      .resize({ width: variant.width, withoutEnlargement: true })
      .webp({ quality: variant.quality })
      .toFile(outPath)
    anyCreated = true
  }

  return anyCreated ? 'created' : 'skipped'
}

async function runPool(items, worker, concurrency) {
  let cursor = 0
  let created = 0
  let failed = 0

  async function next() {
    while (cursor < items.length) {
      const item = items[cursor++]
      try {
        const result = await worker(item)
        if (result === 'created') created++
      } catch (err) {
        failed++
        console.warn(`  ✗ ${path.relative(ROOT, item)}: ${err.message}`)
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, next))
  return { created, failed }
}

async function main() {
  let images
  try {
    images = await collectImages(TARGET_DIR)
  } catch (err) {
    console.warn(`Thumbnail generation skipped — ${TARGET_DIR} not found: ${err.message}`)
    return
  }

  console.log(`Generating thumbnails for ${images.length} product images…`)
  const { created, failed } = await runPool(images, makeThumb, CONCURRENCY)
  console.log(
    `Thumbnails: ${created} created, ${images.length - created - failed} already existed${failed ? `, ${failed} failed` : ''}.`
  )

  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('Thumbnail generation failed:', err)
  process.exit(1)
})
