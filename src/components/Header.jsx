import { useState } from 'react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <h1>Гільдія Декору</h1>
            <p className="tagline">Офіційний дилер OIKOS</p>
          </div>
          <nav className={`nav ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#about">Про нас</a>
            <a href="#products">Продукти</a>
            <a href="#benefits">Переваги</a>
            <a href="#contact">Контакти</a>
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
