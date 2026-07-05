import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '../logos/logo-transparent.png'

export default function Footer() {
  const location = useLocation()
  const navigate = useNavigate()

  const handleAboutClick = (e) => {
    e.preventDefault()
    if (location.pathname === '/') {
      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/', { state: { scrollToAbout: true } })
    }
  }

  return (
    <footer>
      <Link to="/" className="logo" style={{ color: '#f5f0e8' }}>
        <img src={logo} alt="Гільдія Декору" />
        <div className="logo-text" style={{ color: '#f5f0e8' }}>
          <span className="logo-main">Гільдія</span>
          <span className="logo-sub">Декора</span>
        </div>
      </Link>
      <p className="footer-desc">
        Офіційний дилер італійської компанії OIKOS в Україні. Забезпечуємо продаж та нанесення матеріалів найвищої якості для внутрішніх та зовнішніх робіт.
      </p>

      <div className="footer-col">
        <h4>Навігація</h4>
        <ul>
          <li><a href="/#about" className="footer-link" onClick={handleAboutClick}>Про нас</a></li>
          <li><Link to="/products" className="footer-link">Продукти</Link></li>
          <li><Link to="/gallery" className="footer-link">Галерея</Link></li>
          <li><Link to="/contact" className="footer-link">Контакти</Link></li>
          <li><Link to="/privacy-policy" className="footer-link">Конфіденційність</Link></li>
        </ul>
      </div>

      <div className="footer-col">
        <h4>Матеріали OIKOS</h4>
        <ul>
          <li><Link to="/farba-dlya-stin" className="footer-link">Фарба для стін</Link></li>
          <li><Link to="/fasadna-farba" className="footer-link">Фасадна фарба</Link></li>
          <li><Link to="/intererna-farba" className="footer-link">Інтер'єрна фарба</Link></li>
          <li><Link to="/akrylova-farba" className="footer-link">Акрилова фарба</Link></li>
          <li><Link to="/gruntivka" className="footer-link">Ґрунтівка</Link></li>
          <li><Link to="/koleruvannya" className="footer-link">Колерування фарби</Link></li>
          <li><Link to="/nanesennya-farby-kyiv" className="footer-link">Нанесення фарби Київ</Link></li>
        </ul>
      </div>

      <div className="footer-col">
        <h4>Ліпнина ORAC DECOR</h4>
        <ul>
          <li><Link to="/kupyty-lipnynu-kyiv" className="footer-link">Купити ліпнину Київ</Link></li>
          <li><Link to="/karnyz-moldyngy-orac-decor" className="footer-link">Карнизи та молдинги</Link></li>
          <li><Link to="/products?brand=orac-decor" className="footer-link">Каталог ORAC DECOR</Link></li>
          <li><Link to="/kupit-farbu-kyiv" className="footer-link">Купити фарбу Київ</Link></li>
          <li><Link to="/magazyn-farb-kyiv" className="footer-link">Магазин фарб Київ</Link></li>
          <li><Link to="/fasadna-farba-kyiv" className="footer-link">Фасадна фарба Київ</Link></li>
          <li><Link to="/koleruvannya-kyiv" className="footer-link">Колерування фарб Київ</Link></li>
        </ul>
      </div>

      <div className="footer-col">
        <h4>Соціальні мережі</h4>
        <ul>
          <li><a href="https://www.facebook.com/GildiyaDecora/" target="_blank" rel="noreferrer" className="footer-link">Facebook</a></li>
          <li><a href="https://www.instagram.com/gildiya_decora/" target="_blank" rel="noreferrer" className="footer-link">Instagram</a></li>
        </ul>
      </div>

      <div className="footer-col">
        <h4>Контакти</h4>
        <ul>
          <li><a href="tel:+380675039352" className="footer-link">+38 (067) 503-93-52</a></li>
          <li><a href="https://maps.app.goo.gl/dRX4TLoQzrdfMqeS9" target="_blank" rel="noreferrer" className="footer-link">м. Київ, вул. Гусовського 12/7</a></li>
          <li><a href="mailto:gildiya@meta.ua" className="footer-link">gildiya@meta.ua</a></li>
        </ul>
      </div>

      <div className="footer-bottom">
        <span>&copy; 2026 Гільдія Декора · Офіційний дилер OIKOS · Всі права захищені</span>
      </div>
    </footer>
  )
}
