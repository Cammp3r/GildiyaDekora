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
// const OrderPage = lazy(() => import('./pages/OrderPage.jsx'))
// const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage.jsx'))

const FarbaStinPage = lazy(() => import('./pages/seo/FarbaStinPage.jsx'))
const FasadnaFarbaPage = lazy(() => import('./pages/seo/FasadnaFarbaPage.jsx'))
const InternernaFarbaPage = lazy(() => import('./pages/seo/InternernaFarbaPage.jsx'))
const AkrylovaFarbaPage = lazy(() => import('./pages/seo/AkrylovaFarbaPage.jsx'))
const FarbaDlaDerevaPage = lazy(() => import('./pages/seo/FarbaDlaDerevaPage.jsx'))
const GruntivkaPage = lazy(() => import('./pages/seo/GruntivkaPage.jsx'))
const LakDlaDerevaPage = lazy(() => import('./pages/seo/LakDlaDerevaPage.jsx'))
const KoleruvannyaPage = lazy(() => import('./pages/seo/KoleruvannyaPage.jsx'))
const KupytyFarbuKyivPage = lazy(() => import('./pages/seo/KupytyFarbuKyivPage.jsx'))
const MagazynFarbKyivPage = lazy(() => import('./pages/seo/MagazynFarbKyivPage.jsx'))
const FasadnaFarbaKyivPage = lazy(() => import('./pages/seo/FasadnaFarbaKyivPage.jsx'))
const KoleruvannyaKyivPage = lazy(() => import('./pages/seo/KoleruvannyaKyivPage.jsx'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage.jsx'))

function App() {
  return (
    <div className="App">
      {/* Header */}
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
          <Route path="/products/:id" element={<ProductDetailsPage />} />
          <Route path="/cart" element={<CartPage />} />
          {/* <Route path="/order" element={<OrderPage />} /> */}
          {/* <Route path="/admin/orders" element={<AdminOrdersPage />} /> */}
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/farba-dlya-stin" element={<FarbaStinPage />} />
          <Route path="/fasadna-farba" element={<FasadnaFarbaPage />} />
          <Route path="/intererna-farba" element={<InternernaFarbaPage />} />
          <Route path="/akrylova-farba" element={<AkrylovaFarbaPage />} />
          <Route path="/farba-dlya-dereva" element={<FarbaDlaDerevaPage />} />
          <Route path="/gruntivka" element={<GruntivkaPage />} />
          <Route path="/lak-dlya-dereva" element={<LakDlaDerevaPage />} />
          <Route path="/koleruvannya" element={<KoleruvannyaPage />} />
          <Route path="/kupit-farbu-kyiv" element={<KupytyFarbuKyivPage />} />
          <Route path="/magazyn-farb-kyiv" element={<MagazynFarbKyivPage />} />
          <Route path="/fasadna-farba-kyiv" element={<FasadnaFarbaKyivPage />} />
          <Route path="/koleruvannya-kyiv" element={<KoleruvannyaKyivPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>

      {/* Scroll to Top Button */}
      <ScrollToTop />

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default App
