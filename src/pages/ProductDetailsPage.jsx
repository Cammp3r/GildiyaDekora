import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { productsDb } from '../data/products.js'
import { useCart } from '../cart/CartContext.jsx'

export default function ProductDetailsPage() {
  const { id } = useParams()
  const location = useLocation()
  const { addItem } = useCart()
  const product = useMemo(() => {
    if (!id) return undefined
    const decodedId = decodeURIComponent(id)
    return productsDb.find((p) => String(p.id) === decodedId)
  }, [id])

  const [activePhotoByProduct, setActivePhotoByProduct] = useState({})
  const [selectedTextureByProduct, setSelectedTextureByProduct] = useState({})
  const [selectedColorByProduct, setSelectedColorByProduct] = useState({})
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState({})
  const [quantityByProduct, setQuantityByProduct] = useState({})

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [id])

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
  const rawPrice = selectedVariant?.price ?? product.price
  const price = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice)
  const hasPrice = Number.isFinite(price) && price > 0
  const shouldShowContactPriceButton = product.brand === 'orac-decor' && !hasPrice
  const priceLabel = hasPrice ? `${price.toLocaleString('uk-UA')} грн` : ''
  const lineTotal = hasPrice ? price * Number(quantity || 0) : 0
  const characteristics = Array.isArray(product.characteristics) ? product.characteristics : []
  const hasCharacteristics = characteristics.length > 0

  return (
    <section className="product-details">
      <div className="container">
        <div className="product-details-top">
          <Link
            to={{ pathname: '/products', search: location.search }}
            className="product-details-back"
          >
            Назад до каталогу
          </Link>
        </div>

        <h2 className="section-title">{product.title}</h2>

        <div className={`product-details-grid ${product.brand === 'orac-decor' ? 'orac-details-grid' : ''}`}>
          <div className="product-details-media">
            <img
              className={`product-details-image ${product.brand === 'orac-decor' ? 'orac-image' : ''}`}
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

            {product.description && <p className="product-details-desc">{product.description}</p>}

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

            {priceLabel && <div className="product-details-price">{priceLabel}</div>}

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
                            {variant.volume} - {Number(variant.price).toLocaleString('uk-UA')} грн
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
                    className="add-btn"
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
                <Link to="/contact" className="add-btn">
                  Дізнатись ціну
                </Link>
              )}
              {shouldShowContactPriceButton || (<Link to="/contact" className="add-btn">
                Замовити консультацію
              </Link>)}
              
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
