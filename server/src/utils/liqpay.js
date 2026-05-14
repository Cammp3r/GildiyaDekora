/* global Buffer */
import crypto from 'crypto'

/**
 * Генерирует LiqPay signature
 * @param {string} data - Base64 encoded payload
 * @param {string} privateKey - LiqPay private key
 * @returns {string} SHA1 signature
 */
export function generateSignature(data, privateKey) {
  const hash = crypto
    .createHash('sha1')
    .update(privateKey + data + privateKey)
    .digest('base64')
  return hash
}

/**
 * Верифицирует LiqPay webhook signature
 * @param {string} data - Base64 encoded payload from LiqPay
 * @param {string} signature - Signature from LiqPay
 * @param {string} privateKey - LiqPay private key
 * @returns {boolean}
 */
export function verifySignature(data, signature, privateKey) {
  const expectedSignature = generateSignature(data, privateKey)
  return signature === expectedSignature
}

/**
 * Кодирует payload в base64 для LiqPay
 * @param {object} payload - Object to encode
 * @returns {string} Base64 encoded string
 */
export function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

/**
 * Декодирует LiqPay payload из base64
 * @param {string} data - Base64 encoded data from LiqPay
 * @returns {object} Parsed payload
 */
export function decodePayload(data) {
  return JSON.parse(Buffer.from(data, 'base64').toString('utf8'))
}

/**
 * Генерирует уникальный order ID
 * @returns {string}
 */
export function generateOrderId() {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}
