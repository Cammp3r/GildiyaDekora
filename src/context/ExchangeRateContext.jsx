import { createContext, useContext, useEffect, useState } from 'react'
import { FALLBACK_EUR_RATE, RATE_CACHE_KEY, RATE_CACHE_TTL, parseEurRate, priceInUah, validEurRate } from '../utils/prices.js'

function readCachedRate() {
  try {
    const saved = JSON.parse(localStorage.getItem(RATE_CACHE_KEY) || 'null')
    if (saved && validEurRate(saved.rate) && Number.isFinite(saved.ts)) return saved
  } catch { /* Storage may be unavailable. */ }
  return null
}

const ExchangeRateContext = createContext(FALLBACK_EUR_RATE)

export function ExchangeRateProvider({ children }) {
  const [eurRate, setEurRate] = useState(() => readCachedRate()?.rate ?? FALLBACK_EUR_RATE)

  useEffect(() => {
    let controller
    let disposed = false
    let lastUpdated = readCachedRate()?.ts ?? 0

    async function refresh() {
      if (controller || disposed) return
      const cached = readCachedRate()
      if (cached && Date.now() - cached.ts < RATE_CACHE_TTL) {
        setEurRate(cached.rate)
        lastUpdated = cached.ts
        return
      }
      if (Date.now() - lastUpdated < RATE_CACHE_TTL) return
      controller = new AbortController()
      const request = controller
      const timeout = setTimeout(() => request.abort(), 10000)
      try {
        const response = await fetch('/api/eur-rate', { signal: request.signal, cache: 'no-store' })
        if (!response.ok) throw new Error(`Exchange rate HTTP ${response.status}`)
        const rate = parseEurRate(await response.json())
        if (disposed) return
        lastUpdated = Date.now()
        setEurRate(rate)
        try {
          localStorage.setItem(RATE_CACHE_KEY, JSON.stringify({ rate, ts: lastUpdated }))
        } catch { /* Keep the fresh rate in memory. */ }
      } catch (error) {
        if (!disposed) console.warn('Не вдалося оновити курс EUR; використовується останній доступний курс.', error.message)
      } finally {
        clearTimeout(timeout)
        controller = null
      }
    }

    function onVisible() { if (document.visibilityState === 'visible') void refresh() }
    void refresh()
    const interval = setInterval(refresh, 60 * 60 * 1000)
    window.addEventListener('focus', refresh)
    window.addEventListener('online', refresh)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      disposed = true
      controller?.abort()
      clearInterval(interval)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('online', refresh)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return <ExchangeRateContext.Provider value={eurRate}>{children}</ExchangeRateContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEurRate() { return useContext(ExchangeRateContext) }

// eslint-disable-next-line react-refresh/only-export-components
export function useConvertedPrice(product) { return priceInUah(product, useEurRate()) }
