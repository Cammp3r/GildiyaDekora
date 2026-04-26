import { useEffect, useState } from 'react'
import { productsDb } from '../data/products.js'

export default function ProductsPage() {
  const [filteredProducts, setFilteredProducts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

    // Отримуємо унікальні категорії
    const uniqueCategories = [...new Set(productsDb.map((p) => p.category))]
    setCategories(uniqueCategories)
    setFilteredProducts(productsDb)
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
    if (!price) return 'Дізнатись ціну'
    return `${price.toLocaleString('uk-UA')} грн`
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
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div
                  className="product-swatch"
                  style={{
                    backgroundImage: `url(${product.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <span className="product-tag">{product.category}</span>
                  {product.eco && <span className="product-eco-badge">🌿 Еко</span>}
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
                    <span className="product-price">{formatPrice(product.price)}</span>
                    <a href="#contact" className="add-btn">
                      Дізнатись більше
                    </a>
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
