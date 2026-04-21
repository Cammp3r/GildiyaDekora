import { Link } from 'react-router-dom'

export default function Footer() {
  return (
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
              <li>
                <Link to="/about">Про нас</Link>
              </li>
              <li>
                <Link to="/products">Продукти</Link>
              </li>
              <li>
                <Link to="/contact">Контакти</Link>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Соціальні мережі</h4>
            <ul>
              <li>
                <a
                  href="https://www.facebook.com/GildiyaDecora/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/gildiya_decora/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            &copy; 2026 Гільдія Декору. Офіційний дилер OIKOS. Всі права захищені.
          </p>
        </div>
      </div>
    </footer>
  )
}
