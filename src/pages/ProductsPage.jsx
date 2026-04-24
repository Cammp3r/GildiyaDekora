import { useEffect } from 'react'

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
              <div className="product-swatch" style={{background: 'linear-gradient(135deg, #c8a080, #8c7b6e)'}}></div>
              <div className="product-info">
                <h3 className="product-name">Interior Paint</h3>
                <p className="product-sub">Фарби для внутрішніх робіт</p>
                <p>Різноманітні стани фінішу для створення унікальних інтер'єрів. Матові, глянцеві та напівглянцеві покриття.</p>
                <a href="#contact" className="product-link">
                  Дізнатись більше →
                </a>
              </div>
            </div>
            <div className="product-card">
              <div className="product-swatch" style={{background: 'linear-gradient(135deg, #8ca4b8, #5a7a94)'}}></div>
              <div className="product-info">
                <h3 className="product-name">Exterior Paint</h3>
                <p className="product-sub">Захисні фарби для фасадів</p>
                <p>Надійні покриття для екстер'єрних поверхонь. Висока стійкість до атмосферних впливів та УФ-променів.</p>
                <a href="#contact" className="product-link">
                  Дізнатись більше →
                </a>
              </div>
            </div>
            <div className="product-card">
              <div className="product-swatch" style={{background: 'linear-gradient(135deg, #d4b8d4, #7a4c7a)'}}></div>
              <div className="product-info">
                <h3 className="product-name">Special Effects</h3>
                <p className="product-sub">Декоративні покриття</p>
                <p>Венеційська штукатурка, мікроцемент, ефекти крейди та металік. Для творчих інтер'єрів.</p>
                <a href="#contact" className="product-link">
                  Дізнатись більше →
                </a>
              </div>
            </div>
            <div className="product-card">
              <div className="product-swatch" style={{background: 'linear-gradient(135deg, #cce4cc, #447444)'}}></div>
              <div className="product-info">
                <h3 className="product-name">Industrial Coating</h3>
                <p className="product-sub">Промислові покриття</p>
                <p>Захисні та спеціалізовані покриття для промислових застосувань та важких умов.</p>
                <a href="#contact" className="product-link">
                  Дізнатись більше →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
