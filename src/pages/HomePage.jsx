import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import officePhoto from '../../photos/insget.net_instagram_69e885b88b3ac.jpg'
import { Seo } from '../seo/Seo.jsx'

export default function HomePage() {
  const location = useLocation()

  useEffect(() => {
    if (location.state?.scrollToAbout) {
      setTimeout(() => {
        document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
      }, 80)
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }
  }, [location.state])

  return (
    <>
      <Seo
        title="Фарби OIKOS та ліпнина ORAC DECOR у Києві"
        description="Офіційний дилер OIKOS і ORAC DECOR у Києві. Декоративні фарби, венеціанська штукатурка, мікроцемент і ліпнина. Продаємо та наносимо. Консультація безкоштовно — зателефонуйте!"
        canonicalPath="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          '@id': 'https://gihldihja-decora.ua/#business',
          name: 'Гільдія Декора',
          description: 'Офіційний дилер OIKOS в Україні. Продаж та нанесення декоративних фарб, венеціанської штукатурки, мікроцементу OIKOS та ліпнини ORAC DECOR у Києві.',
          url: 'https://gihldihja-decora.ua',
          telephone: '+380675039352',
          email: 'gildiya@meta.ua',
          image: 'https://gihldihja-decora.ua/logo-transparent.png',
          priceRange: '₴₴₴',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'вул. Сергія Гусовського 12/7, оф. 10',
            addressLocality: 'Київ',
            addressCountry: 'UA',
            postalCode: '04050',
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: 50.4501,
            longitude: 30.5234,
          },
          openingHoursSpecification: [
            {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              opens: '09:00',
              closes: '18:00',
            },
          ],
          sameAs: [
            'https://www.facebook.com/GildiyaDecora/',
            'https://www.instagram.com/gildiya_decora/',
          ],
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Декоративні матеріали OIKOS та ORAC DECOR',
            itemListElement: [
              { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Продаж декоративних фарб OIKOS' } },
              { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Нанесення декоративної штукатурки' } },
              { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Продаж ліпнини ORAC DECOR' } },
              { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Консультація з підбору матеріалів' } },
            ],
          },
        }}
      />
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-left">
          <p className="hero-tag">Гільдія Декора · Офіційний дилер <span className="hero-accent">OIKOS</span> в Україні</p>
          <h1>Декоративні фарби <em>OIKOS</em><br />та ліпнина <span className="hero-accent">ORAC DECOR</span> у Києві</h1>
          <p className="hero-desc"><span className="hero-accent">Продаємо</span> та <span className="hero-accent">наносимо</span> декоративні фарби, венеціанську штукатурку і мікроцемент OIKOS. Офіційний дистриб'ютор в Україні — 840+ відтінків, сертифіковані матеріали, консультація.</p>
          <Link to="/products" className="btn-primary">Переглянути каталог →</Link>
          <Link to="/contact" className="btn-secondary">Замовити консультацію</Link>
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
      <section className="about" id="about">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>О компанії "Гільдія Декора"</h2>
              <p>
                Ми є офіційним дилером італійської компанії <strong>OIKOS</strong> в Україні.
                Протягом років ми забезпечуємо продаж та нанесення
                декоративних матеріалів найвищої якості для внутрішніх та зовнішніх робіт.
                OIKOS — світовий лідер у виробництві декоративних фарб і штукатурок,
                представлений у понад 80 країнах світу.
              </p>
              <p>
                Окрім фарб, ми є офіційними дилерами <strong>ORAC DECOR</strong> — бельгійського виробника
                преміальної поліуретанової ліпнини. Карнизи, молдинги, стінові панелі та декоративні
                елементи ORAC DECOR дозволяють створити завершений інтер'єр — від класики до сучасного
                мінімалізму. Матеріал Purotouch легший за гіпс, не боїться вологи і легко монтується.
              </p>
              <ul className="features-list">
                <li>✓ Офіційний дилер OIKOS та ORAC DECOR</li>
                <li>✓ Продаж та нанесення фарб</li>
                <li>✓ Сертифіковані матеріали</li>
                <li>✓ Професійна консультація</li>
              </ul>
            </div>
            <div className="about-image">
              <img
                src={officePhoto}
                alt="Гільдія Декора офіс"
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
