import { useState } from 'react'
import './App.css'

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <h1>Гільдія Декору</h1>
              <p className="tagline">Офіційний дилер OIKOS</p>
            </div>
            <nav className={`nav ${mobileMenuOpen ? 'open' : ''}`}>
              <a href="#about">Про нас</a>
              <a href="#products">Продукти</a>
              <a href="#benefits">Переваги</a>
              <a href="#contact">Контакти</a>
            </nav>
            <button 
              className="mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h2>Найкращі матеріали для вашого дому</h2>
          <p>Офіційна лінійка продуктів OIKOS з 1984 року</p>
          <button className="cta-button">Переглянути каталог</button>
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
                Протягом років ми забезпечуємо професіональні та побутові матеріали 
                найвищої якості для внутрішніх та зовнішніх робіт.
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
              <a href="#" className="product-link">Дізнатись більше →</a>
            </div>
            <div className="product-card">
              <div className="product-icon">🏗️</div>
              <h3>Exterior Paint</h3>
              <p>Захисні фарби для фасадів та екстер'єрних поверхонь</p>
              <a href="#" className="product-link">Дізнатись більше →</a>
            </div>
            <div className="product-card">
              <div className="product-icon">✨</div>
              <h3>Special Effects</h3>
              <p>Декоративні покриття та спеціальні ефекти</p>
              <a href="#" className="product-link">Дізнатись більше →</a>
            </div>
            <div className="product-card">
              <div className="product-icon">🛡️</div>
              <h3>Industrial Coating</h3>
              <p>Промислові та захисні покриття</p>
              <a href="#" className="product-link">Дізнатись більше →</a>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="benefits">
        <div className="container">
          <h2 className="section-title">Чому обирають OIKOS?</h2>
          <div className="benefits-grid">
            <div className="benefit-item">
              <h3>🌱 Екологічність</h3>
              <p>Екологічні матеріали, безпечні для здоров'я</p>
            </div>
            <div className="benefit-item">
              <h3>⏱️ Довговічність</h3>
              <p>Тривалий термін служби до 20+ років</p>
            </div>
            <div className="benefit-item">
              <h3>🎨 Колірна гама</h3>
              <p>Понад 3000 кольорів на вибір</p>
            </div>
            <div className="benefit-item">
              <h3>💪 Якість</h3>
              <p>Світові стандарти якості ISO</p>
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
                <p>м. Київ, Україна</p>
              </div>
              <div className="contact-item">
                <h3>📞 Телефон</h3>
                <p>+38 (0) XX XXX-XX-XX</p>
              </div>
              <div className="contact-item">
                <h3>📧 Email</h3>
                <p>info@hildiyadekoru.ua</p>
              </div>
              <div className="contact-item">
                <h3>🕐 Час роботи</h3>
                <p>Пн-Пт: 09:00 - 18:00<br/>Сб: 10:00 - 16:00</p>
              </div>
            </div>
            <form className="contact-form">
              <input type="text" placeholder="Ваше ім'я" required />
              <input type="email" placeholder="Ваша email" required />
              <textarea placeholder="Ваше повідомлення" rows="5" required></textarea>
              <button type="submit" className="submit-button">Надіслати</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Гільдія Декору</h4>
              <p>Офіційний дилер OIKOS в Україні</p>
            </div>
            <div className="footer-section">
              <h4>Навігація</h4>
              <ul>
                <li><a href="#about">Про нас</a></li>
                <li><a href="#products">Продукти</a></li>
                <li><a href="#contact">Контакти</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Соціальні мережі</h4>
              <ul>
                <li><a href="https://www.facebook.com/GildiyaDecora/" target="_blank">Facebook</a></li>
                <li><a href="https://www.instagram.com/gildiya_decora/" target="_blank">Instagram</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Гільдія Декору. Офіційний дилер OIKOS. Всі права захищені.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
