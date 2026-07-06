import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { oikosProductsDb, loadOracDecorProducts, isOracProduct } from '../data/products.js'
import { useCart } from '../cart/CartContext.jsx'
import { Seo } from '../seo/Seo.jsx'
import { absoluteUrl } from '../seo/seoUtils.js'
import { useEurRate } from '../context/ExchangeRateContext.jsx'

export default function ProductDetailsPage() {
  const { id } = useParams()
  const location = useLocation()
  const { addItem } = useCart()
  const [oracProducts, setOracProducts] = useState(null)
  const [oracLoading, setOracLoading] = useState(false)
  const decodedId = id ? decodeURIComponent(id) : ''
  const needsOrac = isOracProduct(decodedId)

  useEffect(() => {
    if (needsOrac && oracProducts === null && !oracLoading) {
      setOracLoading(true)
      loadOracDecorProducts().then((data) => {
        setOracProducts(data)
        setOracLoading(false)
      })
    }
  }, [needsOrac, oracProducts, oracLoading])

  const product = useMemo(() => {
    if (!decodedId) return undefined
    if (needsOrac) {
      if (!oracProducts) return undefined
      return oracProducts.find((p) => String(p.id) === decodedId)
    }
    return oikosProductsDb.find((p) => String(p.id) === decodedId)
  }, [decodedId, needsOrac, oracProducts])

  const [activePhotoByProduct, setActivePhotoByProduct] = useState({})
  const [selectedTextureByProduct, setSelectedTextureByProduct] = useState({})
  const [selectedColorByProduct, setSelectedColorByProduct] = useState({})
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState({})
  const [quantityByProduct, setQuantityByProduct] = useState({})

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [id])

  if (oracLoading) {
    return <div className="container" style={{ padding: '6rem 0', textAlign: 'center', color: 'var(--muted)' }}>Завантаження…</div>
  }

  if (!product) {
    return <Navigate to="/products" replace />
  }

  const photos = Array.isArray(product.photos) ? product.photos.filter(Boolean) : []
  const hasMultiplePhotos = photos.length > 1

  const defaultPhoto = photos[0] || product.image || ''
  const activePhoto = activePhotoByProduct[product.id] ?? defaultPhoto

  const textures = Array.isArray(product.textures) ? product.textures : []
  const hasTextures = textures.length > 0

  const defaultTexture = (hasTextures && (textures[0]?.name || '')) || ''
  const selectedTexture = selectedTextureByProduct[product.id] ?? defaultTexture

  const colors = Array.isArray(product.colors) ? product.colors : []
  const hasColors = colors.length > 0
  const defaultColor = (hasColors && (colors[0]?.code || '')) || ''
  const selectedColor = selectedColorByProduct[product.id] ?? defaultColor
  const selectedColorObj = colors.find((c) => c?.code === selectedColor)

  const priceVariants = Array.isArray(product.priceVariants) ? product.priceVariants : []
  const selectedVariantId = selectedVariantByProduct[product.id] ?? priceVariants[0]?.id ?? ''
  const selectedVariant =
    priceVariants.find((variant) => variant.id === selectedVariantId) ?? priceVariants[0] ?? null
  const quantity = quantityByProduct[product.id] ?? 1
  const eurRate = useEurRate()
  const variantEurPrice = selectedVariant?.eurPrice ?? null
  const productEurPrice = product.eurPrice ?? null
  const activeEurPrice = variantEurPrice ?? productEurPrice
  const rawPrice = selectedVariant?.price ?? product.price
  const basePrice = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice)
  const price = activeEurPrice !== null
    ? Math.round(activeEurPrice * eurRate)
    : basePrice
  const hasPrice = Number.isFinite(price) && price > 0
  const shouldShowContactPriceButton = product.brand === 'orac-decor' && !hasPrice
  const priceLabel = hasPrice ? `${price.toLocaleString('uk-UA')} грн` : ''
  const lineTotal = hasPrice ? price * Number(quantity || 0) : 0
  const characteristics = Array.isArray(product.characteristics) ? product.characteristics : []
  const hasCharacteristics = characteristics.length > 0
  const shouldShowDescription = product.brand !== 'orac-decor' && product.description
  const brandName = product.brand === 'orac-decor' ? 'ORAC DECOR' : 'OIKOS'
  const productPath = `/products/${encodeURIComponent(product.id)}`

  // Ukrainian → Russian category/effect translations for search coverage
  const CATEGORY_RU = {
    'Декоративні фарби': 'декоративная краска',
    'Венеціанська штукатурка': 'венецианская штукатурка',
    'Фасадні матеріали': 'фасадный материал',
    'Фасадні фарби': 'фасадная краска',
    'Штукатурки': 'штукатурка',
    'Мікроцемент': 'микроцемент',
    'Ґрунтівки': 'грунтовка',
    'Лаки та захисні покриття': 'лак защитное покрытие',
    'Лак для дерева': 'лак для дерева',
    'Акрилова фарба': 'акриловая краска',
    'Фарба для стін': 'краска для стен',
    'Перламутр': 'перламутровая краска',
    'Ефект крейди': 'эффект мела',
    'Металік': 'металлик краска',
    'Карнизи та молдинги': 'карнизы и молдинги',
    'Декоративні панелі': 'декоративные панели',
    'Колони та пілястри': 'колонны и пилястры',
    'Медальйони та розетки': 'медальоны и розетки',
  }
  const categoryRu = CATEGORY_RU[product.category] || ''
  const brandRu = product.brand === 'orac-decor' ? 'ORAC DECOR' : 'OIKOS'
  const priceStr = hasPrice ? `від ${price.toLocaleString('uk-UA')} грн` : 'за запитом'

  // Meta description — Ukrainian, ~155 chars
  const metaDescParts = [
    `Купити ${product.title} (${brandName}) у Києві.`,
    product.category ? `${product.category}.` : '',
    product.effect ? `Ефект: ${product.effect}.` : '',
    `Ціна ${priceStr}. Офіційний дилер. Гільдія Декора.`,
  ].filter(Boolean).join(' ')
  const productDescription = metaDescParts.length > 160
    ? metaDescParts.slice(0, 157) + '...'
    : metaDescParts

  // General type keywords based on product type
  const TYPE_KEYWORDS_UA = {
    primer: 'купити ґрунтівку, ґрунтівка для стін, ґрунтовка OIKOS',
    wax: 'купити віск для штукатурки, захисний віск OIKOS',
    varnish: 'купити лак для стін, захисне покриття OIKOS, лак для штукатурки',
    paint: 'купити декоративну фарбу, декоративна штукатурка, купити фарбу OIKOS',
  }
  const TYPE_KEYWORDS_RU = {
    primer: 'купить грунтовку, грунтовка для стен OIKOS',
    wax: 'купить воск для штукатурки, защитный воск OIKOS',
    varnish: 'купить лак для стен, защитное покрытие OIKOS',
    paint: 'купить декоративную краску, декоративная штукатурка, купить краску OIKOS',
  }
  const typeKwUA = TYPE_KEYWORDS_UA[product.productType] || TYPE_KEYWORDS_UA.paint
  const typeKwRU = TYPE_KEYWORDS_RU[product.productType] || TYPE_KEYWORDS_RU.paint

  // Keywords — Ukrainian + Russian
  const seoKeywords = [
    `купити ${product.title}`,
    `${product.title} ${brandName} ціна`,
    `${product.title} київ`,
    `${product.title} україна`,
    product.category,
    product.effect ? `купити ${product.effect}` : '',
    typeKwUA,
    `купить ${product.title}`,
    `${product.title} ${brandRu} цена`,
    `${product.title} украина`,
    `${product.title} киев`,
    categoryRu,
    typeKwRU,
    product.brand === 'oikos'
      ? `OIKOS Украина краска, ${product.title} farba, ${product.title} фарба`
      : `ORAC DECOR Украина, ${product.title} square, ${product.title} профіль`,
  ].filter(Boolean).join(', ')

  // JSON-LD description — bilingual, longer
  const jsonLdDescription = [
    `Купити ${product.title} (${brandName}) у Києві та по Україні.`,
    product.description || '',
    product.category ? `Категорія: ${product.category}.` : '',
    product.effect ? `Ефект: ${product.effect}.` : '',
    `Ціна ${priceStr}. Офіційний дилер ${brandName} в Україні — Гільдія Декора, Київ.`,
    `— Купить ${product.title} ${brandRu} в Украине. Официальный дилер в Киеве.`,
    categoryRu ? `Категория: ${categoryRu}.` : '',
  ].filter(Boolean).join(' ')

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: jsonLdDescription,
    image: absoluteUrl(activePhoto || product.image),
    brand: {
      '@type': 'Brand',
      name: brandName,
    },
    category: [product.category, product.subcategory].filter(Boolean).join(' / '),
    url: absoluteUrl(productPath),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'UAH',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      url: absoluteUrl(productPath),
      seller: {
        '@type': 'Organization',
        name: 'Гільдія Декора',
        url: absoluteUrl('/'),
      },
      ...(hasPrice ? { price } : {}),
    },
  }

  return (
    <section className="product-details">
      <Seo
        title={
          product.brand === 'orac-decor'
            ? `${product.title} ORAC DECOR — купити в Києві | Гільдія Декора`
            : `Купити ${product.title} OIKOS — ${product.category || 'декоративна фарба'} | Гільдія Декора`
        }
        description={productDescription}
        keywords={seoKeywords}
        image={activePhoto || product.image}
        type="product"
        canonicalPath={productPath}
        jsonLd={productJsonLd}
      />
      <div className="container">
        <div className="product-details-top">
          <Link
            to={{ pathname: '/products', search: location.search }}
            className="product-details-back"
          >
            Назад до каталогу
          </Link>
        </div>

        <h1 className="section-title">{product.title}</h1>

        <div
          className={`product-details-grid ${
            product.brand === 'orac-decor' ? 'orac-details-grid' : 'oikos-details-grid'
          }`}
        >
          <div className="product-details-media">
            <img
              className={`product-details-image ${
                product.brand === 'orac-decor' ? 'orac-image' : 'oikos-image'
              }`}
              src={activePhoto || product.image}
              alt={product.title}
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />

            {hasMultiplePhotos && (
              <div className="product-details-thumbs" aria-label="Додаткові фото">
                {photos.map((src) => (
                  <button
                    key={src}
                    type="button"
                    className={`product-details-thumb ${src === activePhoto ? 'active' : ''}`}
                    onClick={() =>
                      setActivePhotoByProduct((prev) => ({
                        ...prev,
                        [product.id]: src,
                      }))
                    }
                    aria-label="Показати фото"
                  >
                    <img src={src} alt="" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-details-info">
            <div className="product-details-badges">
              {product.category && <span className="product-tag">{product.category}</span>}
              {product.subcategory && (
                <span className="product-details-subcategory">{product.subcategory}</span>
              )}
              {product.eco && <span className="product-eco-badge">Еко</span>}
            </div>

            {shouldShowDescription && <p className="product-details-desc">{product.description}</p>}

            {hasCharacteristics && (
              <div className="product-characteristics">
                <h3>Характеристики</h3>
                <dl>
                  {characteristics.map((item) => (
                    <div key={item.key} className="product-characteristics-row">
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {product.effect && (
              <p className="product-effect">
                <strong>Ефект:</strong> {product.effect}
              </p>
            )}

          

            {product.colorsNote && !hasColors && (
              <p className="product-details-desc" style={{ marginTop: '-0.5rem' }}>
                {product.colorsNote}
              </p>
            )}

            {hasTextures && (
              <div className="product-details-option">
                <div className="product-details-option-title">Текстура</div>
                <div className="product-details-textures">
                  {textures.map((t) => (
                    <button
                      key={t.name || t.url}
                      type="button"
                      className={`product-details-texture ${(t.name || t.url) === selectedTexture ? 'active' : ''}`}
                      onClick={() =>
                        setSelectedTextureByProduct((prev) => ({
                          ...prev,
                          [product.id]: t.name || t.url,
                        }))
                      }
                      title={t.name}
                      aria-label={t.name}
                    >
                      {t.url ? (
                        <img src={t.url} alt={t.name} loading="lazy" decoding="async" />
                      ) : (
                        <span className="product-details-texture-name">{t.name}</span>
                      )}
                    </button>
                  ))}
                </div>

                {selectedTexture && (
                  <div className="product-details-selected">
                    <strong>Обрано:</strong> {selectedTexture}
                  </div>
                )}
              </div>
            )}

            {hasColors && (
              <div className="product-details-option">
                <div className="product-details-option-title">Кольорова гамма</div>
                <div className="product-details-colors">
                  {colors.map((c) => (
                    <button
                      key={`${c.code}-${c.img}`}
                      type="button"
                      className={`product-details-color ${c.code === selectedColor ? 'active' : ''}`}
                      onClick={() =>
                        setSelectedColorByProduct((prev) => ({
                          ...prev,
                          [product.id]: c.code,
                        }))
                      }
                      title={c.code}
                      aria-label={c.code}
                    >
                      {c.img ? (
                        <img src={c.img} alt={c.code} loading="lazy" decoding="async" />
                      ) : (
                        <span className="product-details-color-code">{c.code}</span>
                      )}
                    </button>
                  ))}
                </div>

                {selectedColorObj?.code && (
                  <div className="product-details-selected">
                    <strong>Обрано:</strong> {selectedColorObj.code}
                  </div>
                )}
              </div>
            )}

            {priceLabel
              ? <div className="product-details-price">{priceLabel}</div>
              : <div className="product-details-price product-price--request">Ціна за запитом</div>
            }

            {priceVariants.length > 0 && (
              <div className="product-price-variants">
                {priceVariants.map((variant) => (
                  <div key={`${variant.id}-${variant.price}`} className="product-price-variant">
                    <span>{variant.title || variant.volume}</span>
                    <strong>{Number(variant.price).toLocaleString('uk-UA')} грн</strong>
                  </div>
                ))}
              </div>
            )}

            <div className="product-details-actions">
              {!shouldShowContactPriceButton && (
                <div className="product-details-buy">
                  {priceVariants.length > 0 && (
                    <label className="cart-label">
                      Об'єм
                      <select
                        className="cart-input"
                        value={selectedVariantId}
                        onChange={(e) =>
                          setSelectedVariantByProduct((prev) => ({
                            ...prev,
                            [product.id]: e.target.value,
                          }))
                        }
                      >
                        {priceVariants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.title ? variant.title + ' ' + variant.volume : variant.volume} - {Number(variant.price).toLocaleString('uk-UA')} грн
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="cart-label">
                    Кількість
                    <input
                      className="cart-input"
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(e) =>
                        setQuantityByProduct((prev) => ({
                          ...prev,
                          [product.id]: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="add-btn add-btn-primary"
                    onClick={() => addItem(product, selectedVariant, quantity, selectedTexture, selectedColor)}
                  >
                    В кошик
                  </button>
                </div>
              )}
              {lineTotal > 0 && (
                <div className="product-details-total">
                  Разом: <strong>{lineTotal.toLocaleString('uk-UA')} грн</strong>
                </div>
              )}
              {shouldShowContactPriceButton && (
                <Link to="/contact" className="add-btn add-btn-secondary">
                  Дізнатись ціну
                </Link>
              )}
              {shouldShowContactPriceButton || (
                <Link to="/contact" className="add-btn add-btn-secondary">
                  Замовити консультацію
                </Link>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
