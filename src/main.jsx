import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './cart/CartContext.jsx'
import { ExchangeRateProvider } from './context/ExchangeRateContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ExchangeRateProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </ExchangeRateProvider>
    </BrowserRouter>
  </StrictMode>,
)
