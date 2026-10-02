import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const DIST_DIR = path.join(ROOT, 'dist')
const SITE_URL = (
  process.env.SITE_URL ||
  process.env.VITE_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  'https://gihldihja-decora.ua'
).replace(/\/+$/, '')

// Trailing slash required: prerendered pages are static directories
// (dist/<route>/index.html), and Netlify 301-redirects a bare path to add
// the slash before serving them — so the sitemap must list the final URL
// directly, not the one that then bounces through a redirect.
const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/products/', priority: '0.9', changefreq: 'weekly' },
  { path: '/products/orac-decor/', priority: '0.9', changefreq: 'weekly' },
  { path: '/products/elite-decor/', priority: '0.9', changefreq: 'weekly' },
  { path: '/gallery/', priority: '0.6', changefreq: 'monthly' },
  { path: '/contact/', priority: '0.7', changefreq: 'monthly' },
  { path: '/return-policy/', priority: '0.5', changefreq: 'yearly' },
  { path: '/nanesennya-farby-kyiv/', priority: '0.9', changefreq: 'monthly' },
  { path: '/kupyty-lipnynu-kyiv/', priority: '0.9', changefreq: 'monthly' },
  { path: '/kupyty-farbu-oikos-kyiv/', priority: '0.9', changefreq: 'monthly' },
  { path: '/kupyty-elite-decor-kyiv/', priority: '0.9', changefreq: 'monthly' },
  { path: '/kupyty-farbu-dlya-stin-kyiv/', priority: '0.9', changefreq: 'monthly' },
  { path: '/oplata-i-dostavka/', priority: '0.7', changefreq: 'monthly' },
]

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function routeUrl(routePath) {
  const normalized = routePath === '/' ? '/' : `/${routePath.replace(/^\/+/, '')}`
  return `${SITE_URL}${normalized}`
}

async function readJson(fileName) {
  const content = await readFile(path.join(ROOT, fileName), 'utf8')
  return JSON.parse(content)
}

function collectOikosProductIds(dtb) {
  const ids = []

  for (const section of Array.isArray(dtb.sections) ? dtb.sections : []) {
    const directProducts = Array.isArray(section.products) ? section.products : []
    ids.push(...directProducts.map((product) => product.id ?? product.url ?? product.name))

    for (const subcategory of Array.isArray(section.subcategories) ? section.subcategories : []) {
      const products = Array.isArray(subcategory.products) ? subcategory.products : []
      ids.push(...products.map((product) => product.id ?? product.url ?? product.name))
    }
  }

  return ids
}

function collectOracProductIds(oracDecor) {
  const ids = []

  for (const section of Array.isArray(oracDecor.sections) ? oracDecor.sections : []) {
    const products = Array.isArray(section.products) ? section.products : []
    ids.push(...products.map((product) => product.id ?? product.url ?? product.name))
  }

  return ids
}

function collectEliteProductIds(eliteDecor) {
  return toArray(eliteDecor.sections).flatMap((section) =>
    toArray(section.products).map((product) => product.id ?? product.url ?? product.name)
  )
}

function toArray(value) {
  return Array.isArray(value) ? value : []
}

function sitemapEntry({ loc, priority, changefreq, lastmod }) {
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n')
}

const [dtb, oracDecor, eliteDecor] = await Promise.all([
  readJson('dtb.json'),
  readJson('orac_decor.json'),
  readJson('elite_decor.json'),
])
const productIds = [
  ...collectOikosProductIds(dtb),
  ...collectOracProductIds(oracDecor),
  ...collectEliteProductIds(eliteDecor),
]
  .filter((id) => id !== null && id !== undefined && String(id).trim())
  .map((id) => String(id))

const uniqueProductIds = [...new Set(productIds)]
const today = new Date().toISOString().slice(0, 10)

const entries = [
  ...STATIC_ROUTES.map((route) => ({
    loc: routeUrl(route.path),
    priority: route.priority,
    changefreq: route.changefreq,
    lastmod: today,
  })),
  ...uniqueProductIds.map((id) => ({
    loc: routeUrl(`/products/${encodeURIComponent(id)}/`),
    priority: '0.8',
    changefreq: 'weekly',
    lastmod: today,
  })),
]

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries.map(sitemapEntry),
  '</urlset>',
  '',
].join('\n')

const robots = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /cart',
  'Disallow: /order',
  'Disallow: /admin',
  '',
  '# Allow AI crawlers — helps appear in AI-powered search results',
  'User-agent: GPTBot',
  'Allow: /',
  '',
  'User-agent: OAI-SearchBot',
  'Allow: /',
  '',
  'User-agent: anthropic-ai',
  'Allow: /',
  '',
  'User-agent: Claude-Web',
  'Allow: /',
  '',
  `Sitemap: ${SITE_URL}/sitemap.xml`,
  '',
].join('\n')

// Product pages are prerendered static directories (dist/products/<id>/index.html).
// A bare `/products/<id>` request (no trailing slash) naturally 301-redirects to
// `/products/<id>/` via Netlify's own directory-serving behavior — that's fine,
// it matches the canonical URL (see productPath in ProductDetailsPage.jsx) and the
// sitemap entry below, both of which already use the trailing-slash form. A
// previous rewrite rule here served the no-slash URL directly with 200 OK instead
// of redirecting it, which meant Googlebot found the *same* page live at two
// different URLs with mismatched canonical signals — Search Console flagged ~95
// product pages as "Duplicate, Google chose different canonical than user" because
// of it. Removing the rewrite lets every product page resolve to exactly one URL.
const redirects = '/*    /index.html   200\n'

await mkdir(DIST_DIR, { recursive: true })
await Promise.all([
  writeFile(path.join(DIST_DIR, 'sitemap.xml'), sitemap, 'utf8'),
  writeFile(path.join(DIST_DIR, 'robots.txt'), robots, 'utf8'),
  writeFile(path.join(DIST_DIR, '_redirects'), redirects, 'utf8'),
])

console.log(`Generated sitemap.xml with ${entries.length} URLs for ${SITE_URL}`)
console.log(`Generated _redirects for ${SITE_URL}`)
