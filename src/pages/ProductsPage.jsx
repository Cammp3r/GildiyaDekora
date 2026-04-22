import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function ProductsPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  return (
    <>
      {/* Products Section */}
      <section className="products">
        <div className="container">
          <h2 className="section-title">Лінійки продуктів OIKOS</h2>
          <div className="products-grid">
            <div className="product-card">
              <div className="product-icon">🏠</div>
              <h3>Interior Paint</h3>
              <p>Фарби для внутрішніх робіт з різними станами фінішу</p>
              <Link to="/products" className="product-link">
                Дізнатись більше →
              </Link>
            </div>
            <div className="product-card">
              <div className="product-icon">🏗️</div>
              <h3>Exterior Paint</h3>
              <p>Захисні фарби для фасадів та екстер'єрних поверхонь</p>
              <Link to="/products" className="product-link">
                Дізнатись більше →
              </Link>
            </div>
            <div className="product-card">
              <div className="product-icon">✨</div>
              <h3>Special Effects</h3>
              <p>Декоративні покриття та спеціальні ефекти</p>
              <Link to="/products" className="product-link">
                Дізнатись більше →
              </Link>
            </div>
            <div className="product-card">
              <div className="product-icon">🛡️</div>
              <h3>Industrial Coating</h3>
              <p>Промислові та захисні покриття</p>
              <Link to="/products" className="product-link">
                Дізнатись більше →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
