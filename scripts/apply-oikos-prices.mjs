import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const root = process.cwd()
const dtbPath = path.join(root, 'dtb.json')

const priceFile = fs
  .readdirSync(root)
  .find((name) => name.toLowerCase().endsWith('.xlsx') && name.includes('01.03.25'))

if (!priceFile) {
  throw new Error('Price XLSX file with 01.03.25 in the name was not found')
}

const aliases = {
  'id-001': ['ARGILLA MATERICA'],
  'id-002': ['AUREUM'],
  'id-003': ['CEMENTO MATERICO'],
  'id-004': ['DECORGLITTER'],
  'id-005': ['DUCA VENEZIA'],
  'id-006': ['ENCANTO'],
  'id-007': ['FINITURA AUTOL'],
  'id-008': ['FINITURA MADREPERLATO'],
  'id-009': ['IMPERIUM'],
  'id-010': ['KREOS'],
  'id-011': ['MARMORA ROMANA'],
  'id-012': ['MARMORINO NAT', 'MARMOR.NAT'],
  'id-013': ['MULTIDECOR '],
  'id-014': ['MULTIDECOR SKIN'],
  'id-015': ['OTTOCENTO'],
  'id-016': ['PALLAS'],
  'id-017': ['RAFFAEL.D.S', 'RAFFAELLO DECOR STUCCO'],
  'id-018': ['STUCCO ROM'],
  'id-019': ['TIEPOLO'],
  'id-020': ['TRAVER.ROM.NATUR', 'TRAVERTINO ROMANO '],
  'id-021': ['TRAVER.ROM. DESIGN'],
  'id-022': ['TRAVERTINO ROMANO FINIT'],
  'id-023': ['TONER P/TRAV'],
  'ip-001': ['BIAMAX'],
  'ip-002': ['COPRIMAX'],
  'ip-003': ['DRYWALL PAINT'],
  'ip-004': ['EXTRAPAINT'],
  'ip-005': ['MULTIFUND'],
  'ip-006': ['PITTURA CALCE VERONA'],
  'ip-007': ['SIRIUS 2001'],
  'ip-008': ['SUPERCOLOR'],
  'ip-009': ['SUPERMATT'],
  'ip-010': ['TOPMATT'],
  'ip-011': ['ULTRASATEN'],
  'ip-012': ['WALLSATIN'],
  'ip-013': ['MICOTRAL'],
  'ip-014': ['STERYLCALCE'],
  'ip-015': ['STERYLFIX'],
  'ip-016': ['STERYLPAINT'],
  'ip-017': ['STERYLPLUS'],
  'ip-018': ['STERYLSAN'],
  'ip-019': ['CRILUX'],
  'ip-020': ['FLEXIGRAP'],
  'ip-021': ['FONDO MURALES'],
  'ip-022': ['IL PIGMENTATO'],
  'ip-023': ['IL PRIMER'],
  'ip-024': ['NEOFIX'],
  'ip-025': ['STUCCO IN PASTA PER RASATURA'],
  'ip-026': ['CERA PER STUCCO'],
  'ip-027': ['IGROLUX'],
  'ip-028': ['OPAC'],
  'ip-029': ['PROTETTIVO STUCCO'],
  'ip-030': ['WATINS LUX'],
  'ip-031': ['DECORTINA NEW'],
  'ip-032': ['EKOSTRIPPER'],
  'ep-001': ['BLANKOR'],
  'ep-002': ['NEOKRYLL'],
  'ep-003': ['DECORSIL PRIMER '],
  'ep-004': ['DECOR.PRIMER PIGM', 'DECORSIL PRIMER PIGM'],
  'ep-005': ['CONSOLIDANTE CALCE'],
  'ep-006': ['RASAT.ALLA CALCE'],
  'ep-008': ['ARCHITAL'],
  'ep-009': ['NEOQUARZ '],
  'ep-010': ['NEOQUARZ PLUS'],
  'ep-011': ['ADDENSANTE'],
  'ep-012': ['BIOCOMPACT '],
  'ep-013': ['DUAFLEX'],
  'ep-014': ['SILKOS TORINO'],
  'ep-015': ['DECORSIL FIRENZE'],
  'ep-016': ['DECORSIL ROMA'],
  'ep-017': ['VELDECOR'],
  'ep-018': ['BIOCOM.ELASTIC'],
  'ep-019': ['ELASTRONG GUM'],
  'ep-020': ['ELASTRONG PAINT GUM'],
  'ep-021': ['PITTURA CALCE ADIGE'],
  'ep-022': ['BETONCRYLL IDROREPELL'],
  'ep-023': ['BETONCRYLL PIGM'],
  'ep-024': ['BETONCRYLL SEMITRASPARENTE'],
  'ep-025': ['BETONCRYLL TRASPARENTE'],
  'ep-026': ['SUPERFINISH24'],
  'nv-001': ['NV FERROMICAC'],
  'nv-002': ['NV METTALIZATO'],
  'nv-003': ['ECOSMALTO PER CERAMICA'],
  'nv-004': ['NV THERMO'],
  'nv-005': ['NV SMALTO'],
  'nv-006': ['NV ECOFONDO RIEMPITIVO'],
  'nv-007': ['NV IMPREGANTE LEGNO'],
  'nv-008': ['NV PRITETTIVO LEGNO'],
  'nv-009': ['NV PARQUET'],
  'nv-010': ['NV TURAPORI'],
  'nv-011': ['NV AGGRAPPANTE'],
  'nv-012': ['NV ANTIRUGGINE'],
  'nv-013': ['NV CONVERTITORE'],
  'nv-014': ['NV FERRO PROTTETIVO'],
}

const excludes = {
  'id-010': ['SPATULA BY OIKOS'],
  'id-013': ['SKIN'],
  'id-020': ['DESIGN', 'FINIT', 'TONER'],
  'ep-003': ['PIGM'],
  'ep-009': ['PLUS'],
  'ep-012': ['ELASTIC'],
  'ep-019': ['PAINT GUM'],
}

function decodeEntities(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
}

function stripTags(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, ''))
}

function readZipEntries(filePath) {
  const buf = fs.readFileSync(filePath)
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  if (eocd === -1) throw new Error('Invalid XLSX archive')

  const centralOffset = buf.readUInt32LE(eocd + 16)
  const totalEntries = buf.readUInt16LE(eocd + 10)
  const entries = new Map()
  let offset = centralOffset

  for (let i = 0; i < totalEntries; i += 1) {
    if (buf.readUInt32LE(offset) !== 0x02014b50) break
    const method = buf.readUInt16LE(offset + 10)
    const compressedSize = buf.readUInt32LE(offset + 20)
    const fileNameLength = buf.readUInt16LE(offset + 28)
    const extraLength = buf.readUInt16LE(offset + 30)
    const commentLength = buf.readUInt16LE(offset + 32)
    const localOffset = buf.readUInt32LE(offset + 42)
    const name = buf
      .subarray(offset + 46, offset + 46 + fileNameLength)
      .toString('utf8')

    const localNameLength = buf.readUInt16LE(localOffset + 26)
    const localExtraLength = buf.readUInt16LE(localOffset + 28)
    const dataStart = localOffset + 30 + localNameLength + localExtraLength
    const compressed = buf.subarray(dataStart, dataStart + compressedSize)
    const data = method === 8 ? zlib.inflateRawSync(compressed) : compressed
    entries.set(name, data.toString('utf8'))

    offset += 46 + fileNameLength + extraLength + commentLength
  }

  return entries
}

function parseSheet(filePath) {
  const entries = readZipEntries(filePath)
  const sharedStrings = [...entries.get('xl/sharedStrings.xml').matchAll(/<si[^>]*>([\s\S]*?)<\/si>/g)].map(
    ([, xml]) => stripTags(xml),
  )
  const sheet = entries.get('xl/worksheets/sheet1.xml')

  return [...sheet.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)].map(([, rowNumber, rowXml]) => {
    const row = { row: Number(rowNumber) }
    for (const [, attrs, cellXml] of rowXml.matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const ref = (attrs.match(/\br="([A-Z]+)\d+"/) || [])[1]
      if (!ref) continue
      const type = (attrs.match(/\bt="([^"]+)"/) || [])[1] || ''
      const raw = (cellXml.match(/<v>([\s\S]*?)<\/v>/) || [])[1] ?? ''
      if (!raw) continue
      row[ref] = type === 's' ? sharedStrings[Number(raw)] : decodeEntities(raw)
    }
    return row
  })
}

function clean(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function extractVolume(title) {
  return (
    title.match(/\b(?:LT|KG|GR|ML)\.?\s*[\d,]+/i)?.[0] ||
    title.match(/\b\d+(?:,\d+)?\s*(?:L|KG|GR)\b/i)?.[0] ||
    ''
  ).replace(/\s+/g, ' ')
}

function isMatch(id, title) {
  const normalized = clean(title)
  if (id === 'ip-023') return normalized.startsWith('IL PRIMER')
  if (id === 'ip-028') return normalized.startsWith('OPAC ')
  if ((excludes[id] || []).some((needle) => normalized.includes(clean(needle)))) return false
  return (aliases[id] || []).some((needle) => normalized.includes(clean(needle)))
}

const rows = parseSheet(path.join(root, priceFile))
const items = rows
  .map((row) => ({
    title: String(row.A || '').replace(/\s+/g, ' ').trim(),
    price: Number(row.B),
  }))
  .filter((item) => item.title && Number.isFinite(item.price) && item.price > 0)

const priceMap = new Map()
for (const id of Object.keys(aliases)) {
  const variants = items
    .filter((item) => isMatch(id, item.title))
    .map((item) => ({
      title: item.title,
      volume: extractVolume(item.title),
      price: Math.round(item.price * 100) / 100,
    }))
    .filter((item) => item.volume)

  if (variants.length > 0) {
    priceMap.set(id, variants)
  }
}

const dtb = JSON.parse(fs.readFileSync(dtbPath, 'utf8'))

for (const section of dtb.sections || []) {
  const products = section.products || (section.subcategories || []).flatMap((subcategory) => subcategory.products || [])
  for (const product of products) {
    const variants = priceMap.get(product.id)
    if (!variants) continue
    product.price = Math.min(...variants.map((variant) => variant.price))
    product.price_currency = 'EUR'
    product.price_source = priceFile.replace(/\.xlsx$/i, '')
    product.price_variants = variants
  }
}

fs.writeFileSync(dtbPath, `${JSON.stringify(dtb, null, 2)}\n`)

console.log(`Updated ${priceMap.size} products from ${priceFile}`)
