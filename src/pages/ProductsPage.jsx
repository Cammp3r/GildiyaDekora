import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { productsDb } from '../data/products.js'
import { useCart } from '../cart/CartContext.jsx'

const ITEMS_PER_PAGE = 15

// Компонент для ленивой загрузки изображения с плейсхолдером
function LazyImage({ src, alt, className }) {
  const [imageSrc, setImageSrc] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImageSrc(src)
      setIsLoading(false)
    }
    img.onerror = () => {
      setIsLoading(false)
    }
    img.src = src
  }, [src])

  return (
    <div className="image-wrapper" style={{ position: 'relative', overflow: 'hidden' }}>
      {isLoading && (
        <div
          className="image-placeholder"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#999',
          }}
        >
          Завантаження...
        </div>
      )}
      <img
        className={className}
        src={imageSrc || src}
        alt={alt}
        style={{
          opacity: isLoading ? 0.5 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
        decoding="async"
        loading="lazy"
      />
    </div>
  )
}

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const categories = [...new Set(productsDb.map((p) => p.category))]
  const { addItem } = useCart()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category)
    setCurrentPage(1) // Сброс на первую страницу
  }

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const byCategory =
      selectedCategory === 'all'
        ? productsDb
        : productsDb.filter((p) => p.category === selectedCategory)

    if (!query) return byCategory

    return byCategory.filter((p) => {
      const colorCodes = Array.isArray(p.colors)
        ? p.colors.map((c) => c?.code).filter(Boolean).join(' ')
        : ''
      const textureNames = Array.isArray(p.textures)
        ? p.textures.map((t) => t?.name).filter(Boolean).join(' ')
        : ''
      const tags = Array.isArray(p.tags) ? p.tags.filter(Boolean).join(' ') : ''

      const haystack = [
        p.title,
        p.description,
        p.effect,
        p.base,
        p.category,
        p.subcategory,
        tags,
        colorCodes,
        textureNames,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [searchQuery, selectedCategory])

  // Пагинация
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

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

          {/* Search */}
          <div className="products-search">
            <input
              className="products-search-input"
              type="search"
              placeholder="Пошук фарби (назва, ефект, код кольору…)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1) // Сброс на першу сторінку при пошуку
              }}
              aria-label="Пошук фарби"
            />
          </div>

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
            {paginatedProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-swatch">
                  <LazyImage
                    className="swatch-color"
                    src={product.image}
                    alt={product.title}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="pagination"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                margin: '40px 0',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                }}
              >
                ← Першa
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                }}
              >
                ← Назад
              </button>

              <div
                style={{
                  display: 'flex',
                  gap: '5px',
                  alignItems: 'center',
                }}
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    const distance = Math.abs(page - currentPage)
                    return distance === 0 || distance === 1 || page === 1 || page === totalPages
                  })
                  .map((page, idx, arr) => (
                    <span key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && <span>...</span>}
                      <button
                        onClick={() => {
                          setCurrentPage(page)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        style={{
                          padding: '8px 12px',
                          fontWeight: page === currentPage ? 'bold' : 'normal',
                          backgroundColor: page === currentPage ? '#007bff' : 'transparent',
                          color: page === currentPage ? 'white' : 'inherit',
                          border: page === currentPage ? 'none' : '1px solid #ccc',
                          cursor: 'pointer',
                          borderRadius: '4px',
                        }}
                      >
                        {page}
                      </button>
                    </span>
                  ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }}
              >
                Далі →
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }}
              >
                Остання →
              </button>

              <div
                style={{
                  marginLeft: '20px',
                  fontSize: '14px',
                  color: '#666',
                }}
              >
                Сторінка {currentPage} з {totalPages} ({filteredProducts.length} товарів)
              </div>
            </div>
          )}

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
