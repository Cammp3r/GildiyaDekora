import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { productsDb } from '../data/products.js'
import { useCart } from '../cart/CartContext.jsx'

export default function ProductDetailsPage() {
  const { id } = useParams()
  const { addItem } = useCart()
  const product = useMemo(() => {
    if (!id) return undefined
    const decodedId = decodeURIComponent(id)
    return productsDb.find((p) => String(p.id) === decodedId)
  }, [id])

  const [activePhotoByProduct, setActivePhotoByProduct] = useState({})
  const [selectedTextureByProduct, setSelectedTextureByProduct] = useState({})
  const [selectedColorByProduct, setSelectedColorByProduct] = useState({})
  const [areaM2ByProduct, setAreaM2ByProduct] = useState({})

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

  const defaultTexture =
    (hasTextures && (textures[0]?.name || '')) || ''
  const selectedTexture = selectedTextureByProduct[product.id] ?? defaultTexture

  const colors = Array.isArray(product.colors) ? product.colors : []
  const hasColors = colors.length > 0
  const defaultColor = (hasColors && (colors[0]?.code || '')) || ''
  const selectedColor = selectedColorByProduct[product.id] ?? defaultColor
  const selectedColorObj = colors.find((c) => c?.code === selectedColor)

  const areaM2 = areaM2ByProduct[product.id] ?? 1

  const rawPricePerM2 = product.pricePerM2 ?? product.price
  const pricePerM2 =
    typeof rawPricePerM2 === 'number' ? rawPricePerM2 : Number(rawPricePerM2)
  const priceLabel =
    Number.isFinite(pricePerM2) && pricePerM2 > 0
      ? `${pricePerM2.toLocaleString('uk-UA')} грн/м²`
      : 'Дізнатись ціну'

  return (
    <section className="product-details">
      <div className="container">
        <div className="product-details-top">
          <Link to="/products" className="product-details-back">
            ← Назад до каталогу
          </Link>
        </div>

        <h2 className="section-title">{product.title}</h2>

        <div className="product-details-grid">
          <div className="product-details-media">
            <img
              className="product-details-image"
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
              {product.eco && <span className="product-eco-badge">🌿 Еко</span>}
            </div>

            {product.description && <p className="product-details-desc">{product.description}</p>}

            {product.effect && (
              <p className="product-effect">
                <strong>Ефект:</strong> {product.effect}
              </p>
            )}

            {(product.colorsCollection || product.colorsCount) && !hasColors && (
              <p className="product-details-desc" style={{ marginTop: '-0.5rem' }}>
                <strong>Кольорова гамма:</strong>{' '}
                {product.colorsCollection ? product.colorsCollection : 'Колекція'}
                {product.colorsCount ? ` — ${product.colorsCount} відтінків` : ''}
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
                <select
                  className="product-details-select"
                  value={selectedTexture}
                  onChange={(e) =>
                    setSelectedTextureByProduct((prev) => ({
                      ...prev,
                      [product.id]: e.target.value,
                    }))
                  }
                >
                  {textures.map((t) => (
                    <option key={t.name || t.url} value={t.name || ''}>
                      {t.name || 'Текстура'}
                    </option>
                  ))}
                </select>
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

            {Array.isArray(product.tags) && product.tags.length > 0 && (
              <div className="product-details-tags">
                {product.tags.map((tag) => (
                  <span key={tag} className="product-details-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="product-details-price">{priceLabel}</div>

            <div className="product-details-actions">
              <div className="product-details-buy">
                <label className="cart-label">
                  Площа, м²
                  <input
                    className="cart-input"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={areaM2}
                    onChange={(e) =>
                      setAreaM2ByProduct((prev) => ({
                        ...prev,
                        [product.id]: e.target.value,
                      }))
                    }
                  />
                </label>
                <button
                  type="button"
                  className="add-btn"
                  onClick={() => addItem(product, areaM2)}
                >
                  В кошик
                </button>
              </div>
              <Link to="/contact" className="add-btn">
                Замовити консультацію
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
