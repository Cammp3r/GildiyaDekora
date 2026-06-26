import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { productsDb } from '../data/products.js'
import { useCart } from '../cart/CartContext.jsx'
import { Seo } from '../seo/Seo.jsx'

// Cyrillic characters that are visually identical to Latin letters.
// Normalizing both query and haystack to Latin before comparing makes
// "c351" find "С351" and "сх" find "cx" (and vice-versa).
const CYRILLIC_LOOKALIKE = { 'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'х': 'x', 'і': 'i' }
function normLookalike(text) {
  return text.replace(/[аеорсхі]/g, (ch) => CYRILLIC_LOOKALIKE[ch])
}

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
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [sortOrder, setSortOrder] = useState('default')
  const [filterOpen, setFilterOpen] = useState(false)
  const prevBrand = useRef(brandFromUrl)

  const usesOracGrid = brandFromUrl === 'orac-decor' && !searchQuery.trim()
  const colCount = usesOracGrid ? 3 : 4
  const ITEMS_PER_PAGE = usesOracGrid ? 15 : 16

  const brandName = brandFromUrl === 'orac-decor' ? 'ORAC DECOR' : 'OIKOS'
  const catalogHeading =
    brandFromUrl === 'orac-decor'
      ? 'Ліпнина ORAC DECOR у Києві'
      : 'Декоративні фарби та штукатурки OIKOS'
  const searchLabel =
    brandFromUrl === 'orac-decor'
      ? 'Пошук товару'
      : 'Пошук фарби'
  const searchPlaceholder =
    brandFromUrl === 'orac-decor'
      ? 'Пошук товару (назва, категорія)'
      : 'Пошук фарби (назва, ефект)'
  const seoTitle =
    selectedCategory === 'all'
      ? catalogHeading
      : `${selectedCategory} ${brandName}`
  const seoDescription =
    selectedCategory === 'all'
      ? `Каталог ${brandName} від Гільдії Декору: матеріали для інтерʼєру, ціни, фото, характеристики та консультація у Києві.`
      : `${selectedCategory} ${brandName}: перегляньте товари, фото, характеристики та замовте консультацію в Гільдії Декору.`

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  useEffect(() => {
    if (prevBrand.current !== brandFromUrl) {
      prevBrand.current = brandFromUrl
      setPriceMin('')
      setPriceMax('')
      setSortOrder('default')
    }
  }, [brandFromUrl])

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
    const minNum = priceMin !== '' ? Number(priceMin) : null
    const maxNum = priceMax !== '' ? Number(priceMax) : null

    const priceFilter = (p) => {
      const price = typeof p.price === 'number' ? p.price : Number(p.price)
      if (!Number.isFinite(price) || price <= 0) return true
      if (minNum !== null && price < minNum) return false
      if (maxNum !== null && price > maxNum) return false
      return true
    }

    const tokens = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean)
    const normTokens = tokens.map((t) => normLookalike(t))
    const hasSearch = tokens.length > 0

    const byBrand = productsDb.filter((p) => p.brand === brandFromUrl)
    const byCategory =
      selectedCategory === 'all'
        ? byBrand
        : byBrand.filter((p) => p.category === selectedCategory)

    let result

    if (!hasSearch) {
      result = byCategory.filter(priceFilter)
    } else {
      const searchPool =
        selectedCategory === 'all'
          ? productsDb
          : productsDb.filter((p) => p.category === selectedCategory)

      result = searchPool
        .filter((p) => {
          const colorCodes = Array.isArray(p.colors)
            ? p.colors.map((c) => c?.code).filter(Boolean).join(' ')
            : ''
          const textureNames = Array.isArray(p.textures)
            ? p.textures.map((t) => t?.name).filter(Boolean).join(' ')
            : ''
          const tags = Array.isArray(p.tags) ? p.tags.filter(Boolean).join(' ') : ''
          const haystack = normLookalike(
            [p.id, p.title, p.description, p.effect, p.base, p.category, p.subcategory, tags, colorCodes, textureNames]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
          )
          return normTokens.every((token) => haystack.includes(token))
        })
        .filter(priceFilter)
    }

    if (sortOrder === 'asc' || sortOrder === 'desc') {
      return [...result].sort((a, b) => {
        const pA = typeof a.price === 'number' ? a.price : Number(a.price) || 0
        const pB = typeof b.price === 'number' ? b.price : Number(b.price) || 0
        return sortOrder === 'asc' ? pA - pB : pB - pA
      })
    }

    if (hasSearch) {
      return [...result].sort((a, b) => {
        const brandA = a.brand === brandFromUrl ? 1 : 0
        const brandB = b.brand === brandFromUrl ? 1 : 0
        if (brandB !== brandA) return brandB - brandA
        const titleA = normLookalike(a.title.toLowerCase())
        const titleB = normLookalike(b.title.toLowerCase())
        const scoreA = normTokens.filter((t) => titleA.includes(t)).length
        const scoreB = normTokens.filter((t) => titleB.includes(t)).length
        return scoreB - scoreA
      })
    }

    return result
  }, [searchQuery, selectedCategory, brandFromUrl, priceMin, priceMax, sortOrder])

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const activePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  const activeFiltersCount = [
    priceMin !== '',
    priceMax !== '',
    sortOrder !== 'default',
  ].filter(Boolean).length

  const resetAllFilters = () => {
    setPriceMin('')
    setPriceMax('')
    setSortOrder('default')
    updateCatalogParams({ page: 1 })
  }

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
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonicalPath="/products"
      />
      <div className="container">
        <h1 className="section-title">{catalogHeading}</h1>

        <div className="products-search">
          <input
            className="products-search-input"
            type="search"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              const query = e.target.value
              updateCatalogParams({ query, page: 1 })
            }}
            aria-label={searchLabel}
          />
        </div>

        <div className="filter-toggle-row">
          <button
            className={`filter-toggle-btn ${filterOpen ? 'active' : ''}`}
            onClick={() => setFilterOpen(!filterOpen)}
            aria-expanded={filterOpen}
          >
            Фільтри та сортування
            {activeFiltersCount > 0 && (
              <span className="filter-badge">{activeFiltersCount}</span>
            )}
            <span className="filter-arrow">{filterOpen ? '▲' : '▼'}</span>
          </button>
        </div>

        {filterOpen && (
          <div className="filter-panel">
            <div className="filter-group">
              <span className="filter-group-label">Ціна (грн):</span>
              <div className="filter-price-row">
                <input
                  className="filter-price-input"
                  type="number"
                  placeholder="від"
                  min="0"
                  value={priceMin}
                  onChange={(e) => { setPriceMin(e.target.value); updateCatalogParams({ page: 1 }) }}
                  aria-label="Мінімальна ціна"
                />
                <span className="filter-price-sep">—</span>
                <input
                  className="filter-price-input"
                  type="number"
                  placeholder="до"
                  min="0"
                  value={priceMax}
                  onChange={(e) => { setPriceMax(e.target.value); updateCatalogParams({ page: 1 }) }}
                  aria-label="Максимальна ціна"
                />
              </div>
            </div>
            <div className="filter-group">
              <span className="filter-group-label">Сортування:</span>
              <div className="sort-options">
                <button
                  className={`sort-btn ${sortOrder === 'default' ? 'active' : ''}`}
                  onClick={() => { setSortOrder('default'); updateCatalogParams({ page: 1 }) }}
                >
                  За замовчуванням
                </button>
                <button
                  className={`sort-btn ${sortOrder === 'asc' ? 'active' : ''}`}
                  onClick={() => { setSortOrder('asc'); updateCatalogParams({ page: 1 }) }}
                >
                  Ціна: від низької
                </button>
                <button
                  className={`sort-btn ${sortOrder === 'desc' ? 'active' : ''}`}
                  onClick={() => { setSortOrder('desc'); updateCatalogParams({ page: 1 }) }}
                >
                  Ціна: від високої
                </button>
              </div>
            </div>
            {activeFiltersCount > 0 && (
              <button className="filter-reset-btn" onClick={resetAllFilters}>
                Скинути всі фільтри
              </button>
            )}
          </div>
        )}

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

        {(() => {
          const remainder = paginatedProducts.length % colCount
          const placeholderCount = remainder > 0 ? colCount - remainder : 0
          return (
            <div className={`products-grid ${usesOracGrid ? 'orac-products-grid' : ''}`}>
              {paginatedProducts.map((product) => (
                <div key={product.id} className="product-card">
                  <div className={`product-swatch ${product.brand === 'orac-decor' ? 'orac-swatch' : ''}`}>
                    <LazyImage
                      className="swatch-color"
                      src={product.image}
                      alt={product.title}
                    />
                    <div className="product-badges">
                      {product.eco && <span className="product-eco-badge">Еко</span>}
                    </div>
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.title}</h3>
                    <p className="product-sub">{product.subcategory || product.category}</p>
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
                          className="add-btn add-btn-primary"
                          onClick={() => addItem(product, product.priceVariants?.[0] ?? null, 1)}
                        >
                          В кошик
                        </button>
                        <Link
                          to={{
                            pathname: `/products/${encodeURIComponent(product.id)}`,
                            search: getCatalogSearch(),
                          }}
                          className="add-btn add-btn-secondary"
                        >
                          Дізнатись більше
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {Array.from({ length: placeholderCount }).map((_, i) => (
                <div key={`ph-${i}`} className="product-card-placeholder" aria-hidden="true" />
              ))}
            </div>
          )
        })()}

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
