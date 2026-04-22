import './App.css'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'

function App() {
  return (
    <div className="App">
      {/* Header */}
      <Header />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<HomePage scrollToId="about" />} />
        <Route path="/products" element={<HomePage scrollToId="products" />} />
        <Route path="/gallery" element={<HomePage scrollToId="gallery" />} />
        <Route path="/contact" element={<HomePage scrollToId="contact" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Scroll to Top Button */}
      <ScrollToTop />

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default App
