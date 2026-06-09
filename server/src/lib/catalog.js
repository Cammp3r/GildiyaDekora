import { readFile } from 'node:fs/promises'

const ROOT_URL = new URL('../../../', import.meta.url)
const EUR_TO_UAH = 51.95

let catalogPromise

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

function mapProduct(product, { brand }) {
  const priceCurrency = product.price_currency ?? ''
  const priceVariants = normalizePriceVariants(product.price_variants ?? product.priceVariants, priceCurrency)
  const convertedPrice = priceVariants.length
    ? Math.min(...priceVariants.map((variant) => Number(variant.price)))
    : toUah(product.price, priceCurrency)

  return {
    id: String(product.id ?? product.url ?? product.name),
    title: String(product.name_uk ?? product.name ?? product.title ?? ''),
    brand,
    price: convertedPrice,
    priceCurrency: 'UAH',
    priceVariants,
  }
}

async function readJson(relativePath) {
  const fileUrl = new URL(relativePath, ROOT_URL)
  const raw = await readFile(fileUrl, 'utf8')
  return JSON.parse(raw)
}

async function buildCatalog() {
  const [dtb, oracDecor] = await Promise.all([
    readJson('dtb.json'),
    readJson('orac_decor.json'),
  ])

  const products = []

  for (const section of toArray(dtb.sections)) {
    for (const product of toArray(section.products)) {
      products.push(mapProduct(product, { brand: 'oikos' }))
    }
  }

  for (const section of toArray(oracDecor.sections)) {
    for (const product of toArray(section.products)) {
      products.push(mapProduct(product, { brand: 'orac-decor' }))
    }
  }

  const byId = new Map()
  for (const product of products) {
    byId.set(product.id, product)
  }

  return { products, byId }
}

export async function getCatalog() {
  if (!catalogPromise) {
    catalogPromise = buildCatalog()
  }

  return catalogPromise
}

export async function resolveCartItem(item) {
  const catalog = await getCatalog()
  const productId = String(item?.productId ?? '').trim() || String(item?.id ?? '').split(':')[0]
  const variantId = String(item?.variantId ?? 'default').trim() || 'default'

  if (!productId) {
    throw new Error('Missing product id')
  }

  const product = catalog.byId.get(productId)
  if (!product) {
    throw new Error(`Unknown product: ${productId}`)
  }

  const quantity = Math.max(1, Math.floor(Number(item?.quantity) || 0))
  const productTitle = product.title || productId

  const baseItem = {
    productId,
    variantId,
    title: productTitle,
    quantity,
    unitPrice: product.price,
    priceCurrency: 'UAH',
    brand: product.brand,
  }

  if (!product.priceVariants.length) {
    if (!Number.isFinite(Number(product.price)) || Number(product.price) <= 0) {
      throw new Error(`Product has no payable price: ${productId}`)
    }

    return baseItem
  }

  const variant = product.priceVariants.find(
    (entry) => entry.id === variantId || entry.volume === variantId || entry.title === variantId
  )

  if (!variant) {
    throw new Error(`Unknown product variant: ${productId}:${variantId}`)
  }

  if (!Number.isFinite(Number(variant.price)) || Number(variant.price) <= 0) {
    throw new Error(`Product variant has no payable price: ${productId}:${variantId}`)
  }

  return {
    ...baseItem,
    title: productTitle,
    variantTitle: variant.title,
    volume: variant.volume,
    unitPrice: variant.price,
  }
}