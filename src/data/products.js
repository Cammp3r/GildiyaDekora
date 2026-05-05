import dtb from '../../dtb.json'
import oracDecor from '../../orac_decor.json'
import fallbackImage from '../logos/logo.png'

export const PRIVATBANK_EUR_TO_UAH = 51.95
export const PRIVATBANK_RATE_DATE = '03.05.2026'

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
  return currency === 'EUR' ? Math.round(num * PRIVATBANK_EUR_TO_UAH) : num
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

function normalizeColors(colors) {
  return toArray(colors)
    .filter(Boolean)
    .map((color) => {
      if (typeof color === 'string') return { code: color, img: '' }
      return {
        code: color.code ?? color.name ?? '',
        img: color.img ?? '',
      }
    })
    .filter((c) => Boolean(c.code) || Boolean(c.img))
}

function normalizeTextures(textures) {
  return toArray(textures)
    .filter(Boolean)
    .map((texture) => {
      if (typeof texture === 'string') return { name: texture, url: '' }
      return {
        name: texture.name ?? '',
        url: texture.url ?? '',
      }
    })
    .filter((t) => Boolean(t.name) || Boolean(t.url))
}

function normalizePhotos(photos) {
  return toArray(photos).filter((p) => typeof p === 'string' && p.trim().length > 0)
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
    .filter((variant) => variant.volume && Number.isFinite(Number(variant.price)))
}

function mapProduct(product, { brand = 'oikos', category, subcategory, sectionId }) {
  const photos = normalizePhotos(product.photos)
  const colors = normalizeColors(product.colors)
  const textures = normalizeTextures(product.textures)
  const primaryImage =
    photos[0] || colors.find((c) => c.img)?.img || product.image || fallbackImage

  const priceCurrency = product.price_currency ?? ''
  const price =
    product.price_m2 ??
    product.pricePerM2 ??
    product.price_per_m2 ??
    product.price ??
    null
  const priceVariants = normalizePriceVariants(
    product.price_variants ?? product.priceVariants,
    priceCurrency
  )
  const convertedPrice = priceVariants.length
    ? Math.min(...priceVariants.map((variant) => Number(variant.price)))
    : toUah(price, priceCurrency)

  return {
    id: String(product.id ?? product.url ?? product.name),
    title: product.name ?? '',
    brand,
    category,
    subcategory,
    description: product.desc ?? product.description ?? '',
    image: primaryImage,
    photos,
    colors,
    textures,
    unitPrice: convertedPrice,
    price: convertedPrice,
    priceCurrency: 'UAH',
    priceSource: product.price_source ?? '',
    priceVariants,
    originalPriceCurrency: priceCurrency,
    exchangeRate: priceCurrency === 'EUR' ? PRIVATBANK_EUR_TO_UAH : null,
    finish: toArray(product.finish),
    base: product.base ?? '',
    effect: product.effect ?? '',
    url: product.url ?? '',
    eco: Boolean(product.eco),
    washable: Boolean(product.washable),
    formaldehydeFree: Boolean(product.formaldehyde_free),
    colorsCount: product.colors_count ?? product.colorsCount ?? null,
    colorsNote: product.colors_note ?? '',
    colorsCollection: product.colors_collection ?? product.colorsCollection ?? '',
    colorCollection: product.color_collection ?? '',
    colorCollectionUrl: product.color_collection_url ?? '',
    versions: toArray(product.versions),
    note: product.note ?? '',
    sectionId: sectionId ?? '',
    tags: toArray(product.tags),
  }
}

/**
 * Трансформує дані з dtb.json у формат, сумісний з UI
 */
function transformProductsData() {
  const products = []

  // Завантажуємо OIKOS продукти
  toArray(dtb.sections).forEach((section) => {
    const categoryName = section.title ?? section.id ?? ''

    // 1) Секції з прямим масивом продуктів (наприклад: interior-decor)
    if (Array.isArray(section.products) && section.products.length > 0) {
      section.products.forEach((product) => {
        products.push(
          mapProduct(product, {
            brand: 'oikos',
            category: categoryName,
            subcategory: product.subcategory ?? '',
            sectionId: section.id,
          })
        )
      })
      return
    }

    // 2) Секції з підкатегоріями (interior-paint, exterior-paint, інші)
    if (Array.isArray(section.subcategories) && section.subcategories.length > 0) {
      section.subcategories.forEach((subCategory) => {
        toArray(subCategory.products).forEach((product) => {
          products.push(
            mapProduct(product, {
              brand: 'oikos',
              category: categoryName,
              subcategory: subCategory.name ?? '',
              sectionId: section.id,
            })
          )
        })
      })
    }
  })

  // Завантажуємо ORAC DECOR продукти
  toArray(oracDecor.sections).forEach((section) => {
    const categoryName = section.title ?? section.id ?? ''

    if (Array.isArray(section.products) && section.products.length > 0) {
      section.products.forEach((product) => {
        products.push(
          mapProduct(product, {
            brand: 'orac-decor',
            category: categoryName,
            subcategory: product.subcategory ?? '',
            sectionId: section.id,
          })
        )
      })
    }
  })

  return products
}

export const productsDb = transformProductsData()
