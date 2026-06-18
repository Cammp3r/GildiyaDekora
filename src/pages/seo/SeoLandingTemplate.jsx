import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../../seo/Seo.jsx'

export function SeoLandingPage({
  title,
  h1,
  description,
  canonicalPath,
  badge,
  intro,
  sections = [],
  productLink = '/products',
  productLinkText = 'Переглянути каталог →',
  faqs = [],
  addressBlock = false,
  jsonLd,
}) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  return (
    <>
      <Seo
        title={title}
        description={description}
        canonicalPath={canonicalPath}
        jsonLd={jsonLd}
      />
      <section className="seo-landing">
        <div className="container">
          {badge && <p className="hero-tag">{badge}</p>}
          <h1 className="section-title">{h1}</h1>
          <p className="seo-landing-intro">{intro}</p>

          <div className="seo-landing-cta">
            <Link to={productLink} className="btn-primary">
              {productLinkText}
            </Link>
            <Link to="/contact" className="btn-secondary">
              Замовити консультацію
            </Link>
          </div>

          {sections.length > 0 && (
            <div className="seo-landing-sections">
              {sections.map((section, i) => (
                <div key={i} className="seo-landing-section">
                  <h2>{section.heading}</h2>
                  <p>{section.text}</p>
                </div>
              ))}
            </div>
          )}

          {faqs.length > 0 && (
            <div className="seo-landing-faq">
              <h2>Часті запитання</h2>
              {faqs.map((faq, i) => (
                <details key={i} className="seo-faq-item">
                  <summary>{faq.q}</summary>
                  <p>{faq.a}</p>
                </details>
              ))}
            </div>
          )}

          {addressBlock && (
            <div className="seo-landing-address">
              <h2>Як нас знайти</h2>
              <p>
                <strong>Адреса:</strong>{' '}
                <a href="https://maps.app.goo.gl/dRX4TLoQzrdfMqeS9" target="_blank" rel="noreferrer noopener">
                  м. Київ, вул. Сергія Гусовського 12/7, оф.10
                </a>
                <br />
                <strong>Телефон:</strong>{' '}
                <a href="tel:+380675039352">+38 (067) 503-93-52</a>
                <br />
                <strong>Email:</strong>{' '}
                <a href="mailto:gildiya@meta.ua">gildiya@meta.ua</a>
                <br />
                <strong>Графік роботи:</strong> Пн–Пт, 09:00–18:00
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
