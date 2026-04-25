import { useEffect } from 'react'
import { productsDb } from '../data/products.js'

export default function ProductsPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  const formatPrice = (price) => `${price.toLocaleString('uk-UA')} грн`

  return (
    <>
      {/* Products Section */}
      <section className="products">
        <div className="container">
          <h2 className="section-title">Лінійки продуктів OIKOS</h2>
          <div className="products-grid">
            {productsDb.map((product) => (
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
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.title}</h3>
                  <p>{product.description}</p>
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
        </div>
      </section>
    </>
  )
}
