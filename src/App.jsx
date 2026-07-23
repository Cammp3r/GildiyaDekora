import './App.css'
import { Suspense, lazy } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

const ProductsPage = lazy(() => import('./pages/ProductsPage.jsx'))
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage.jsx'))
const GalleryPage = lazy(() => import('./pages/GalleryPage.jsx'))
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'))
const CartPage = lazy(() => import('./pages/CartPage.jsx'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage.jsx'))
const ReturnPolicyPage = lazy(() => import('./pages/ReturnPolicyPage.jsx'))
const NanesennyaFarbyPage = lazy(() => import('./pages/seo/NanesennyaFarbyPage.jsx'))
const KupytyLipnynyKyivPage = lazy(() => import('./pages/seo/KupytyLipnynyKyivPage.jsx'))
const KupytyFarbuOikosKyivPage = lazy(() => import('./pages/seo/KupytyFarbuOikosKyivPage.jsx'))
const OplataIDostavkaPage = lazy(() => import('./pages/seo/OplataIDostavkaPage.jsx'))

function App() {
  return (
    <div className="App">
      <Header />

      <ErrorBoundary>
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
          <Route path="/products/orac-decor" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/nanesennya-farby-kyiv" element={<NanesennyaFarbyPage />} />
          <Route path="/kupyty-lipnynu-kyiv" element={<KupytyLipnynyKyivPage />} />
          <Route path="/kupyty-farbu-oikos-kyiv" element={<KupytyFarbuOikosKyivPage />} />
          <Route path="/oplata-i-dostavka" element={<OplataIDostavkaPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/return-policy" element={<ReturnPolicyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>

      <ScrollToTop />
      <Footer />
    </div>
  )
}

export default App
