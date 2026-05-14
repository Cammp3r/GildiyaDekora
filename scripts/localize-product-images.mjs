import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = process.cwd()
const PUBLIC_DIR = path.join(ROOT, 'public')
const IMAGE_URL_PATTERN = /^https?:\/\/.+\.(?:jpe?g|png|webp)(?:\?.*)?$/i
const CONCURRENCY = 8
const MAX_WIDTH = 1600
const WEBP_QUALITY = 84

const SOURCES = [
  {
    brand: 'orac-decor',
    file: path.join(ROOT, 'orac_decor.json'),
    publicPrefix: '/products/orac-decor',
    outputDir: path.join(PUBLIC_DIR, 'products', 'orac-decor'),
  },
  {
    brand: 'oikos',
    file: path.join(ROOT, 'dtb.json'),
    publicPrefix: '/products/oikos',
    outputDir: path.join(PUBLIC_DIR, 'products', 'oikos'),
  },
]

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function hashUrl(url) {
  return crypto.createHash('sha1').update(url).digest('hex').slice(0, 10)
}

function filenameForUrl(url) {
  const parsed = new URL(url)
  const sourceName = path.basename(parsed.pathname).replace(/\.[^.]+$/, '')
  const cleanName = slugify(sourceName) || 'image'
  return `${cleanName}-${hashUrl(url)}.webp`
}

function collectImageUrls(value, urls = new Set()) {
  if (typeof value === 'string') {
    if (IMAGE_URL_PATTERN.test(value)) urls.add(value)
    return urls
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectImageUrls(item, urls))
    return urls
  }

  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectImageUrls(item, urls))
  }

  return urls
}

function replaceImageUrls(value, mapping) {
  if (typeof value === 'string') {
    return mapping.get(value) ?? value
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceImageUrls(item, mapping))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, replaceImageUrls(item, mapping)])
    )
  }

  return value
}

async function fetchImage(url, retries = 2) {
  let lastError

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 GildiyaDekoraImageLocalizer/1.0',
        },
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return Buffer.from(await response.arrayBuffer())
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)))
    }
  }

  throw lastError
}

async function saveOptimizedImage(url, outputFile) {
  try {
    await fs.access(outputFile)
    return 'cached'
  } catch {
    // Continue and create the file.
  }

  const input = await fetchImage(url)
  await sharp(input, { failOn: 'none' })
    .rotate()
    .resize({
      width: MAX_WIDTH,
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ quality: WEBP_QUALITY })
    .toFile(outputFile)

  return 'downloaded'
}

async function runPool(items, worker) {
  let cursor = 0
  const runners = Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      await worker(items[index], index)
    }
  })

  await Promise.all(runners)
}

for (const source of SOURCES) {
  const data = JSON.parse(await fs.readFile(source.file, 'utf8'))
  const urls = [...collectImageUrls(data)]
  const mapping = new Map()
  let downloaded = 0
  let cached = 0
  let failed = 0

  await fs.mkdir(source.outputDir, { recursive: true })

  console.log(`\n${source.brand}: ${urls.length} unique images`)

  await runPool(urls, async (url, index) => {
    const filename = filenameForUrl(url)
    const outputFile = path.join(source.outputDir, filename)
    const publicPath = `${source.publicPrefix}/${filename}`
    mapping.set(url, publicPath)

    try {
      const result = await saveOptimizedImage(url, outputFile)
      if (result === 'cached') cached += 1
      else downloaded += 1
    } catch (error) {
      failed += 1
      mapping.delete(url)
      console.warn(`[${index + 1}/${urls.length}] ${url}: ${error.message}`)
    }
  })

  const updatedData = replaceImageUrls(data, mapping)
  await fs.writeFile(source.file, `${JSON.stringify(updatedData, null, 2)}\n`, 'utf8')

  console.log(`Downloaded: ${downloaded}`)
  console.log(`Cached: ${cached}`)
  console.log(`Failed: ${failed}`)
  console.log(`Replaced URLs: ${mapping.size}`)
}
