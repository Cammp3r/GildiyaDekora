import fs from 'node:fs/promises'

const CATALOG_PATH = new URL('../orac_decor.json', import.meta.url)
const CONCURRENCY = 4
const REQUEST_DELAY_MS = 120

const FIELD_LABELS = {
  length: 'Длина',
  height: 'Высота',
  width: 'Ширина',
  material: 'Материал',
  country: 'Страна производитель',
}

const htmlEntities = {
  amp: '&',
  nbsp: ' ',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
}

function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (_, name) => htmlEntities[name] ?? `&${name};`)
}

function htmlToText(html) {
  return decodeEntities(
    String(html ?? '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(?:li|tr|td|th|p|div|span|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

function normalizeNumber(value) {
  const match = String(value ?? '').match(/\d+(?:[.,]\d+)?/)
  if (!match) return ''
  return match[0].replace(',', '.')
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function extractAfterLabel(text, label) {
  const lines = String(text ?? '')
    .split('\n')
    .map((line) => normalizeText(line))
    .filter(Boolean)

  const linePattern = new RegExp(`^${label}(?:\\s|[:\\-–]|$)\\s*[:\\-–]?\\s*(.*)$`, 'i')

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(linePattern)
    if (!match) continue

    const sameLineValue = normalizeText(match[1])
    if (sameLineValue) return sameLineValue

    return normalizeText(lines[index + 1] ?? '')
  }

  return ''
}

function extractFromDescription(description) {
  const text = normalizeText(description)
  const characteristics = {}

  const dimensionTriplet = text.match(
    /(?:размеры|розміри)\s*(\d+(?:[.,]\d+)?)\s*(?:мм|м)?\s*[xх]\s*(\d+(?:[.,]\d+)?)\s*(?:мм|м)?\s*[xх]\s*(\d+(?:[.,]\d+)?)\s*(?:мм|м)?/i
  )
  if (dimensionTriplet) {
    characteristics.length = normalizeNumber(dimensionTriplet[1])
    characteristics.width = normalizeNumber(dimensionTriplet[2])
    characteristics.height = normalizeNumber(dimensionTriplet[3])
  }

  characteristics.length ||= normalizeNumber(
    text.match(/(?:длина|длину|длина изделия|длина карниза|длина молдинга|длина плинтуса|длина профиля|довжина)\s*(?:изделия|карниза|молдинга|плинтуса|профиля|обрамления|орнамента|элемента)?\s*(?:составляет|достигает|равна|:|-|–)?\s*(\d+(?:[.,]\d+)?)\s*(?:мм|метра|метров|м)?/i)?.[1]
  )
  characteristics.height ||= normalizeNumber(
    text.match(/(?:высота|высоту|його висота|висота)\s*(?:составляет|равна|:|-|–)?\s*(\d+(?:[.,]\d+)?)\s*(?:мм|метра|метров|м)?/i)?.[1]
  )
  characteristics.width ||= normalizeNumber(
    text.match(/(?:ширина|ширину|його ширина)\s*(?:составляет|равна|:|-|–)?\s*(\d+(?:[.,]\d+)?)\s*(?:мм|метра|метров|м)?/i)?.[1]
  )

  return Object.fromEntries(Object.entries(characteristics).filter(([, value]) => value))
}

function extractCharacteristics(html, description = '') {
  const text = htmlToText(html)
  const fromSite = {
    length: normalizeNumber(extractAfterLabel(text, FIELD_LABELS.length)),
    height: normalizeNumber(extractAfterLabel(text, FIELD_LABELS.height)),
    width: normalizeNumber(extractAfterLabel(text, FIELD_LABELS.width)),
    material: extractAfterLabel(text, FIELD_LABELS.material),
    country: extractAfterLabel(text, FIELD_LABELS.country),
  }

  const fromDescription = extractFromDescription(description)

  return Object.fromEntries(
    Object.entries({
      ...fromDescription,
      ...Object.fromEntries(Object.entries(fromSite).filter(([, value]) => value)),
    }).filter(([, value]) => value)
  )
}

async function fetchWithRetry(url, retries = 2) {
  let lastError

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 GildiyaDekoraCatalogUpdater/1.0',
        },
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.text()
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS * (attempt + 2)))
    }
  }

  throw lastError
}

async function runPool(items, worker) {
  let cursor = 0
  const runners = Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      await worker(items[index], index)
      await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS))
    }
  })

  await Promise.all(runners)
}

const catalog = JSON.parse(await fs.readFile(CATALOG_PATH, 'utf8'))
const products = catalog.sections.flatMap((section) => section.products ?? [])
let updated = 0
let failed = 0

await runPool(products, async (product, index) => {
  const url = String(product.url ?? '').trim()
  const fallback = extractFromDescription(product.description ?? '')

  try {
    const html = url ? await fetchWithRetry(url) : ''
    const characteristics = extractCharacteristics(html, product.description)

    if (Object.keys(characteristics).length > 0) {
      product.characteristics = characteristics
      updated += 1
    } else if (Object.keys(fallback).length > 0) {
      product.characteristics = fallback
      updated += 1
    }
  } catch (error) {
    failed += 1
    if (Object.keys(fallback).length > 0) {
      product.characteristics = fallback
      updated += 1
    }
    console.warn(`[${index + 1}/${products.length}] ${product.name}: ${error.message}`)
  }
})

catalog.updated = new Date().toISOString().slice(0, 10)

await fs.writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')

const withAllDimensions = products.filter(
  (product) =>
    product.characteristics?.length &&
    product.characteristics?.height &&
    product.characteristics?.width
).length

console.log(`Products: ${products.length}`)
console.log(`Updated with characteristics: ${updated}`)
console.log(`With length, height and width: ${withAllDimensions}`)
console.log(`Failed requests: ${failed}`)
