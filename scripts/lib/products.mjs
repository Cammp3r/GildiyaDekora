import { readFile } from 'node:fs/promises'
import path from 'node:path'

const EUR_TO_UAH = 51.95

// Google product taxonomy IDs (https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt)
const GOOGLE_PRODUCT_CATEGORY_BY_BRAND = {
  OIKOS: '1361', // Hardware > Building Consumables > Painting Consumables > Paint
  'ORAC DECOR': '7112', // Hardware > Building Materials > Molding
}

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

export function stripHtml(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function absoluteUrl(url, siteUrl) {
  const value = String(url ?? '').trim()
  if (!value) return `${siteUrl}/logo-transparent.png`
  if (/^https?:\/\//i.test(value)) return value
  return `${siteUrl}/${value.replace(/^\/+/, '')}`
}

export function productUrl(id, siteUrl) {
  return `${siteUrl}/products/${encodeURIComponent(id)}`
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

function mapProduct(product, { brand, category, subcategory }, siteUrl) {
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
    link: productUrl(id, siteUrl),
    image: absoluteUrl(getPrimaryImage(product), siteUrl),
    brand,
    productType: [brand, category, subcategory].filter(Boolean).join(' > '),
    googleProductCategory: GOOGLE_PRODUCT_CATEGORY_BY_BRAND[brand] ?? '',
    price,
  }
}

function collectOikosProducts(dtb, siteUrl) {
  const products = []

  for (const section of toArray(dtb.sections)) {
    const category = section.title ?? section.id ?? ''

    for (const product of toArray(section.products)) {
      products.push(mapProduct(product, {
        brand: 'OIKOS',
        category,
        subcategory: product.subcategory ?? '',
      }, siteUrl))
    }

    for (const subcategory of toArray(section.subcategories)) {
      for (const product of toArray(subcategory.products)) {
        products.push(mapProduct(product, {
          brand: 'OIKOS',
          category,
          subcategory: subcategory.name ?? '',
        }, siteUrl))
      }
    }
  }

  return products
}

function collectOracProducts(oracDecor, siteUrl) {
  const products = []

  for (const section of toArray(oracDecor.sections)) {
    const category = section.title_uk ?? section.title ?? section.id ?? ''

    for (const product of toArray(section.products)) {
      products.push(mapProduct(product, {
        brand: 'ORAC DECOR',
        category,
        subcategory: product.subcategory ?? '',
      }, siteUrl))
    }
  }

  return products
}

export async function loadUniqueProducts(root, siteUrl) {
  const [dtb, oracDecor] = await Promise.all([
    readJson(root, 'dtb.json'),
    readJson(root, 'orac_decor.json'),
  ])

  const products = [...collectOikosProducts(dtb, siteUrl), ...collectOracProducts(oracDecor, siteUrl)]
    .filter((product) => {
      const price = Number(product.price)
      return product.id && product.title && Number.isFinite(price) && price > 0
    })

  return [...new Map(products.map((product) => [product.id, product])).values()]
}

async function readJson(root, fileName) {
  const content = await readFile(path.join(root, fileName), 'utf8')
  return JSON.parse(content)
}
