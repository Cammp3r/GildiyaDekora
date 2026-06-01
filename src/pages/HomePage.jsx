import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import officePhoto from '../../photos/insget.net_instagram_69e885b88b3ac.jpg'
import { Seo } from '../seo/Seo.jsx'

export default function HomePage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  return (
    <>
      <Seo
        title="OIKOS та ORAC DECOR у Києві"
        description="Гільдія Декору: офіційний дилер OIKOS, декоративні фарби, штукатурки, мікроцемент, ліпнина ORAC DECOR та професійна консультація у Києві."
        canonicalPath="/"
      />
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-left">
          <p className="hero-tag">Гільдія Декору · Офіційний дилер OIKOS</p>
          <h1>Матеріали<br />які <em>трансформують</em><br />інтер'єри</h1>
          <p className="hero-desc">Офіційна лінійка продуктів OIKOS з 1984 року. Професійні та побутові матеріали найвищої якості для внутрішніх та зовнішніх робіт.</p>
          <Link to="/products" className="btn-primary">Переглянути каталог →</Link>
          <a href="#contact" className="btn-secondary">Замовити консультацію</a>
        </div>
        <div className="hero-right">
          <div className="color-wall">
            <div className="color-swatch" style={{background:'#d4c4b8'}}></div>
            <div className="color-swatch" style={{background:'#b8a898'}}></div>
            <div className="color-swatch" style={{background:'#8c7b6e'}}></div>
            <div className="color-swatch" style={{background:'#c4703a'}}></div>
            <div className="color-swatch" style={{background:'#e8d4c4'}}></div>
            <div className="color-swatch" style={{background:'#a8c4b4'}}></div>
            <div className="color-swatch" style={{background:'#7a9e8e'}}></div>
            <div className="color-swatch" style={{background:'#4e7a6a'}}></div>
            <div className="color-swatch" style={{background:'#7a5c8a'}}></div>
            <div className="color-swatch" style={{background:'#d4e8d4'}}></div>
            <div className="color-swatch" style={{background:'#e8c4a0'}}></div>
            <div className="color-swatch" style={{background:'#c8a080'}}></div>
            <div className="color-swatch" style={{background:'#a87c5a'}}></div>
            <div className="color-swatch" style={{background:'#885c3a'}}></div>
            <div className="color-swatch" style={{background:'#c4d4e4'}}></div>
            <div className="color-swatch" style={{background:'#8ca4b8'}}></div>
            <div className="color-swatch" style={{background:'#5a7a94'}}></div>
            <div className="color-swatch" style={{background:'#2a4a64'}}></div>
            <div className="color-swatch" style={{background:'#e4c4c4'}}></div>
            <div className="color-swatch" style={{background:'#c49a9a'}}></div>
            <div className="color-swatch" style={{background:'#e8e4d4'}}></div>
            <div className="color-swatch" style={{background:'#d4ceb8'}}></div>
            <div className="color-swatch" style={{background:'#b8b09a'}}></div>
            <div className="color-swatch" style={{background:'#1a1714'}}></div>
            <div className="color-swatch" style={{background:'#f5f0e8'}}></div>
            <div className="color-swatch" style={{background:'#eae0cc'}}></div>
            <div className="color-swatch" style={{background:'#d4c8a8'}}></div>
            <div className="color-swatch" style={{background:'#b8a880'}}></div>
            <div className="color-swatch" style={{background:'#9c8858'}}></div>
            <div className="color-swatch" style={{background:'#7c6840'}}></div>
            <div className="color-swatch" style={{background:'#cce4cc'}}></div>
            <div className="color-swatch" style={{background:'#aac8aa'}}></div>
            <div className="color-swatch" style={{background:'#88ac88'}}></div>
            <div className="color-swatch" style={{background:'#669066'}}></div>
            <div className="color-swatch" style={{background:'#447444'}}></div>
            <div className="color-swatch" style={{background:'#d4b8d4'}}></div>
            <div className="color-swatch" style={{background:'#b894b8'}}></div>
            <div className="color-swatch" style={{background:'#9c709c'}}></div>
            <div className="color-swatch" style={{background:'#7a4c7a'}}></div>
            <div className="color-swatch" style={{background:'#582858'}}></div>
          </div>
          <div className="hero-badge">
            
            <div className="badge-num">840+</div>
            <div className="badge-label">відтінків у каталозі</div>
            
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="marquee-bar">
        <div className="marquee-inner">
          <span>Декоративні фарби</span><span className="dot">·</span>
          <span>Венеційська штукатурка</span><span className="dot">·</span>
          <span>Мікроцемент</span><span className="dot">·</span>
          <span>Ефект крейди</span><span className="dot">·</span>
          <span>Металік</span><span className="dot">·</span>
          <span>Перламутр</span><span className="dot">·</span>
          <span>Рельєфні покриття</span><span className="dot">·</span>
          <span>Матові текстури</span><span className="dot">·</span>
          <span>Декоративні фарби</span><span className="dot">·</span>
          <span>Венеційська штукатурка</span><span className="dot">·</span>
          <span>Мікроцемент</span><span className="dot">·</span>
          <span>Ефект крейди</span><span className="dot">·</span>
          <span>Металік</span><span className="dot">·</span>
          <span>Перламутр</span><span className="dot">·</span>
          <span>Рельєфні покриття</span><span className="dot">·</span>
          <span>Матові текстури</span><span className="dot">·</span>
        </div>
      </div>

      {/* About Section */}
      <section className="about">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>О компанії "Гільдія Декору"</h2>
              <p>
                Ми є офіційним дилером італійської компанії OIKOS в Україні.
                Протягом років ми забезпечуємо продаж та нанесення
                матеріалів найвищої якості для внутрішніх та зовнішніх робіт.
              </p>
              <p>
                OIKOS - це світовий лідер у виробництві фарб і лаків, який
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
              <img
                src={officePhoto}
                alt="Гільдія Декору офіс"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
