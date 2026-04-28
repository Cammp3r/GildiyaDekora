import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import logo from '../logos/logo-transparent.png'
import { useCart } from '../cart/CartContext.jsx'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { totalDistinctItems } = useCart()

  const closeMobileMenu = () => setMobileMenuOpen(false)

  const navItems = [
    { label: 'Про нас', path: '/' },
    { label: 'Продукти', path: '/products' },
    { label: 'Галерея', path: '/gallery' },
    { label: 'Контакти', path: '/contact' },
    {
      label: totalDistinctItems > 0 ? `Кошик (${totalDistinctItems})` : 'Кошик',
      path: '/cart',
    },
  ]

  return (
    <header className="header">
      <div className="header-content">
        <NavLink to="/" className="logo" onClick={closeMobileMenu}>
          <img src={logo} alt="Гільдія Декору" />
          <div className="logo-text">
            <span className="logo-main">GILDIYA</span>
            <span className="logo-sub">DEKORA</span>
          </div>
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
        <div className="nav-right">
          <a href="#search">Пошук</a>

        </div>
        <button
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          ☰
        </button>
      </div>
    </header>
  )
}
