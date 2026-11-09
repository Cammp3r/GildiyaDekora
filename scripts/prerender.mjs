/**
 * Prerender script: renders key pages (including every product page) to
 * static HTML so Googlebot, other crawlers, and link-preview bots (which
 * mostly don't execute JS) see full content — title, price, description,
 * JSON-LD — without waiting for a JavaScript render pass.
 *
 * How it works:
 *  1. Starts the Vite preview server (serves dist/)
 *  2. Opens each route in headless Chrome (via puppeteer), several at once
 *  3. Waits for React to render the page
 *  4. Saves the rendered HTML as dist/<route>/index.html
 *
 * Netlify serves these files directly. Known product routes retain their
 * static React shells if a snapshot fails; unknown paths use 404.html.
 * Core pages, including the 404 document, must render successfully.
 */

import { preview } from 'vite'
import puppeteer from 'puppeteer'
import { writeFile, mkdir, copyFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { getProductRoutes } from './lib/product-routes.mjs'
import { getBuildEurRate } from './lib/exchange-rate.mjs'

const ROOT = process.cwd()
const DIST = path.join(ROOT, 'dist')
const PORT = 4174 // use 4174 to avoid conflict with a running dev server on 5173
const CONCURRENCY = Number(process.env.PRERENDER_CONCURRENCY) || 6

// Hand-picked pages where a prerender failure should fail the build.
const CORE_ROUTES = [
  '/',
  '/products',
  '/products/orac-decor',
  '/products/elite-decor',
  '/gallery',
  '/contact',
  '/cart',
  '/privacy-policy',
  '/404',
  '/return-policy',
  '/nanesennya-farby-kyiv',
  '/kupyty-lipnynu-kyiv',
  '/kupyty-farbu-oikos-kyiv',
  '/kupyty-elite-decor-kyiv',
  '/kupyty-farbu-dlya-stin-kyiv',
  '/oplata-i-dostavka',
]

async function makeRouteShells(routes, indexHtml) {
  // Copy index.html into every route directory so the preview server can
  // serve the SPA shell at the correct URL path before puppeteer replaces
  // it with the fully rendered HTML.
  for (const route of routes) {
    if (route === '/') continue
    const dir = path.join(DIST, route.slice(1))
    await mkdir(dir, { recursive: true })
    await copyFile(indexHtml, path.join(dir, 'index.html'))
  }
}

// 1x1 transparent GIF. Product pages have onError handlers on swatch/thumb
// <img> tags that swap `src` to a fallback URL when a request fails — if we
// abort image requests outright, the fallback request gets aborted too,
// and on pages with many swatches (texture/color galleries) this cascades
// into requests that never stop, so `networkidle0` never resolves. Fulfilling
// with a tiny placeholder instead keeps things fast without ever failing.
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
  'base64',
)

async function renderRoute(browser, baseUrl, route, eurRate) {
  const url = `${baseUrl}${route}`
  const page = await browser.newPage()
  try {
    // Skip real image/font downloads so rendering is fast, but never fail
    // a request outright (see TRANSPARENT_GIF comment above).
    await page.setRequestInterception(true)
    page.on('request', (req) => {
      const type = req.resourceType()
      if (type === 'image') {
        req.respond({ status: 200, contentType: 'image/gif', body: TRANSPARENT_GIF })
      } else if (type === 'media' || type === 'font') {
        req.abort()
      } else {
        req.continue()
      }
    })

    // Suppress console noise from the page
    page.on('console', () => {})
    page.on('pageerror', () => {})

    // Tell index.html's inline scripts not to load GTM/gtag here — they
    // inject their own runtime <script> tags (including a conversion ping
    // stamped with this preview server's own localhost URL) into the DOM,
    // and page.content() below would freeze that straight into the static
    // HTML every real visitor's browser then also executes.
    await page.evaluateOnNewDocument((rate) => {
      window.__PRERENDER__ = true
      localStorage.setItem('gildiyaEurRate', JSON.stringify({ rate, ts: Date.now() }))
    }, eurRate)

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30_000 })

    // Wait until React has rendered at least one child inside #root
    await page.waitForSelector('#root > *', { timeout: 10_000 })

    const html = await page.content()

    const outPath =
      route === '/'
        ? path.join(DIST, 'index.html')
        : path.join(DIST, route.slice(1), 'index.html')

    await writeFile(outPath, html, 'utf-8')
    if (route === '/404') await writeFile(path.join(DIST, '404.html'), html, 'utf-8')
    return { route, ok: true }
  } catch (err) {
    return { route, ok: false, error: err.message }
  } finally {
    await page.close()
  }
}

async function runPool(routes, concurrency, worker) {
  const results = new Array(routes.length)
  let cursor = 0

  async function next() {
    while (cursor < routes.length) {
      const i = cursor++
      results[i] = await worker(routes[i])
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, routes.length) }, next))
  return results
}

async function prerender() {
  const productRoutes = await getProductRoutes(ROOT)
  const eurRate = await getBuildEurRate()
  const allRoutes = [...CORE_ROUTES, ...productRoutes]
  const coreRouteSet = new Set(CORE_ROUTES)

  console.log(
    `\nPrerender: ${CORE_ROUTES.length} core pages + ${productRoutes.length} product pages ` +
      `= ${allRoutes.length} total (concurrency ${CONCURRENCY})`,
  )

  const indexHtml = path.join(DIST, 'index.html')
  await makeRouteShells(allRoutes, indexHtml)

  const server = await preview({
    root: ROOT,
    preview: {
      port: PORT,
      strictPort: true,
      host: false,
      open: false,
    },
  })

  const baseUrl = `http://localhost:${PORT}`
  console.log(`Prerender: preview server at ${baseUrl}`)

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',            // required in Netlify / Docker CI
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // prevents OOM crashes in CI
      '--disable-gpu',
    ],
  })

  let rendered = 0
  let coreFailed = 0
  let productFailed = 0
  let done = 0

  await runPool(allRoutes, CONCURRENCY, async (route) => {
    const result = await renderRoute(browser, baseUrl, route, eurRate)
    done++
    if (result.ok) {
      rendered++
    } else if (coreRouteSet.has(route)) {
      coreFailed++
      console.error(`  ✗  ${route}: ${result.error}`)
    } else {
      productFailed++
      console.warn(`  ✗  ${route}: ${result.error} (will fall back to SPA render)`)
    }
    if (done % 50 === 0 || done === allRoutes.length) {
      console.log(`  … ${done}/${allRoutes.length} rendered`)
    }
    return result
  })

  await browser.close()
  await new Promise((resolve) => server.httpServer.close(resolve))

  console.log(
    `\nPrerender complete: ${rendered} rendered, ${coreFailed} core failed, ${productFailed} product pages skipped\n`,
  )

  if (coreFailed > 0) process.exit(1)
}

prerender().catch((err) => {
  console.error('\nPrerender failed; static routes and 404.html are required:', err.message)
  process.exit(1)
})
