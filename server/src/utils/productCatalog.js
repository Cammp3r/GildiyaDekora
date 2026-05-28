/* global process */
import { readFileSync } from 'node:fs'

const EUR_TO_UAH = 51.95

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
  return currency === 'EUR' ? Math.round(num * EUR_TO_UAH) : num
}

function normalizeVolume(volume) {
  const value = String(volume ?? '').trim()
  if (!value) return ''

  const compact = value
    .replace(/\s+/g, ' ')
    .replace(/^([A-Za-z]+)\.?\s*/i, '$1 ')
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

function buildCatalog() {
  const dtbPath = new URL('../../../dtb.json', import.meta.url)
  const oracPath = new URL('../../../orac_decor.json', import.meta.url)
  const dtb = JSON.parse(readFileSync(dtbPath, 'utf8'))
  const oracDecor = JSON.parse(readFileSync(oracPath, 'utf8'))

  const catalog = new Map()

  toArray(dtb.sections).forEach((section) => {
    const products = Array.isArray(section.products)
      ? section.products
      : toArray(section.subcategories).flatMap((subCategory) => toArray(subCategory.products))

    products.forEach((product) => {
      const productId = String(product.id ?? '')
      if (!productId) return

      catalog.set(productId, {
        id: productId,
        brand: 'oikos',
        price: toUah(product.price ?? product.price_m2 ?? product.pricePerM2 ?? product.price_per_m2, product.price_currency),
        currency: 'UAH',
        priceVariants: normalizePriceVariants(product.price_variants ?? product.priceVariants, product.price_currency),
      })
    })
  })

  toArray(oracDecor.sections).forEach((section) => {
    toArray(section.products).forEach((product) => {
      const productId = String(product.id ?? '')
      if (!productId) return

      const price = toNumber(product.price)
      catalog.set(productId, {
        id: productId,
        brand: 'orac-decor',
        price: Number.isFinite(price) && price > 0 ? price : null,
        currency: product.price_currency ?? 'UAH',
        priceVariants: [],
      })
    })
  })

  return catalog
}

const productCatalog = buildCatalog()

export function resolveCatalogItem(productId) {
  return productCatalog.get(String(productId)) ?? null
}

export function resolveLineItemPrice(item) {
  const productId = String(item?.id ?? '').trim()
  if (!productId) {
    return { ok: false, error: 'Product ID is required' }
  }

  const quantity = Number(item?.quantity)
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { ok: false, error: 'Quantity must be a positive integer' }
  }

  const product = resolveCatalogItem(productId)
  if (!product) {
    return { ok: false, error: `Unknown product: ${productId}` }
  }

  const variantId = String(item?.variantId ?? '').trim()
  let unitPrice = product.price

  if (product.priceVariants.length > 0) {
    const selectedVariant = variantId
      ? product.priceVariants.find((variant) => variant.id === variantId)
      : null

    if (variantId && !selectedVariant) {
      return { ok: false, error: `Unknown variant for product: ${productId}` }
    }

    if (selectedVariant) {
      unitPrice = selectedVariant.price
    } else {
      return { ok: false, error: `Variant is required for product: ${productId}` }
    }
  }

  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    return { ok: false, error: `Product is not available for direct checkout: ${productId}` }
  }

  return {
    ok: true,
    product,
    quantity,
    unitPrice,
    lineAmount: unitPrice * quantity,
  }
}