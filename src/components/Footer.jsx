import { Link } from 'react-router-dom'
import logo from '../logos/logo-transparent.png'

export default function Footer() {
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
          <li><Link to="/" style={{color: "orange"}} >Про нас</Link></li>
          <li><Link to="/products" style={{color: "orange"}}>Продукти</Link></li>
          <li><Link to="/gallery" style={{color: "orange"}}>Галерея</Link></li>
          <li><Link to="/contact" style={{color: "orange"}}>Контакти</Link></li>
        </ul>
      </div>

      <div className="footer-col">
        <h4>Категорії фарб</h4>
        <ul>
          <li><Link to="/farba-dlya-stin" style={{color: "orange"}}>Фарба для стін</Link></li>
          <li><Link to="/fasadna-farba" style={{color: "orange"}}>Фасадна фарба</Link></li>
          <li><Link to="/intererna-farba" style={{color: "orange"}}>Інтер'єрна фарба</Link></li>
          <li><Link to="/akrylova-farba" style={{color: "orange"}}>Акрилова фарба</Link></li>
          <li><Link to="/gruntivka" style={{color: "orange"}}>Ґрунтівка</Link></li>
          <li><Link to="/lak-dlya-dereva" style={{color: "orange"}}>Лак для дерева</Link></li>
          <li><Link to="/koleruvannya" style={{color: "orange"}}>Колерування фарби</Link></li>
        </ul>
      </div>

      <div className="footer-col">
        <h4>Київ</h4>
        <ul>
          <li><Link to="/kupit-farbu-kyiv" style={{color: "orange"}}>Купити фарбу Київ</Link></li>
          <li><Link to="/magazyn-farb-kyiv" style={{color: "orange"}}>Магазин фарб Київ</Link></li>
          <li><Link to="/fasadna-farba-kyiv" style={{color: "orange"}}>Фасадна фарба Київ</Link></li>
          <li><Link to="/koleruvannya-kyiv" style={{color: "orange"}}>Колерування фарб Київ</Link></li>
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
          <li><a href="mailto:gildiya@meta.ua" style={{color: "orange"}}>gildiya@meta.ua</a></li>
        </ul>
      </div>

      <div className="footer-bottom">
        <span>&copy; 2026 Гільдія Декора · Офіційний дилер OIKOS · Всі права захищені</span>
      </div>
    </footer>
  )
}
