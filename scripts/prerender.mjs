/**
 * Prerender script: renders key pages to static HTML so Googlebot
 * and other crawlers see content without waiting for JavaScript.
 *
 * How it works:
 *  1. Starts the Vite preview server (serves dist/)
 *  2. Opens each route in headless Chrome (via puppeteer)
 *  3. Waits for React to render the page
 *  4. Saves the rendered HTML as dist/<route>/index.html
 *
 * Netlify then serves these files as static HTML (HTTP 200 from disk,
 * not from the /* redirect rule), so bots get full content immediately.
 */

import { preview } from 'vite'
import puppeteer from 'puppeteer'
import { writeFile, mkdir, copyFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const DIST = path.join(ROOT, 'dist')
const PORT = 4174 // use 4174 to avoid conflict with a running dev server on 5173

// Pages to prerender. Product pages are skipped here (too many, hundreds)
// because Netlify's /* redirect already gives them HTTP 200 for Googlebot.
const ROUTES = [
  '/',
  '/products',
  '/gallery',
  '/contact',
  '/nanesennya-farby-kyiv',
  '/kupyty-lipnynu-kyiv',
]

async function prerender() {
  // Step 1: Copy index.html into every route directory so the preview
  // server can serve them as static files at the correct URL paths.
  // (Vite preview falls back to index.html for unknown paths when
  // appType is 'spa', but having real files makes navigation faster.)
  const indexHtml = path.join(DIST, 'index.html')
  for (const route of ROUTES) {
    if (route === '/') continue
    const dir = path.join(DIST, route.slice(1))
    await mkdir(dir, { recursive: true })
    await copyFile(indexHtml, path.join(dir, 'index.html'))
  }

  // Step 2: Start Vite preview server
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
  console.log(`\nPrerender: preview server at ${baseUrl}`)

  // Step 3: Launch headless Chrome
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
  let failed = 0

  for (const route of ROUTES) {
    const url = `${baseUrl}${route}`
    try {
      const page = await browser.newPage()

      // Block images / fonts so rendering is faster
      await page.setRequestInterception(true)
      page.on('request', (req) => {
        const type = req.resourceType()
        if (type === 'image' || type === 'media' || type === 'font') {
          req.abort()
        } else {
          req.continue()
        }
      })

      // Suppress console noise from the page
      page.on('console', () => {})
      page.on('pageerror', () => {})

      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30_000 })

      // Wait until React has rendered at least one child inside #root
      await page.waitForSelector('#root > *', { timeout: 10_000 })

      const html = await page.content()

      const outPath =
        route === '/'
          ? path.join(DIST, 'index.html')
          : path.join(DIST, route.slice(1), 'index.html')

      await writeFile(outPath, html, 'utf-8')
      console.log(`  ✓  ${route}`)
      rendered++

      await page.close()
    } catch (err) {
      console.error(`  ✗  ${route}: ${err.message}`)
      failed++
    }
  }

  await browser.close()

  // Close the preview server
  await new Promise((resolve) => server.httpServer.close(resolve))

  console.log(
    `\nPrerender complete: ${rendered} rendered${failed ? `, ${failed} failed` : ''}\n`,
  )

  if (failed > 0) process.exit(1)
}

prerender().catch((err) => {
  // Non-fatal: the SPA is still fully functional via public/_redirects.
  // Prerendering is a SEO bonus — don't block the deploy if Chrome is unavailable.
  console.warn('\nPrerender warning (build will continue):', err.message)
  console.warn('Pages will be served via SPA redirect instead of pre-rendered HTML.\n')
  process.exit(0)
})
