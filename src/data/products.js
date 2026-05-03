import dtb from '../../dtb.json'
import fallbackImage from '../logos/logo.png'

function toArray(value) {
  return Array.isArray(value) ? value : []
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

function normalizePriceVariants(variants) {
  return toArray(variants)
    .filter(Boolean)
    .map((variant) => ({
      title: variant.title ?? variant.name ?? '',
      volume: variant.volume ?? '',
      price: variant.price ?? null,
    }))
    .filter((variant) => variant.title && Number.isFinite(Number(variant.price)))
}

function mapProduct(product, { category, subcategory, sectionId }) {
  const photos = normalizePhotos(product.photos)
  const colors = normalizeColors(product.colors)
  const textures = normalizeTextures(product.textures)
  const primaryImage =
    photos[0] || colors.find((c) => c.img)?.img || product.image || fallbackImage

  const pricePerM2 =
    product.price_m2 ??
    product.pricePerM2 ??
    product.price_per_m2 ??
    product.price ??
    null

  return {
    id: String(product.id ?? product.url ?? product.name),
    title: product.name ?? '',
    category,
    subcategory,
    description: product.desc ?? product.description ?? '',
    image: primaryImage,
    photos,
    colors,
    textures,
    pricePerM2,
    price: pricePerM2,
    priceCurrency: product.price_currency ?? '',
    priceSource: product.price_source ?? '',
    priceVariants: normalizePriceVariants(product.price_variants ?? product.priceVariants),
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

  toArray(dtb.sections).forEach((section) => {
    const categoryName = section.title ?? section.id ?? ''

    // 1) Секції з прямим масивом продуктів (наприклад: interior-decor)
    if (Array.isArray(section.products) && section.products.length > 0) {
      section.products.forEach((product) => {
        products.push(
          mapProduct(product, {
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
              category: categoryName,
              subcategory: subCategory.name ?? '',
              sectionId: section.id,
            })
          )
        })
      })
    }
  })

  return products
}

export const productsDb = transformProductsData()
