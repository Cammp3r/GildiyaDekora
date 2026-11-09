import { parseEurRate } from '../../src/utils/prices.js'

let ratePromise
export function getBuildEurRate() {
  ratePromise ??= fetch('https://api.privatbank.ua/p24api/pubinfo?exchange&json&coursid=5', {
    signal: AbortSignal.timeout(15000),
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Exchange rate HTTP ${response.status}`)
    return parseEurRate(await response.json())
  })
  return ratePromise
}
