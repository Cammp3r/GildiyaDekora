import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { productsDb } from '../data/products.js'

export default function ProductDetailsPage() {
  const { id } = useParams()
  const productId = Number(id)

  const product = Number.isFinite(productId)
    ? productsDb.find((p) => p.id === productId)
    : undefined

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [productId])

  if (!product) {
    return <Navigate to="/products" replace />
  }

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
            <div
              className="product-details-image"
              style={{
                backgroundImage: `url(${product.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              aria-label={product.title}
            />
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

            {Array.isArray(product.tags) && product.tags.length > 0 && (
              <div className="product-details-tags">
                {product.tags.map((tag) => (
                  <span key={tag} className="product-details-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="product-details-actions">
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
