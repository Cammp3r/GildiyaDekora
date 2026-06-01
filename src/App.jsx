import './App.css'
import { Suspense, lazy } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'

const ProductsPage = lazy(() => import('./pages/ProductsPage.jsx'))
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage.jsx'))
const GalleryPage = lazy(() => import('./pages/GalleryPage.jsx'))
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'))
const CartPage = lazy(() => import('./pages/CartPage.jsx'))
const OrderPage = lazy(() => import('./pages/OrderPage.jsx'))
// payment pages removed (will be reimplemented later)

function App() {
  return (
    <div className="App">
      {/* Header */}
      <Header />

      <Suspense
        fallback={
          <div className="container" style={{ padding: '4rem 0' }}>
            Завантаження…
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/order" element={<OrderPage />} />
          {/* Checkout and payment routes temporarily removed */}
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Scroll to Top Button */}
      <ScrollToTop />

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default App
