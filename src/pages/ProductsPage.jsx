import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { oikosProductsDb, loadOracDecorProducts } from '../data/products.js'
import { useCart } from '../cart/CartContext.jsx'
import { Seo } from '../seo/Seo.jsx'
import { useEurRate } from '../context/ExchangeRateContext.jsx'
import { thumbSrc } from '../utils/imageUtils.js'

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
    // Catalog images are exported at ~1920px; card thumbnails only need
    // ~480px, so prefer the small "-thumb" build variant. Falls back to
    // the full image if the thumb doesn't exist (e.g. local dev, where
    // thumbnails aren't generated until `npm run build`).
    const thumb = thumbSrc(src)
    const img = new Image()
    img.onload = () => {
      setImageSrc(thumb)
      setIsLoading(false)
    }
    img.onerror = () => {
      if (thumb === src) {
        setIsLoading(false)
        return
      }
      const fallback = new Image()
      fallback.onload = () => {
        setImageSrc(src)
        setIsLoading(false)
      }
      fallback.onerror = () => setIsLoading(false)
      fallback.src = src
    }
    img.src = thumb
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
  const location = useLocation()
  const brandFromPath = location.pathname === '/products/orac-decor/' ? 'orac-decor' : null
  const brandFromUrl = brandFromPath || searchParams.get('brand') || 'oikos'
  // Trailing slash matters: prerendered directory routes 301 to add it on
  // Netlify, so the catalog's canonical/internal-link base must already be final.
  const catalogBasePath = brandFromUrl === 'orac-decor' ? '/products/orac-decor/' : '/products/'

  const [oracProducts, setOracProducts] = useState(null)
  const [oracLoading, setOracLoading] = useState(false)

  useEffect(() => {
    if (brandFromUrl === 'orac-decor' && oracProducts === null && !oracLoading) {
      setOracLoading(true)
      loadOracDecorProducts().then((data) => {
        setOracProducts(data)
        setOracLoading(false)
      })
    }
  }, [brandFromUrl, oracProducts, oracLoading])

  const activeProducts = useMemo(() => {
    if (brandFromUrl === 'orac-decor') return oracProducts ?? []
    return oikosProductsDb
  }, [brandFromUrl, oracProducts])

  const categories = useMemo(
    () => [...new Set(activeProducts.map((p) => p.category))],
    [activeProducts]
  )

  const categoryFromUrl = searchParams.get('category') || 'all'
  const selectedCategory =
    categoryFromUrl === 'all' || categories.includes(categoryFromUrl)
      ? categoryFromUrl
      : 'all'
  const searchQuery = searchParams.get('q') || ''
  const currentPage = getPositivePage(searchParams.get('page'))
  const { addItem } = useCart()
  const eurRate = useEurRate()
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [sortOrder, setSortOrder] = useState('default')
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedType, setSelectedType] = useState('all')
  const prevBrand = useRef(brandFromUrl)
  const didInitSearchSync = useRef(false)
  const [searchInput, setSearchInput] = useState(searchQuery)

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
    selectedCategory !== 'all'
      ? `${selectedCategory} ${brandName} — купити в Києві`
      : brandFromUrl === 'orac-decor'
        ? 'Купити ліпнину ORAC DECOR у Києві | Карнизи, молдинги, панелі'
        : 'Купити декоративну фарбу OIKOS у Києві | Штукатурка, мікроцемент, венеціанка'
  const seoDescription =
    selectedCategory !== 'all'
      ? `${selectedCategory} ${brandName}: перегляньте товари, фото, характеристики та замовте консультацію в Гільдії Декора, Київ.`
      : brandFromUrl === 'orac-decor'
        ? 'Офіційний дилер ORAC DECOR в Україні. Купити ліпнину, карнизи, молдинги, декоративні панелі ORAC DECOR у Києві. Ціни, фото, консультація — Гільдія Декора.'
        : 'Офіційний дилер OIKOS в Україні. Купити декоративну фарбу, венеціанську штукатурку, мікроцемент OIKOS у Києві. 840+ відтінків, ціни, доставка — Гільдія Декора.'
  const seoKeywords = brandFromUrl === 'orac-decor'
    ? 'ORAC DECOR Київ, купити ORAC DECOR, ліпнина Київ, карнизи молдинги, купити ліпнину, декоративна ліпнина купити, ORAC DECOR ціна, купить ORAC DECOR Украина, лепнина Киев, карнизы молдинги купить, потолочный плинтус орак декор, потолочный плинтус ORAC DECOR, купить потолочный плинтус Киев, потолочный карниз орак, лепнина из полиуретана Киев, молдинги для стен купить, розетки потолочные ORAC DECOR'
    : 'купити декоративну фарбу OIKOS, купити штукатурку Київ, купити венеціанську штукатурку, декоративні матеріали OIKOS, мікроцемент купити, ottocento farba, supercolor oikos, ottocento oikos, купить краску OIKOS, купить краску oikos Киев, купить OIKOS Украина, краска OIKOS цена, декоративная краска OIKOS, купить декоративную краску Киев, ottocento oikos купить, ottocento краска купить, микроцемент Киев купить, венецианская штукатурка OIKOS, декоративная штукатурка цена Украина, supercolor oikos купить'
  const seoCanonical = selectedCategory === 'all'
    ? catalogBasePath
    : `${catalogBasePath}?category=${encodeURIComponent(selectedCategory)}`

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  useEffect(() => {
    if (prevBrand.current !== brandFromUrl) {
      prevBrand.current = brandFromUrl
      setPriceMin('')
      setPriceMax('')
      setSortOrder('default')
      setSelectedType('all')
      setSearchInput('')
    }
  }, [brandFromUrl])

  // Sync external URL param changes (e.g. browser back button) back to local input
  useEffect(() => { setSearchInput(searchQuery) }, [searchQuery])

  // Debounce: update URL only 300ms after user stops typing
  useEffect(() => {
    if (!didInitSearchSync.current) {
      didInitSearchSync.current = true
      return () => {}
    }

    const timer = setTimeout(() => {
      updateCatalogParams({ query: searchInput, page: 1 })
    }, 300)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const buildCatalogParams = useCallback(
    ({ brand = brandFromUrl, category = selectedCategory, query = searchQuery, page = currentPage } = {}) => {
      const params = new URLSearchParams()
      if (!brandFromPath && brand) params.set('brand', brand)
      if (category && category !== 'all') params.set('category', category)
      if (query) params.set('q', query)
      if (page > 1) params.set('page', String(page))
      return params
    },
    [brandFromPath, brandFromUrl, currentPage, searchQuery, selectedCategory],
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

    const byBrand = activeProducts
    const byType = selectedType === 'all' ? byBrand : byBrand.filter((p) => p.productType === selectedType)
    const byCategory =
      selectedCategory === 'all'
        ? byType
        : byType.filter((p) => p.category === selectedCategory)

    let result

    if (!hasSearch) {
      result = byCategory.filter(priceFilter)
    } else {
      const searchPool =
        selectedCategory === 'all'
          ? activeProducts
          : activeProducts.filter((p) => p.category === selectedCategory)

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
  }, [searchQuery, selectedCategory, brandFromUrl, priceMin, priceMax, sortOrder, selectedType, activeProducts])

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const activePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  const activeFiltersCount = [
    priceMin !== '',
    priceMax !== '',
    sortOrder !== 'default',
    selectedType !== 'all',
  ].filter(Boolean).length

  const resetAllFilters = () => {
    setPriceMin('')
    setPriceMax('')
    setSortOrder('default')
    setSelectedType('all')
    updateCatalogParams({ page: 1 })
  }

  const formatPrice = (product) => {
    const num = product.eurPrice !== null && product.eurPrice !== undefined
      ? Math.round(product.eurPrice * eurRate)
      : (typeof product.price === 'number' ? product.price : Number(product.price))
    if (!Number.isFinite(num) || num <= 0) return 'Ціна за запитом'
    const prefix = product.priceVariants?.length > 1 ? 'від ' : ''
    return `${prefix}${num.toLocaleString('uk-UA')} грн`
  }

  return (
    <section className="products">
      <Seo
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalPath={seoCanonical}
        noindex={Boolean(searchQuery)}
      />
      <div className="container">
        <h1 className="section-title">{catalogHeading}</h1>

        <div className="products-search">
          <input
            className="products-search-input"
            type="search"
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
            {brandFromUrl === 'oikos' && (
              <div className="filter-group">
                <span className="filter-group-label">Тип продукту:</span>
                <div className="sort-options">
                  {[
                    { value: 'all', label: 'Усі' },
                    { value: 'paint', label: 'Фарби' },
                    { value: 'primer', label: 'Ґрунтівки' },
                    { value: 'varnish', label: 'Лаки та захист' },
                    { value: 'wax', label: 'Воски' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      className={`sort-btn ${selectedType === value ? 'active' : ''}`}
                      onClick={() => { setSelectedType(value); updateCatalogParams({ page: 1 }) }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
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

        {oracLoading && (
          <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Завантаження каталогу…
          </div>
        )}

        {!oracLoading && (() => {
          const remainder = paginatedProducts.length % colCount
          const placeholderCount = remainder > 0 ? colCount - remainder : 0
          return (
            <div className={`products-grid ${usesOracGrid ? 'orac-products-grid' : ''}`}>
              {paginatedProducts.map((product) => (
                <div key={product.id} className="product-card">
                  <Link
                    to={{
                      pathname: `/products/${encodeURIComponent(product.id)}/`,
                    }}
                    state={{
                      returnTo: {
                        pathname: catalogBasePath,
                        search: getCatalogSearch(),
                      },
                    }}
                    className={`product-swatch ${product.brand === 'orac-decor' ? 'orac-swatch' : ''}`}
                  >
                    <LazyImage
                      className="swatch-color"
                      src={product.image}
                      alt={product.title}
                    />
                    <div className="product-badges">
                      {product.eco && <span className="product-eco-badge">Еко</span>}
                    </div>
                  </Link>
                  <div className="product-info">
                    <h3 className="product-name">{product.title}</h3>
                    <p className="product-sub">{product.subcategory || product.category}</p>
                    {product.effect && (
                      <p className="product-effect">
                        <strong>Ефект:</strong> {product.effect}
                      </p>
                    )}
                    <div className="product-footer">
                      <span className={`product-price${product.price > 0 ? '' : ' product-price--request'}`}>{formatPrice(product)}</span>
                      <div className="product-actions">
                        {product.price > 0 && (
                        <button
                          type="button"
                          className="add-btn add-btn-primary"
                          onClick={() => addItem(product, product.priceVariants?.[0] ?? null, 1)}
                        >
                          В кошик
                        </button>
                        )}
                        <Link
                          to={{
                            pathname: `/products/${encodeURIComponent(product.id)}/`,
                          }}
                          state={{
                            returnTo: {
                              pathname: catalogBasePath,
                              search: getCatalogSearch(),
                            },
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

        {selectedCategory === 'all' && !searchQuery && (
          <div className="catalog-seo-text">
            {brandFromUrl === 'oikos' ? (
              <>
                <h2>Купити декоративну фарбу OIKOS у Києві</h2>
                <p>
                  Гільдія Декора — офіційний дилер <strong>OIKOS</strong> в Україні. У нас ви можете купити декоративну фарбу, венеціанську штукатурку, мікроцемент і ґрунтівки OIKOS за актуальними цінами. Понад 840 відтінків у системі колерування.
                </p>

                <h3>Продаж і нанесення фарби OIKOS — в одному місці</h3>
                <p>
                  Ми не тільки продаємо матеріали — ми їх наносимо. Гільдія Декора є <strong>сертифікованим аплікатором OIKOS</strong>, що означає: наші майстри пройшли навчання безпосередньо у виробника і гарантують якість нанесення. Замовити фарбування стін, нанесення венеціанської штукатурки або мікроцементу у Києві — просто зателефонуйте нам.
                </p>

                <h3>Які фарби підійдуть для вашого завдання?</h3>
                <p>
                  <strong>Акрилові фарби</strong> (Supercolor, Sterylpaint, Ultrasaten) — для фарбування стін і стелі у квартирі, офісі або будинку. Миються, безпечні, без запаху.
                  <br />
                  <strong>Декоративні штукатурки</strong> (Veneziano, Marmorino, Ottocento, Chalk) — для створення ефекту мармуру, крейди, оксамиту або металіку на стінах.
                  <br />
                  <strong>Мікроцемент</strong> (Microbase) — сучасне безшовне покриття для стін, підлоги та меблів. Стійке до вологи і зносу.
                  <br />
                  <strong>Фасадні фарби</strong> (Silossato, Silarlat) — захист зовнішніх стін від вологи, UV та морозу.
                </p>

                <p>
                  Консультація — безкоштовно. Телефонуйте: <a href="tel:+380675039352">+38 (067) 503-93-52</a>
                </p>
              </>
            ) : (
              <>
                <h2>Купити ліпнину ORAC DECOR у Києві</h2>
                <p>
                  Гільдія Декора — офіційний дилер <strong>ORAC DECOR</strong> в Україні. У нас ви знайдете повний асортимент поліуретанової ліпнини: карнизи, молдинги, стінові панелі, розетки, пілястри та декоративні елементи для будь-якого стилю інтер'єру.
                </p>

                <h3>Чому ORAC DECOR краще за гіпс?</h3>
                <p>
                  Ліпнина ORAC DECOR виготовлена з матеріалу <strong>Purotouch</strong> — легкого поліуретану, який у 3–5 разів легший за гіпс. Вона не б'ється, не боїться вологи, не жовтіє і легко фарбується у будь-який колір. Монтаж займає вдвічі менше часу — елементи кріпляться на клей або цвяхи.
                </p>

                <h3>Що є в нашому каталозі ORAC DECOR?</h3>
                <p>
                  <strong>Карнизи та плінтуси</strong> — від мінімалістичних до класичних профілів для будь-якого стилю.
                  <br />
                  <strong>Молдинги та рамки</strong> — для зонування стін, обрамлення панелей та декоративних ніш.
                  <br />
                  <strong>Стінові панелі та пілястри</strong> — готові рішення для класичного або сучасного інтер'єру.
                  <br />
                  <strong>Розетки та декоративні елементи</strong> — акценти для стель і стін.
                </p>

                <p>
                  Консультація та підбір елементів — безкоштовно. Телефонуйте: <a href="tel:+380675039352">+38 (067) 503-93-52</a>
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
