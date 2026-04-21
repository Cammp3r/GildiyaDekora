import { useState } from 'react'
import { NavLink } from 'react-router-dom'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <h1>Гільдія Декору</h1>
            <p className="tagline">Офіційний дилер OIKOS</p>
          </div>
          <nav className={`nav ${mobileMenuOpen ? 'open' : ''}`}>
            <NavLink to="/about" onClick={closeMobileMenu}>
              Про нас
            </NavLink>
            <NavLink to="/products" onClick={closeMobileMenu}>
              Продукти
            </NavLink>
            <NavLink to="/benefits" onClick={closeMobileMenu}>
              Переваги
            </NavLink>
            <NavLink to="/contact" onClick={closeMobileMenu}>
              Контакти
            </NavLink>
          </nav>
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
        </div>
      </div>
    </header>
  )
}
