import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productsDb } from '../data/products.js'
import { useCart } from '../cart/CartContext.jsx'

export default function ProductsPage() {
  const [filteredProducts, setFilteredProducts] = useState(productsDb)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const categories = [...new Set(productsDb.map((p) => p.category))]
  const { addItem } = useCart()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category)
    if (category === 'all') {
      setFilteredProducts(productsDb)
    } else {
      setFilteredProducts(productsDb.filter((p) => p.category === category))
    }
  }

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === '') return 'Дізнатись ціну'
    const num = typeof price === 'number' ? price : Number(price)
    if (!Number.isFinite(num) || num <= 0) return 'Дізнатись ціну'
    return `${num.toLocaleString('uk-UA')} грн/м²`
  }

  return (
    <>
      {/* Products Section */}
      <section className="products">
        <div className="container">
          <h2 className="section-title">Лінійки продуктів OIKOS</h2>

          {/* Category Filter */}
          <div className="products-filter" style={{ marginBottom: '40px' }}>
            <button
              className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => handleCategoryFilter('all')}
            >
              Усі товари
            </button>
            {categories.map((category) => (
              <button
                key={category}
                className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => handleCategoryFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="products-grid">
            {filteredProducts.map((product, index) => (
              <div key={product.id} className="product-card">
                <div className="product-swatch">
                  <img
                    className="swatch-color"
                    src={product.image}
                    alt={product.title}
                    loading={index < 4 ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={index < 2 ? 'high' : 'low'}
                  />
                  <div className="product-badges">
                    <span className="product-tag">{product.category}</span>
                    {product.eco && <span className="product-eco-badge">🌿 Еко</span>}
                  </div>
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.title}</h3>
                  <p className="product-desc">{product.description}</p>
                  {product.effect && (
                    <p className="product-effect">
                      <strong>Ефект:</strong> {product.effect}
                    </p>
                  )}
                  <div className="product-footer">
                    <span className="product-price">
                      {formatPrice(product.pricePerM2 ?? product.price)}
                    </span>
                    <div className="product-actions">
                      <button
                        type="button"
                        className="add-btn"
                        onClick={() => addItem(product, 1)}
                      >
                        В кошик
                      </button>
                      <Link
                        to={`/products/${encodeURIComponent(product.id)}`}
                        className="add-btn"
                      >
                        Дізнатись більше
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Товари в цій категорії не знайдені</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
