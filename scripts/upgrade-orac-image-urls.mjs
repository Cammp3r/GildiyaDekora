import fs from 'node:fs/promises'

const CATALOG_PATH = new URL('../orac_decor.json', import.meta.url)

function upgradeOracImageUrl(url) {
  return String(url ?? '')
    .trim()
    .replace('/image/cache/catalog/', '/image/catalog/')
    .replace(/-\d+x\d+(?=\.[a-z]{3,4}(?:$|\?))/i, '')
}

function getImageArea(url) {
  const match = String(url ?? '').match(/-(\d+)x(\d+)(?=\.[a-z]{3,4}(?:$|\?))/i)
  if (!match) return Number.MAX_SAFE_INTEGER
  return Number(match[1]) * Number(match[2])
}

const catalog = JSON.parse(await fs.readFile(CATALOG_PATH, 'utf8'))
let changed = 0

for (const section of catalog.sections ?? []) {
  for (const product of section.products ?? []) {
    const photos = Array.isArray(product.photos) ? product.photos : []
    const upgradedPhotos = [...new Set(photos.map(upgradeOracImageUrl).filter(Boolean))].sort(
      (a, b) => getImageArea(b) - getImageArea(a)
    )

    if (JSON.stringify(photos) !== JSON.stringify(upgradedPhotos)) {
      product.photos = upgradedPhotos
      changed += 1
    }
  }
}

await fs.writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')

console.log(`Updated product photo lists: ${changed}`)
