import { createContext, useContext, useEffect, useState } from 'react'

const FALLBACK_EUR_RATE = 51.95
const CACHE_KEY = 'gildiyaEurRate'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

function getCachedRate() {
  try {
    const saved = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    if (saved && Number.isFinite(saved.rate) && Date.now() - saved.ts < CACHE_TTL_MS) {
      return saved.rate
    }
  } catch { /* ignore */ }
  return null
}

function setCachedRate(rate) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, ts: Date.now() }))
  } catch { /* ignore */ }
}

const ExchangeRateContext = createContext(FALLBACK_EUR_RATE)

export function ExchangeRateProvider({ children }) {
  const [eurRate, setEurRate] = useState(() => getCachedRate() ?? FALLBACK_EUR_RATE)

  useEffect(() => {
    // If we already have a fresh cached rate, skip the fetch
    if (getCachedRate() !== null) return

    const controller = new AbortController()
    fetch('https://api.privatbank.ua/p24api/pubinfo?exchange&json&coursid=5', {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        const eur = Array.isArray(data)
          ? data.find((c) => c.ccy === 'EUR' && c.base_ccy === 'UAH')
          : null
        const rate = eur ? parseFloat(eur.sale) : null
        if (rate && Number.isFinite(rate) && rate > 20 && rate < 200) {
          setCachedRate(rate)
          setEurRate(rate)
        }
      })
      .catch(() => { /* silently fall back to hardcoded rate */ })

    return () => controller.abort()
  }, [])

  return (
    <ExchangeRateContext.Provider value={eurRate}>
      {children}
    </ExchangeRateContext.Provider>
  )
}

export function useEurRate() {
  return useContext(ExchangeRateContext)
}

export function useConvertedPrice(product) {
  const rate = useEurRate()
  if (product?.eurPrice !== null && product?.eurPrice !== undefined) {
    return Math.round(product.eurPrice * rate)
  }
  return product?.price ?? null
}
