import { useState } from 'react'
import { NavLink, useSearchParams } from 'react-router-dom'
import logo from '../logos/logo-transparent.png'
import { useCart } from '../cart/CartContext.jsx'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { totalDistinctItems } = useCart()
  const [searchParams] = useSearchParams()

  const closeMobileMenu = () => setMobileMenuOpen(false)

  const navItems = [
    { label: 'Про нас', path: '/' },
    { label: 'Продукти', path: '/products', hasDropdown: true },
    { label: 'Галерея', path: '/gallery' },
    { label: 'Контакти', path: '/contact' },
    {
      label: totalDistinctItems > 0 ? `Кошик (${totalDistinctItems})` : 'Кошик',
      path: '/cart',
    },
  ]

  const productBrands = [
    { label: 'OIKOS', brand: 'oikos' },
    { label: 'ORAC DECOR', brand: 'orac-decor' },
  ]

  return (
    <header className="header">
      <div className="header-content">
        <NavLink to="/" className="logo" onClick={closeMobileMenu}>
          <img src={logo} alt="Гільдія Декора" />
          <div className="logo-text">
            <span className="logo-main">Гільдія</span>
            <span className="logo-sub">Декора</span>
          </div>
        </NavLink>
        <nav className={`nav ${mobileMenuOpen ? 'open' : ''}`}>
          {navItems.map((item) => (
            <div
              key={`${item.path}-${item.label}`}
              className={`nav-item ${item.hasDropdown ? 'has-dropdown' : ''}`}
              onMouseEnter={() => item.hasDropdown && setDropdownOpen(true)}
              onMouseLeave={() => item.hasDropdown && setDropdownOpen(false)}
            >
              {item.hasDropdown ? (
                <>
                  <button
                    className="nav-link dropdown-toggle"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    {item.label}
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  <div className={`dropdown-menu ${dropdownOpen ? 'open' : ''}`}>
                    {productBrands.map((brand) => (
                      <NavLink
                        key={brand.brand}
                        to={`/products?brand=${brand.brand}`}
                        className={() =>
                          searchParams.get('brand') === brand.brand
                            ? 'dropdown-item active'
                            : 'dropdown-item'
                        }
                        onClick={() => {
                          setDropdownOpen(false)
                          closeMobileMenu()
                        }}
                      >
                        {brand.label}
                      </NavLink>
                    ))}
                  </div>
                </>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) => isActive ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  {item.label}
                </NavLink>
              )}
            </div>
          ))}
        </nav>
        <button
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Відкрити меню"
        >
          ☰
        </button>
      </div>
    </header>
  )
}
