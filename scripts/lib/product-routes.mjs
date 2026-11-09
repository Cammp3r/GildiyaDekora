import { readFile } from 'node:fs/promises'
import path from 'node:path'

// Include products without prices: their consultation pages are valid routes too.
export async function getProductRoutes(root) {
  const databases = await Promise.all(['dtb.json', 'orac_decor.json', 'elite_decor.json']
    .map(async (file) => JSON.parse(await readFile(path.join(root, file), 'utf8'))))
  const ids = databases.flatMap((db) => (db.sections ?? []).flatMap((section) => [
    ...(section.products ?? []),
    ...(section.subcategories ?? []).flatMap((subcategory) => subcategory.products ?? []),
  ])).map((product) => product.id ?? product.url ?? product.name)
    .filter((id) => id != null && String(id).trim())
  return [...new Set(ids.map(String))].map((id) => `/products/${encodeURIComponent(id)}`)
}
