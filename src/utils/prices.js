export const FALLBACK_EUR_RATE = 51.95
export const RATE_CACHE_KEY = 'gildiyaEurRate'
export const RATE_CACHE_TTL = 24 * 60 * 60 * 1000

export function validEurRate(rate) {
  return Number.isFinite(rate) && rate > 20 && rate < 200
}

export function parseEurRate(data) {
  const row = Array.isArray(data) && data.find((item) => item.ccy === 'EUR' && item.base_ccy === 'UAH')
  const rate = row ? Number(row.sale) : NaN
  if (!validEurRate(rate)) throw new Error('Invalid EUR exchange rate')
  return rate
}

export function priceInUah(item, rate) {
  if (item?.eurPrice != null && Number.isFinite(Number(item.eurPrice))) {
    return Math.round(Number(item.eurPrice) * rate)
  }
  return Number(item?.price ?? item?.unitPrice) || 0
}

export function catalogPrice(product, rate) {
  return product.priceVariants?.length
    ? Math.min(...product.priceVariants.map((variant) => priceInUah(variant, rate)))
    : priceInUah(product, rate)
}
