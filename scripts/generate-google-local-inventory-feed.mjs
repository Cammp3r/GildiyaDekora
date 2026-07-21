import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { loadUniqueProducts } from './lib/products.mjs'

const ROOT = process.cwd()
const DIST_DIR = path.join(ROOT, 'dist')
const FEED_PATH = path.join(DIST_DIR, 'google-local-inventory.xml')
const SITE_URL = (
  process.env.SITE_URL ||
  process.env.VITE_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  'https://gihldihja-decora.ua'
).replace(/\/+$/, '')

// Must match "Код магазина" from Google Business Profile > Info > Advanced
// information for the "Гільдія Декора" location (Гусовського 12/7, Київ).
const STORE_CODE = process.env.LOCAL_STORE_CODE || '10014882667193772853'
const QUANTITY = process.env.LOCAL_STOCK_QUANTITY || '10'

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatPrice(value) {
  return `${Math.round(Number(value))} UAH`
}

function feedItem(product) {
  return [
    '    <item>',
    `      <g:id>${escapeXml(product.id)}</g:id>`,
    `      <g:store_code>${escapeXml(STORE_CODE)}</g:store_code>`,
    `      <g:quantity>${escapeXml(QUANTITY)}</g:quantity>`,
    `      <g:price>${escapeXml(formatPrice(product.price))}</g:price>`,
    '      <g:availability>in stock</g:availability>',
    '    </item>',
  ].join('\n')
}

const uniqueProducts = await loadUniqueProducts(ROOT, SITE_URL)

const feed = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
  '  <channel>',
  '    <title>Гільдія Декора — місцевий асортимент</title>',
  `    <link>${escapeXml(SITE_URL)}</link>`,
  '    <description>Наявність товарів OIKOS та ORAC DECOR у точці продажу Гільдії Декора</description>',
  ...uniqueProducts.map(feedItem),
  '  </channel>',
  '</rss>',
  '',
].join('\n')

await mkdir(DIST_DIR, { recursive: true })
await writeFile(FEED_PATH, feed, 'utf8')

if (STORE_CODE === 'REPLACE_WITH_STORE_CODE') {
  console.warn(
    'WARNING: LOCAL_STORE_CODE is not set — google-local-inventory.xml was generated with a placeholder ' +
    'store_code. Find the real store code in Merchant Center under Business information > Presence > ' +
    'Google Business Profile, then set the LOCAL_STORE_CODE env var before uploading this feed.'
  )
}

console.log(`Generated google-local-inventory.xml with ${uniqueProducts.length} products (store_code=${STORE_CODE}, quantity=${QUANTITY}) for ${SITE_URL}`)
