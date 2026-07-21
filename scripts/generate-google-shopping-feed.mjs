import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { loadUniqueProducts } from './lib/products.mjs'

const ROOT = process.cwd()
const DIST_DIR = path.join(ROOT, 'dist')
const FEED_PATH = path.join(DIST_DIR, 'google-shopping.xml')
const SITE_URL = (
  process.env.SITE_URL ||
  process.env.VITE_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  'https://gihldihja-decora.ua'
).replace(/\/+$/, '')

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
  const description = product.description || `${product.title}. Офіційний дилер ${product.brand} в Україні.`

  return [
    '    <item>',
    `      <g:id>${escapeXml(product.id)}</g:id>`,
    `      <title>${escapeXml(product.title)}</title>`,
    `      <description>${escapeXml(description)}</description>`,
    `      <link>${escapeXml(product.link)}</link>`,
    `      <g:image_link>${escapeXml(product.image)}</g:image_link>`,
    '      <g:condition>new</g:condition>',
    '      <g:availability>in_stock</g:availability>',
    `      <g:price>${escapeXml(formatPrice(product.price))}</g:price>`,
    `      <g:brand>${escapeXml(product.brand)}</g:brand>`,
    `      <g:product_type>${escapeXml(product.productType)}</g:product_type>`,
    '    </item>',
  ].join('\n')
}

const uniqueProducts = await loadUniqueProducts(ROOT, SITE_URL)

const feed = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
  '  <channel>',
  '    <title>Гільдія Декора</title>',
  `    <link>${escapeXml(SITE_URL)}</link>`,
  '    <description>Товари OIKOS та ORAC DECOR від Гільдії Декора</description>',
  ...uniqueProducts.map(feedItem),
  '  </channel>',
  '</rss>',
  '',
].join('\n')

await mkdir(DIST_DIR, { recursive: true })
await writeFile(FEED_PATH, feed, 'utf8')

console.log(`Generated google-shopping.xml with ${uniqueProducts.length} products for ${SITE_URL}`)
