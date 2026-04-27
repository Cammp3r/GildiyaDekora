import { Link } from 'react-router-dom'
import logo from '../logos/logo-transparent.png'

export default function Footer() {
  return (
    <footer>
      <Link to="/" className="logo" style={{ color: '#f5f0e8' }}>
        <img src={logo} alt="Гільдія Декору" />
        <div className="logo-text" style={{ color: '#f5f0e8' }}>
          <span className="logo-main">GILDIYA</span>
          <span className="logo-sub">DEKORA</span>
        </div>
      </Link>
      <p className="footer-desc">
        Офіційний дилер итальянської компанії OIKOS в Україні. Забезпечуємо професіональні та побутові матеріали найвищої якості.
      </p>

      <div className="footer-col">
        <h4>Навігація</h4>
        <ul>
          <li><Link to="/" style={{color: "orange"}} >Про нас</Link></li>
          <li><Link to="/products" style={{color: "orange"}}>Продукти</Link></li>
          <li><Link to="/gallery" style={{color: "orange"}}>Галерея</Link></li>
          <li><Link to="/contact" style={{color: "orange"}}>Контакти</Link></li>
        </ul>
      </div>

      <div className="footer-col">
        <h4>Соціальні мережі</h4>
        <ul>
          <li><a href="https://www.facebook.com/GildiyaDecora/" target="_blank" rel="noreferrer" style={{color: "orange"}}>Facebook</a></li>
          <li><a href="https://www.instagram.com/gildiya_decora/" target="_blank" rel="noreferrer" style={{color: "orange"}}>Instagram</a></li>
        </ul>
      </div>

      <div className="footer-col">
        <h4>Контакти</h4>
        <ul>
          <li><a href="tel:+380675039352" style={{color: "orange"}}>+38 (067) 503-93-52</a></li>
          <li><a href="https://maps.app.goo.gl/dRX4TLoQzrdfMqeS9" target="_blank" rel="noreferrer" style={{color: "orange"}}>м. Київ, вул. Гусовського 12/7</a></li>
        </ul>
      </div>

      <div className="footer-bottom">
        <span>&copy; 2026 Гільдія Декору</span>
        <span>Офіційний дилер OIKOS · Всі права захищені</span>
      </div>
    </footer>
  )
}
