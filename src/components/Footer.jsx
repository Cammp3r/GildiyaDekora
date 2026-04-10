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
                <a href="#about">Про нас</a>
              </li>
              <li>
                <a href="#products">Продукти</a>
              </li>
              <li>
                <a href="#contact">Контакти</a>
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
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/gildiya_decora/"
                  target="_blank"
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
