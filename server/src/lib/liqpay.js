import { createHash } from 'node:crypto'

export const LIQPAY_CHECKOUT_URL = 'https://www.liqpay.ua/api/3/checkout'

export function createLiqPaySignature(privateKey, data) {
  return createHash('sha1').update(`${privateKey}${data}${privateKey}`).digest('base64')
}

export function encodeLiqPayData(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64')
}

export function decodeLiqPayData(data) {
  return JSON.parse(Buffer.from(String(data), 'base64').toString('utf8'))
}

export function verifyLiqPaySignature(privateKey, data, signature) {
  if (!data || !signature) return false
  const expected = createLiqPaySignature(privateKey, data)
  return expected === signature
}