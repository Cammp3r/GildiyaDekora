import crypto from 'crypto'

export function generateSignature(data, privateKey) {
  return crypto.createHash('sha1').update(privateKey + data + privateKey).digest('base64')
}

export function verifySignature(data, signature, privateKey) {
  return signature === generateSignature(data, privateKey)
}

export function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

export function decodePayload(data) {
  return JSON.parse(Buffer.from(data, 'base64').toString('utf8'))
}

export function generateOrderId() {
  return `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`
}