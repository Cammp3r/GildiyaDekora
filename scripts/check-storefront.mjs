import assert from 'node:assert/strict'
import { createServer } from 'vite'
import puppeteer from 'puppeteer'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { formatPhone, isValidPhone } from '../src/utils/phone.js'
import { catalogPrice, parseEurRate } from '../src/utils/prices.js'

for (const input of ['987590736', '0987590736', '+380987590736', '+380 (98) 759-07-36']) {
  assert.equal(formatPhone(input), '+380 98 759 07 36')
}
assert.equal(isValidPhone('+380 98 759 07'), false)
assert.equal(isValidPhone('+380 98 759 07 36'), true)
assert.throws(() => parseEurRate({ error: true }))
assert.equal(catalogPrice({ priceVariants: [{ eurPrice: 13 }, { eurPrice: 25 }] }, 51.5), 670)

const server = await createServer({
  cacheDir: path.join(tmpdir(), 'gildiya-storefront-check'),
  server: { port: 5185, strictPort: true },
  optimizeDeps: { entries: ['index.html'] },
  logLevel: 'error',
})
await server.listen()
let browser
try {
  console.log('Starting browser checks…')
  browser = await puppeteer.launch({ headless: true, timeout: 60000 })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 900 })
  const base = 'http://localhost:5185'
  let rate = 51.5
  let rateRequests = 0
  let email = ''
  let telegram
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setRequestInterception(true)
  page.on('request', async (request) => {
    const url = request.url()
    // All submissions are intercepted: no email or Telegram message is sent.
    if (url.includes('/api/eur-rate')) {
      rateRequests++
      await request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify([
        { ccy: 'EUR', base_ccy: 'UAH', sale: String(rate) },
      ]) })
    } else if (url.includes('formsubmit.co')) {
      if (request.method() === 'POST') email = request.postData() ?? await request.fetchPostData()
      await request.respond({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
        contentType: 'application/json', body: '{"success":true}' })
    } else if (url.includes('/notify/telegram')) {
      if (request.method() === 'POST') telegram = JSON.parse(request.postData())
      await request.respond({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
        contentType: 'application/json', body: '{"ok":true}' })
    } else if (url.startsWith(base) || url.startsWith('data:')) await request.continue()
    else await request.abort()
  })
  const go = (route) => {
    console.log('Checking', route)
    return page.goto(base + route, { waitUntil: 'networkidle0', timeout: 60000 })
  }
  const text = (selector) => page.$eval(selector, (el) => el.textContent)
  const inputValue = (selector) => page.$eval(selector, (el) => el.value)

  await go('/')
  assert.equal(await page.$$eval('main', (els) => els.length), 1)
  await page.keyboard.press('Tab')
  assert.equal(await page.evaluate(() => document.activeElement.className), 'skip-link')
  await page.keyboard.press('Enter')
  assert.equal(await page.evaluate(() => document.activeElement.id), 'main-content')
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  assert.equal(await page.$eval('.marquee-inner', (el) => getComputedStyle(el).animationName), 'none')
  await page.click('.mobile-toggle')
  assert.equal(await page.$eval('.mobile-toggle', (el) => el.getAttribute('aria-expanded')), 'true')
  await page.click('.dropdown-toggle')
  assert.equal(await page.$eval('.dropdown-toggle', (el) => el.getAttribute('aria-expanded')), 'true')

  await go('/contact/')
  assert.equal(await inputValue('[name=phone]'), '+380 ')
  await page.type('[name=phone]', '987590736')
  assert.equal(await inputValue('[name=phone]'), '+380 98 759 07 36')
  await page.screenshot({ path: path.join(tmpdir(), 'gildiya-contact-updated.png'), fullPage: true })
  await page.keyboard.press('Backspace')
  assert.equal(await inputValue('[name=phone]'), '+380 98 759 07 3')
  await page.$eval('[name=phone]', (el) => el.form.reset())
  assert.equal(await inputValue('[name=phone]'), '+380 ')
  await page.$eval('[name=phone]', (el) => {
    const clipboardData = new DataTransfer()
    clipboardData.setData('text', '+380 (98) 759-07-36')
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }))
  })
  assert.equal(await inputValue('[name=phone]'), '+380 98 759 07 36')
  console.log('PASS: landmarks, skip link, reduced motion, menu states, phone typing/paste/reset')

  await go('/products/')
  const product = await page.evaluate(async () => {
    const { oikosProductsDb } = await import('/src/data/products.js')
    return oikosProductsDb.find((p) => p.priceVariants.length > 1)
  })
  assert.ok(await page.$('a.add-btn-primary'))
  await go(`/products/${encodeURIComponent(product.id)}/`)
  const variant = product.priceVariants[0]
  const unit = Math.round(variant.eurPrice * rate)
  assert.equal((await text('.product-details-price')).replace(/\D/g, ''), String(unit))
  await page.click('.add-btn-primary')
  await go('/cart')
  assert.equal((await text('.cart-summary strong')).replace(/\D/g, ''), String(unit))
  const beforeCacheTest = rateRequests
  await page.reload({ waitUntil: 'networkidle0' })
  assert.equal(rateRequests, beforeCacheTest, 'Fresh daily rate must be reused')
  rate = 60
  await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('gildiyaEurRate'))
    saved.ts = Date.now() - 25 * 60 * 60 * 1000
    localStorage.setItem('gildiyaEurRate', JSON.stringify(saved))
  })
  // Reload with an expired cache, then verify both row and total receive the fresh rate.
  await page.reload({ waitUntil: 'networkidle0' })
  const updatedUnit = Math.round(variant.eurPrice * rate)
  assert.equal((await text('.cart-summary strong')).replace(/\D/g, ''), String(updatedUnit))
  assert.equal((await text('.cart-item-total')).replace(/\D/g, ''), String(updatedUnit))

  await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('gildiya-dekora-cart-v1'))
    const item = stored.items[0]
    stored.items = ['RED', 'BLUE'].map((color) => ({ ...item, color, texture: 'SILK', cartId: item.cartId + color }))
    localStorage.setItem('gildiya-dekora-cart-v1', JSON.stringify(stored))
  })
  await page.reload({ waitUntil: 'networkidle0' })
  assert.match(await text('.cart-list'), /RED/)
  assert.match(await text('.cart-list'), /BLUE/)
  await page.screenshot({ path: path.join(tmpdir(), 'gildiya-cart-updated.png'), fullPage: true })
  await page.focus('.cart-item input')
  await page.keyboard.down('Control')
  await page.keyboard.press('A')
  await page.keyboard.up('Control')
  await page.keyboard.type('3')
  await page.keyboard.press('Tab')
  assert.deepEqual(await page.$$eval('.cart-item input', (els) => els.map((el) => el.value)), ['3', '1'])
  await page.click('.cart-item button')
  assert.equal(await page.$$eval('.cart-item', (els) => els.length), 1)
  assert.match(await text('.cart-list'), /BLUE/)
  assert.equal((await text('.cart-summary strong')).replace(/\D/g, ''), String(updatedUnit))
  await page.type('[name=name]', 'Test Customer')
  await page.type('[name=phone]', '987590736')
  await page.type('[name=email]', 'test@example.com')
  await new Promise((resolve) => setTimeout(resolve, 3100))
  await page.click('[type=submit]')
  await page.waitForFunction(() => document.querySelector('.cart-empty')?.textContent.includes('Дякуємо'))
  assert.match(email, /BLUE/)
  assert.match(email, /SILK/)
  assert.ok(telegram)
  assert.doesNotMatch(telegram.items, /BLUE|SILK/)
  console.log('PASS: EUR rounding/cache/refresh, cart variants, independent quantity/remove, email options, unchanged Telegram format')

  await go('/products/orac-decor/')
  const technicalProduct = await page.evaluate(async () => {
    const { loadOracDecorProducts } = await import('/src/data/products.js')
    const products = await loadOracDecorProducts()
    // Current catalog has no separate technicalPhotos. Exercise the dialog
    // with an in-memory fixture; neither product data nor files are changed.
    const product = products[0]
    product.technicalPhotos = [product.image]
    return product
  })
  await page.evaluate((id) => {
    const pathname = `/products/${encodeURIComponent(id)}/`
    const link = [...document.querySelectorAll('.product-card a')].find((el) => new URL(el.href).pathname === pathname)
    link.click()
  }, technicalProduct.id)
  await page.waitForSelector('.product-details-technical button')
  await page.click('.product-details-technical button')
  assert.equal(await page.evaluate(() => document.activeElement.className), 'product-image-modal-close')
  await page.keyboard.press('Tab')
  assert.equal(await page.evaluate(() => document.activeElement.className), 'product-image-modal-close')
  await page.keyboard.press('Escape')
  assert.equal(await page.$('[role=dialog]'), null)
  assert.ok(await page.evaluate(() => Boolean(document.activeElement.closest('.product-details-technical'))))
  await go('/admin/reviews')
  assert.match(await text('h1'), /не знайдено/)
  await go('/products/nonexistent-product/')
  assert.match(await text('h1'), /не знайдено/)
  assert.deepEqual(errors, [])
  console.log('PASS: image dialog focus/Escape, deleted admin page, unknown product')
} finally {
  await browser?.close()
  await server.close()
}
