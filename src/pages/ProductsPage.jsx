import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { productsDb } from '../data/products.js'
import { useCart } from '../cart/CartContext.jsx'

const ITEMS_PER_PAGE = 15

function getPositivePage(value) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

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
    <div className="image-wrapper" style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>
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
            zIndex: 10,
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
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
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
  const [searchParams, setSearchParams] = useSearchParams()
  const brandFromUrl = searchParams.get('brand') || 'oikos'
  
  const categories = useMemo(
    () => [...new Set(productsDb.filter((p) => p.brand === brandFromUrl).map((p) => p.category))],
    [brandFromUrl]
  )
  
  const categoryFromUrl = searchParams.get('category') || 'all'
  const selectedCategory =
    categoryFromUrl === 'all' || categories.includes(categoryFromUrl)
      ? categoryFromUrl
      : 'all'
  const searchQuery = searchParams.get('q') || ''
  const currentPage = getPositivePage(searchParams.get('page'))
  const { addItem } = useCart()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  const buildCatalogParams = useCallback(
    ({ brand = brandFromUrl, category = selectedCategory, query = searchQuery, page = currentPage } = {}) => {
      const params = new URLSearchParams()
      if (brand && brand !== 'oikos') params.set('brand', brand)
      if (category && category !== 'all') params.set('category', category)
      if (query) params.set('q', query)
      if (page > 1) params.set('page', String(page))
      return params
    },
    [brandFromUrl, currentPage, searchQuery, selectedCategory],
  )

  const updateCatalogParams = useCallback(
    (nextState) => {
      setSearchParams(buildCatalogParams(nextState), { replace: true })
    },
    [buildCatalogParams, setSearchParams],
  )

  const getCatalogSearch = useCallback(() => {
    const search = buildCatalogParams().toString()
    return search ? `?${search}` : ''
  }, [buildCatalogParams])

  const handleCategoryFilter = (category) => {
    updateCatalogParams({ category, page: 1 })
  }

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const byBrand = productsDb.filter((p) => p.brand === brandFromUrl)
    const byCategory =
      selectedCategory === 'all'
        ? byBrand
        : byBrand.filter((p) => p.category === selectedCategory)

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
  }, [searchQuery, selectedCategory, brandFromUrl])

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const activePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  const formatPrice = (product) => {
    const price = product.price
    if (price === null || price === undefined || price === '') return ''
    const num = typeof price === 'number' ? price : Number(price)
    if (!Number.isFinite(num) || num <= 0) return ''
    const prefix = product.priceVariants?.length > 1 ? 'від ' : ''
    return `${prefix}${num.toLocaleString('uk-UA')} грн`
  }

  return (
    <section className="products">
      <div className="container">
        <h2 className="section-title">
          Лінійки продуктів {brandFromUrl === 'orac-decor' ? 'ORAC DECOR' : 'OIKOS'}
        </h2>

        <div className="products-search">
          <input
            className="products-search-input"
            type="search"
            placeholder="Пошук фарби (назва, ефект, код кольору...)"
            value={searchQuery}
            onChange={(e) => {
              const query = e.target.value
              updateCatalogParams({ query, page: 1 })
            }}
            aria-label="Пошук фарби"
          />
        </div>

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

        <div className={`products-grid ${brandFromUrl === 'orac-decor' ? 'orac-products-grid' : ''}`}>
          {paginatedProducts.map((product) => (
            <div key={product.id} className="product-card">
              <div className={`product-swatch ${product.brand === 'orac-decor' ? 'orac-swatch' : ''}`}>
                <LazyImage
                  className="swatch-color"
                  src={product.image}
                  alt={product.title}
                />
                <div className="product-badges">
                  <span className="product-tag">{product.category}</span>
                  {product.eco && <span className="product-eco-badge">Еко</span>}
                </div>
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.title}</h3>
                {product.effect && (
                  <p className="product-effect">
                    <strong>Ефект:</strong> {product.effect}
                  </p>
                )}
                <div className="product-footer">
                  <span className="product-price">{formatPrice(product)}</span>
                  <div className="product-actions">
                    <button
                      type="button"
                      className="add-btn"
                      onClick={() => addItem(product, product.priceVariants?.[0] ?? null, 1)}
                    >
                      В кошик
                    </button>
                    <Link
                      to={{
                        pathname: `/products/${encodeURIComponent(product.id)}`,
                        search: getCatalogSearch(),
                      }}
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
              onClick={() => {
                updateCatalogParams({ page: 1 })
              }}
              disabled={activePage === 1}
              style={{
                padding: '8px 12px',
                cursor: activePage === 1 ? 'not-allowed' : 'pointer',
                opacity: activePage === 1 ? 0.5 : 1,
              }}
            >
              Перша
            </button>

            <button
              onClick={() => {
                const page = Math.max(1, activePage - 1)
                updateCatalogParams({ page })
              }}
              disabled={activePage === 1}
              style={{
                padding: '8px 12px',
                cursor: activePage === 1 ? 'not-allowed' : 'pointer',
                opacity: activePage === 1 ? 0.5 : 1,
              }}
            >
              Назад
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
                  const distance = Math.abs(page - activePage)
                  return distance === 0 || distance === 1 || page === 1 || page === totalPages
                })
                .map((page, idx, arr) => (
                  <span key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && <span>...</span>}
                    <button
                      onClick={() => {
                        updateCatalogParams({ page })
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      style={{
                        padding: '8px 12px',
                        fontWeight: page === activePage ? 'bold' : 'normal',
                        backgroundColor: page === activePage ? '#007bff' : 'transparent',
                        color: page === activePage ? 'white' : 'inherit',
                        border: page === activePage ? 'none' : '1px solid #ccc',
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
              onClick={() => {
                const page = Math.min(totalPages, activePage + 1)
                updateCatalogParams({ page })
              }}
              disabled={activePage === totalPages}
              style={{
                padding: '8px 12px',
                cursor: activePage === totalPages ? 'not-allowed' : 'pointer',
                opacity: activePage === totalPages ? 0.5 : 1,
              }}
            >
              Далі
            </button>

            <button
              onClick={() => {
                updateCatalogParams({ page: totalPages })
              }}
              disabled={activePage === totalPages}
              style={{
                padding: '8px 12px',
                cursor: activePage === totalPages ? 'not-allowed' : 'pointer',
                opacity: activePage === totalPages ? 0.5 : 1,
              }}
            >
              Остання
            </button>

            <div
              style={{
                marginLeft: '20px',
                fontSize: '14px',
                color: '#666',
              }}
            >
              Сторінка {activePage} з {totalPages} ({filteredProducts.length} товарів)
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
  )
}
