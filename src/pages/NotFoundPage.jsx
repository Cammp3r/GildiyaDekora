import { Link } from 'react-router-dom'
import { Seo } from '../seo/Seo.jsx'

export default function NotFoundPage() {
  return (
    <>
      <Seo
        title="Сторінку не знайдено"
        description="Сторінка не існує або була переміщена."
        noindex
      />
      <section style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1rem' }}>
            Помилка 404
          </p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 400, color: 'var(--ink)', marginBottom: '1rem', lineHeight: 1.1 }}>
            Сторінку не знайдено
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Можливо, посилання застаріло або сторінка була переміщена.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn-primary">На головну</Link>
            <Link to="/products" className="btn-secondary">До каталогу</Link>
          </div>
        </div>
      </section>
    </>
  )
}
