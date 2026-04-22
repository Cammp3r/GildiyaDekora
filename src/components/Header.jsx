import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const closeMobileMenu = () => setMobileMenuOpen(false)

  const navItems = [
    { label: 'Про нас', path: '/' },
    { label: 'Продукти', path: '/products' },
    { label: 'Галерея', path: '/gallery' },
    { label: 'Контакти', path: '/contact' }
  ]

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <NavLink to="/" className="logo" onClick={closeMobileMenu}>
            <img src="" alt="Гільдія Декору" />
          </NavLink>
          <nav className={`nav ${mobileMenuOpen ? 'open' : ''}`}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => isActive ? 'active' : ''}
                onClick={closeMobileMenu}
              >
                {item.label}
              </NavLink>
            ))}
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
