/**
 * Rewrites `description_uk` for every ORAC DECOR product in orac_decor.json.
 *
 * The scraped source text (from oracdecor.com.ua) is duplicate content with
 * missing spaces and a broken machine translation, and ProductDetailsPage
 * doesn't even render it for ORAC DECOR products — so those 460+ pages ship
 * with almost no unique body text, which is a common reason pages don't rank.
 * This generates original, grammatically correct Ukrainian descriptions from
 * the structured fields we already have (name, category, dimensions,
 * material, country), with several phrasing variants per product type so
 * pages in the same category don't read as copy-pasted from each other.
 *
 * Usage: node scripts/generate-orac-descriptions.mjs
 */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const FILE = path.join(ROOT, 'orac_decor.json')

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function pick(arr, seed) {
  return arr[seed % arr.length]
}

function extractCode(nameUk) {
  const m = nameUk.match(/Orac\s*Decor\s*([A-Za-zА-Яа-я0-9\-]+)/i)
  return m ? m[1].replace(/-$/, '').trim() : ''
}

function classify(nameUk) {
  const n = nameUk.toLowerCase()
  if (/клей/.test(n)) return 'glue'
  if (/шпаклів|шпаклев/.test(n)) return 'filler'
  if (/led.*(карниз|проф[іи]ль)/.test(n)) return 'ledCornice'
  if (/карниз/.test(n) && /гнучк/.test(n)) return 'flexCornice'
  if (/карниз/.test(n) && /орнамент/.test(n)) return 'ornamentCornice'
  if (/карниз/.test(n)) return 'smoothCornice'
  if (/молдинг/.test(n) && /гнучк/.test(n)) return 'flexMolding'
  if (/молдинг/.test(n) && /орнамент/.test(n)) return 'ornamentMolding'
  if (/молдинг/.test(n)) return 'smoothMolding'
  if (/плінтус/.test(n) && /гнучк/.test(n)) return 'flexBaseboard'
  if (/плінтус/.test(n)) return 'baseboard'
  if (/3d.*панель|панель.*3d|3d панель/.test(n) && /гнучк/.test(n)) return 'flexPanel3d'
  if (/3d.*панель|панель.*3d|3d панель/.test(n)) return 'panel3d'
  if (/дверне обрамлення|обрамлення/.test(n)) return 'doorFrame'
  if (/п[іи]вп[іи]лястр|пілястра/.test(n)) return 'pilaster'
  if (/півкапітел|капітел/.test(n)) return 'capital'
  if (/півколона|колона/.test(n)) return 'column'
  if (/база для колони|півоснова|полуоснование|основа/.test(n)) return 'columnBase'
  if (/розетка/.test(n)) return 'rosette'
  if (/плита|плата/.test(n)) return 'ceilingPlate'
  if (/кут\b|угол/.test(n)) return 'corner'
  if (/консоль/.test(n)) return 'console'
  if (/орнамент/.test(n)) return 'ornamentPiece'
  return 'accessory'
}

function materialLine(material, seed) {
  const poly = [
    'Виріб виготовлений з поліуретану — легкого, вологостійкого матеріалу, який не деформується з часом і легко фарбується у будь-який колір під інтер’єр.',
    'Матеріал — поліуретан: він майже нічого не важить, не боїться вологи та перепадів температури, тому чудово тримає форму роками.',
    'Використано поліуретан — матеріал, що легко ріжеться, клеїться на звичайний монтажний клей і добре фарбується водоемульсійними та акриловими фарбами.',
  ]
  const duro = [
    'Виріб виготовлений з дюрополімеру — щільного, ударостійкого матеріалу з підвищеною вологостійкістю, який добре підходить навіть для вологих приміщень.',
    'Матеріал — дюрополімер: він міцніший за звичайний поліуретан, не крихкий, витримує механічні навантаження і не боїться вологи.',
    'Використано дюрополімер — щільний полімерний матеріал з високою стійкістю до вологи та ударів, який довго зберігає початкову форму.',
  ]
  const bank = /дюрополімер/i.test(material) ? duro : poly
  return pick(bank, seed)
}

function dimsLine(ch, seed) {
  const L = ch.length, W = ch.width, H = ch.height
  if (!L && !W && !H) return ''
  const parts = []
  if (L) parts.push(`довжина ${L} мм`)
  if (W) parts.push(`ширина ${W} мм`)
  if (H) parts.push(`висота ${H} мм`)
  const dims = parts.join(', ')
  const bank = [
    `Розміри виробу: ${dims}.`,
    `Габарити: ${dims}.`,
    `Основні параметри: ${dims}.`,
  ]
  return pick(bank, seed)
}

const CLOSERS = [
  'Гільдія Декора — офіційний дилер ORAC DECOR у Києві: доставка по Києву та Україні, консультація щодо монтажу та підбору суміжних елементів колекції.',
  'Придбати цей виріб ORAC DECOR можна у Гільдії Декора — офіційного дилера бренду в Україні, з доставкою по Києву та інших містах.',
  'Гільдія Декора постачає оригінальну продукцію ORAC DECOR (Бельгія) з офіційною гарантією та доставкою по Києву й Україні.',
]

const TEMPLATES = {
  ledCornice: (code, seed) => [
    `LED-карниз ${code} прихованого освітлення ORAC DECOR створює м’яку підсвітку по периметру стелі, приховуючи світлодіодну стрічку від прямого погляду.`,
    `Профіль підходить для монтажу як на стелі, так і на стіні — світло рівномірно розсіюється вздовж усієї довжини, підкреслюючи об’єм приміщення.`,
  ],
  flexCornice: (code, seed) => [
    `Карниз ${code} ORAC DECOR — гнучка стельова галтель, яка згинається під потрібним радіусом і підходить для оформлення арок, овальних стель та закруглених стін.`,
    `Завдяки гнучкості цей карниз можна встановлювати там, де жорсткі профілі не підходять — на колонах, нішах і криволінійних поверхнях.`,
  ],
  smoothCornice: (code, seed) => [
    `Карниз ${code} ORAC DECOR — стельовий плінтус з гладким профілем, який акуратно оформлює стик стелі та стіни в класичному чи сучасному інтер’єрі.`,
    `Лаконічна форма профілю підходить як для мінімалістичних, так і для класичних інтер’єрів, приховуючи нерівності на стику стелі та стіни.`,
  ],
  ornamentCornice: (code, seed) => [
    `Карниз ${code} ORAC DECOR прикрашений рельєфним орнаментом і додає стелі виразності — гарний вибір для класичних та неокласичних інтер’єрів.`,
    `Декоративний рельєф на профілі надає стелі завершеного, «дорогого» вигляду без потреби у складній ліпнині вручну.`,
  ],
  flexMolding: (code, seed) => [
    `Молдинг ${code} ORAC DECOR — гнучкий настінний профіль, яким зручно оформлювати панно, ніші та криволінійні ділянки стін.`,
    `Гнучкість профілю дозволяє формувати з нього декоративні рамки й геометричні візерунки на стінах без стиків та підрізок.`,
  ],
  ornamentMolding: (code, seed) => [
    `Молдинг ${code} ORAC DECOR з рельєфним орнаментом використовують для оформлення стінних панелей, дверних порталів і декоративних рамок.`,
    `Рельєфний візерунок на профілі додає стіні фактури та акценту — молдинг часто комбінують із фарбуванням у контрастний колір.`,
  ],
  smoothMolding: (code, seed) => [
    `Молдинг ${code} ORAC DECOR — настінний профіль для розподілу стіни на панелі, обрамлення дзеркал, картин чи дверних отворів.`,
    `Тонкий гладкий профіль додає стіні структурності й часто використовується для створення класичного «панельного» декору.`,
  ],
  baseboard: (code, seed) => [
    `Підлоговий плінтус ${code} ORAC DECOR акуратно закриває стик підлоги та стіни, приховуючи технологічний зазор і кабелі освітлення чи проводки.`,
    `Гладкий профіль плінтуса підходить під більшість стилів інтер’єру та легко фарбується в тон стін або підлоги.`,
  ],
  flexBaseboard: (code, seed) => [
    `Гнучкий підлоговий плінтус ${code} ORAC DECOR підходить для приміщень з криволінійними стінами, де прямий плінтус не прилягає щільно.`,
    `Завдяки гнучкості плінтус легко огинає округлі стіни та колони, зберігаючи акуратний прилеглий шов.`,
  ],
  panel3d: (code, seed) => [
    `3D-панель ${code} ORAC DECOR — рельєфний декоративний елемент для акцентної стіни у вітальні, спальні чи коридорі.`,
    `Панель монтується встик з іншими елементами колекції, утворюючи безшовне рельєфне покриття, яке можна пофарбувати в один колір або з підсвіткою тіней.`,
  ],
  flexPanel3d: (code, seed) => [
    `Гнучка 3D-панель ${code} ORAC DECOR дозволяє оформити рельєфним декором не лише пряму стіну, а й колони та заокруглені поверхні.`,
    `Гнучкість панелі відкриває більше варіантів дизайну — від класичних акцентних стін до нестандартних криволінійних форм.`,
  ],
  doorFrame: (code, seed) => [
    `Дверне обрамлення ${code} ORAC DECOR формує акуратний декоративний портал навколо дверного отвору, надаючи йому завершеного вигляду.`,
    `Елемент використовують для оформлення міжкімнатних дверей або ніш у класичних та неокласичних інтер’єрах.`,
  ],
  pilaster: (code, seed) => [
    `Пілястра ${code} ORAC DECOR — декоративний плаский виступ у формі колони, який використовують для оформлення стін, дверних порталів чи камінів.`,
    `Пілястру зазвичай комбінують з базою та капітеллю з тієї ж колекції, створюючи цілісний класичний ансамбль.`,
  ],
  capital: (code, seed) => [
    `Капітель ${code} ORAC DECOR — верхня декоративна частина колони чи пілястри, яка завершує композицію в класичному стилі.`,
    `Елемент поєднується з відповідною колоною або пілястрою тієї ж серії ORAC DECOR для симетричного завершеного вигляду.`,
  ],
  column: (code, seed) => [
    `Колона ${code} ORAC DECOR — легкий декоративний елемент у формі класичної колони для оформлення входів, камінів чи інтер’єрних порталів.`,
    `На відміну від кам’яних аналогів, колона з поліуретану чи дюрополімеру набагато легша й простіша в монтажі, зберігаючи вигляд класичного декору.`,
  ],
  columnBase: (code, seed) => [
    `База ${code} ORAC DECOR — нижня опорна частина декоративної колони чи пілястри, яка завершує композицію знизу.`,
    `Елемент підбирається у парі з колоною або пілястрою тієї ж серії для цілісного класичного оформлення.`,
  ],
  rosette: (code, seed) => [
    `Стельова розетка ${code} ORAC DECOR обрамляє люстру чи світильник, додаючи стелі класичного акценту.`,
    `Рельєфний візерунок розетки підкреслює центр стелі та гарно поєднується з карнизами тієї ж колекції.`,
  ],
  ceilingPlate: (code, seed) => [
    `Стельова плита ${code} ORAC DECOR використовується як декоративне тло навколо люстри або як самостійний рельєфний елемент стелі.`,
    `Плиту можна фарбувати в колір стелі або контрастний відтінок, підкреслюючи рельєф світлом і тінню.`,
  ],
  corner: (code, seed) => [
    `Кутовий елемент ${code} ORAC DECOR — готова деталь для акуратного з’єднання профілів у кутах приміщення без підрізки під кутом.`,
    `Використання готового кута пришвидшує монтаж і гарантує рівний, акуратний стик у складних кутах.`,
  ],
  console: (code, seed) => [
    `Консоль ${code} ORAC DECOR — декоративний кронштейн, який використовують як опору під поличку, стільницю або як самостійний настінний акцент.`,
    `Елемент добре поєднується з карнизами та молдингами тієї ж серії, утворюючи цілісну композицію.`,
  ],
  ornamentPiece: (code, seed) => [
    `Орнамент ${code} ORAC DECOR — накладний рельєфний елемент для точкового декорування стін, меблів чи дверних порталів.`,
    `Невеликий рельєфний акцент легко клеїться на підготовлену поверхню та фарбується в будь-який колір інтер’єру.`,
  ],
  glue: (code, seed) => [
    `${code ? `Клей ${code} ` : 'Клей '}ORAC DECOR призначений для монтажу поліуретанового та дюрополімерного декору — карнизів, молдингів, панелей і колон.`,
    `Склад забезпечує міцне зчеплення декоративних елементів зі стіною чи стелею та зручний у нанесенні за допомогою монтажного пістолета.`,
  ],
  filler: (code, seed) => [
    `Шпаклівка Декофіллер ORAC DECOR використовується для загладжування стиків між елементами декору та маскування кріпильних отворів.`,
    `Після висихання шпаклівку легко шліфують, отримуючи непомітний, рівний шов між сусідніми елементами.`,
  ],
  accessory: (code, seed) => [
    `${code ? `Елемент ${code} ` : 'Елемент '}ORAC DECOR доповнює колекцію декоративних профілів бренду та використовується разом з іншими елементами серії.`,
    `Виріб підбирають під конкретний проєкт інтер’єру у поєднанні з карнизами, молдингами чи панелями тієї ж колекції.`,
  ],
}

function buildDescription(product, sectionTitle) {
  const nameUk = product.name_uk || product.name || ''
  const code = extractCode(nameUk)
  const kind = classify(nameUk)
  const seed = hash(String(product.id))
  const ch = product.characteristics || {}

  const skipMaterialLine = kind === 'glue' || kind === 'filler'
  const intro = TEMPLATES[kind](code, seed)
  const material =
    !skipMaterialLine && /поліуретан|дюрополімер/i.test(ch.material || '')
      ? materialLine(ch.material, seed)
      : ''
  const dims = dimsLine(ch, seed + 7)
  const closer = pick(CLOSERS, seed + 13)

  return [...intro, material, dims, closer].filter(Boolean).join(' ')
}

async function main() {
  const raw = await readFile(FILE, 'utf-8')
  const data = JSON.parse(raw)

  let count = 0
  for (const section of data.sections) {
    for (const product of section.products) {
      product.description_uk = buildDescription(product, section.title_uk || section.title)
      count++
    }
  }

  await writeFile(FILE, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  console.log(`Rewrote description_uk for ${count} ORAC DECOR products.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
