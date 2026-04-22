import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function HomePage({ scrollToId }) {
  useEffect(() => {
    if (!scrollToId) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      return
    }

    const element = document.getElementById(scrollToId)
    if (!element) return

    // Defer to ensure layout is painted before scrolling
    setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }, [scrollToId])

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h2>Найкращі матеріали для вашого дому</h2>
          <p>Офіційна лінійка продуктів OIKOS з 1984 року</p>
          <Link to="/products" className="cta-button">
            Переглянути каталог
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>О компанії "Гільдія Декору"</h2>
              <p>
                Ми є офіційним дилером итальянської компанії OIKOS в Україні.
                Протягом років ми забезпечуємо професіональні та побутові
                матеріали найвищої якості для внутрішніх та зовнішніх робіт.
              </p>
              <p>
                OIKOS - це світовий лідер у виробництві фарб і лаків, яка
                поставляє матеріали до більш ніж 80 країн світу.
              </p>
              <ul className="features-list">
                <li>✓ Офіційний дилер OIKOS</li>
                <li>✓ Сертифіковані матеріали</li>
                <li>✓ Професійна консультація</li>
                <li>✓ Гарантія якості</li>
              </ul>
            </div>
            <div className="about-image">
              <div className="image-placeholder">
                <span>Фото перед офісом</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="products">
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

      {/* Gallery Section */}
      <section id="gallery" className="gallery">
        <div className="container">
          <h2 className="section-title">Галерея наших об'єктів</h2>
          <div className="gallery-grid">
            <div className="gallery-item">
              <div className="gallery-image-placeholder">
                <span>Фото об'єкту 1</span>
              </div>
            </div>
            <div className="gallery-item">
              <div className="gallery-image-placeholder">
                <span>Фото об'єкту 2</span>
              </div>
            </div>
            <div className="gallery-item">
              <div className="gallery-image-placeholder">
                <span>Фото об'єкту 3</span>
              </div>
            </div>
            <div className="gallery-item">
              <div className="gallery-image-placeholder">
                <span>Фото об'єкту 4</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="container">
          <h2 className="section-title">Зв'яжіться з нами</h2>
          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <h3>📍 Адреса</h3>
                <p><a href="https://maps.app.goo.gl/dRX4TLoQzrdfMqeS9">м. Київ, вул.Сергія Гусовського 12/7, оф.10</a></p>
              </div>
              <div className="contact-item">
                <h3>📞 Телефон</h3>
                <p>+38 (067) 503-93-52</p>
              </div>
              <div className="contact-item">
                <h3>🕐 Час роботи</h3>
                <p>
                  Пн-Пт: 09:00 - 18:00<br />
                  Сб: 10:00 - 16:00
                </p>
              </div>
            </div>
            <form className="contact-form">
              <input type="text" placeholder="Ваше ім'я" required />
              <input type="email" placeholder="Ваша email" required />
              <textarea
                placeholder="Ваше повідомлення"
                rows="5"
                required
              ></textarea>
              <button type="submit" className="submit-button">
                Надіслати
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
