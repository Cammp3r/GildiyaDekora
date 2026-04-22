import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import officePhoto from '../../photos/insget.net_instagram_69e885b88b3ac.jpg'

export default function HomePage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

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
      <section className="about">
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
              <img src={officePhoto} alt="Гільдія Декору офіс" />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
