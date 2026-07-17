import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const DIST_DIR = path.join(ROOT, 'dist')
const FEED_PATH = path.join(DIST_DIR, 'google-shopping.xml')
const EUR_TO_UAH = 51.95
const SITE_URL = (
  process.env.SITE_URL ||
  process.env.VITE_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  'https://gihldihja-decora.ua'
).replace(/\/+$/, '')

function toArray(value) {
  return Array.isArray(value) ? value : []
}

function toNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : fallback
}

function toUah(price, currency) {
  const num = toNumber(price)
  if (num === null) return null
  return currency === 'EUR' ? Math.round(num * EUR_TO_UAH * 100) / 100 : num
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function stripHtml(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function absoluteUrl(url) {
  const value = String(url ?? '').trim()
  if (!value) return `${SITE_URL}/logo-transparent.png`
  if (/^https?:\/\//i.test(value)) return value
  return `${SITE_URL}/${value.replace(/^\/+/, '')}`
}

function productUrl(id) {
  return `${SITE_URL}/products/${encodeURIComponent(id)}`
}

function normalizeVolume(volume) {
  const value = String(volume ?? '').trim()
  if (!value) return ''

  const compact = value
    .replace(/\s+/g, ' ')
    .replace(/^([A-Za-z]+)\.\s*/i, '$1 ')
    .replace(/^([A-Za-z]+)(?=\d)/i, '$1 ')
    .trim()

  const match = compact.match(/^([A-Za-z]+)\s*([0-9]+(?:[,.][0-9]+)?)$/)
  if (!match) return value

  const unit = match[1].toUpperCase()
  const amount = match[2].replace('.', ',')
  const units = {
    KG: 'кг',
    GR: 'г',
    G: 'г',
    LT: 'л',
    L: 'л',
    ML: 'мл',
  }

  return units[unit] ? `${amount} ${units[unit]}` : value
}

function normalizeVariantTitle(title, rawVolume, volume) {
  const value = String(title ?? '').trim()
  if (!value) return volume
  const raw = String(rawVolume ?? '').trim()
  if (!raw || !volume) return value
  return value.replace(raw, volume).replace(/\s+/g, ' ').trim()
}

function normalizePriceVariants(variants, currency = '') {
  return toArray(variants)
    .filter(Boolean)
    .map((variant, index) => {
      const rawVolume = variant.volume ?? ''
      const volume = normalizeVolume(rawVolume)
      const price = toUah(variant.price, variant.price_currency ?? currency)

      return {
        id: `${index}-${variant.title ?? variant.name ?? rawVolume}`,
        title: normalizeVariantTitle(variant.title ?? variant.name ?? '', rawVolume, volume),
        volume,
        price,
      }
    })
    .filter((variant) => {
      const price = Number(variant.price)
      return variant.volume && Number.isFinite(price) && price > 0
    })
}

function getPrimaryImage(product) {
  const photos = toArray(product.photos).filter(Boolean)
  if (photos[0]) return photos[0]

  const colorImage = toArray(product.colors).find((color) => color?.img)?.img
  return colorImage || product.image || '/logo-transparent.png'
}

function mapProduct(product, { brand, category, subcategory }) {
  const id = String(product.id ?? product.url ?? product.name ?? '').trim()
  const title = String(
    brand === 'ORAC DECOR'
      ? (product.name_uk ?? product.name ?? '')
      : (product.name ?? product.title ?? '')
  ).trim()
  const description = stripHtml(
    brand === 'ORAC DECOR'
      ? (product.description_uk ?? product.description ?? product.desc ?? '')
      : (product.description ?? product.desc ?? '')
  )
  const priceCurrency = product.price_currency ?? ''
  const priceVariants = normalizePriceVariants(product.price_variants ?? product.priceVariants, priceCurrency)
  const rawPrice =
    product.price_m2 ??
    product.pricePerM2 ??
    product.price_per_m2 ??
    product.price ??
    null
  const price = priceVariants.length
    ? Math.min(...priceVariants.map((variant) => Number(variant.price)))
    : toUah(rawPrice, priceCurrency)

  return {
    id,
    title,
    description,
    link: productUrl(id),
    image: absoluteUrl(getPrimaryImage(product)),
    brand,
    productType: [brand, category, subcategory].filter(Boolean).join(' > '),
    price,
  }
}

function collectOikosProducts(dtb) {
  const products = []

  for (const section of toArray(dtb.sections)) {
    const category = section.title ?? section.id ?? ''

    for (const product of toArray(section.products)) {
      products.push(mapProduct(product, {
        brand: 'OIKOS',
        category,
        subcategory: product.subcategory ?? '',
      }))
    }

    for (const subcategory of toArray(section.subcategories)) {
      for (const product of toArray(subcategory.products)) {
        products.push(mapProduct(product, {
          brand: 'OIKOS',
          category,
          subcategory: subcategory.name ?? '',
        }))
      }
    }
  }

  return products
}

function collectOracProducts(oracDecor) {
  const products = []

  for (const section of toArray(oracDecor.sections)) {
    const category = section.title_uk ?? section.title ?? section.id ?? ''

    for (const product of toArray(section.products)) {
      products.push(mapProduct(product, {
        brand: 'ORAC DECOR',
        category,
        subcategory: product.subcategory ?? '',
      }))
    }
  }

  return products
}

function formatPrice(value) {
  return `${Math.round(Number(value))} UAH`
}

function feedItem(product) {
  const description = product.description || `${product.title}. Офіційний дилер ${product.brand} в Україні.`

  return [
    '    <item>',
    `      <g:id>${escapeXml(product.id)}</g:id>`,
    `      <title>${escapeXml(product.title)}</title>`,
    `      <description>${escapeXml(description)}</description>`,
    `      <link>${escapeXml(product.link)}</link>`,
    `      <g:image_link>${escapeXml(product.image)}</g:image_link>`,
    '      <g:condition>new</g:condition>',
    '      <g:availability>in_stock</g:availability>',
    `      <g:price>${escapeXml(formatPrice(product.price))}</g:price>`,
    `      <g:brand>${escapeXml(product.brand)}</g:brand>`,
    `      <g:product_type>${escapeXml(product.productType)}</g:product_type>`,
    '    </item>',
  ].join('\n')
}

async function readJson(fileName) {
  const content = await readFile(path.join(ROOT, fileName), 'utf8')
  return JSON.parse(content)
}

const [dtb, oracDecor] = await Promise.all([
  readJson('dtb.json'),
  readJson('orac_decor.json'),
])

const products = [...collectOikosProducts(dtb), ...collectOracProducts(oracDecor)]
  .filter((product) => {
    const price = Number(product.price)
    return product.id && product.title && Number.isFinite(price) && price > 0
  })

const uniqueProducts = [...new Map(products.map((product) => [product.id, product])).values()]

const feed = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
  '  <channel>',
  '    <title>Гільдія Декора</title>',
  `    <link>${escapeXml(SITE_URL)}</link>`,
  '    <description>Товари OIKOS та ORAC DECOR від Гільдії Декора</description>',
  ...uniqueProducts.map(feedItem),
  '  </channel>',
  '</rss>',
  '',
].join('\n')

await mkdir(DIST_DIR, { recursive: true })
await writeFile(FEED_PATH, feed, 'utf8')

console.log(`Generated google-shopping.xml with ${uniqueProducts.length} products for ${SITE_URL}`)
