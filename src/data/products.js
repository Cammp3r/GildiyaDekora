import dtb from '../../dtb.json'
import oracDecor from '../../orac_decor.json'
import fallbackImage from '../logos/logo.png'

export const PRIVATBANK_EUR_TO_UAH = 51.95
export const PRIVATBANK_RATE_DATE = '03.05.2026'

function toArray(value) {
  return Array.isArray(value) ? value : []
}

function toNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : fallback
}

function toUah(price, currency) {
  const num = toNumber(price)
  if (num === null) return null
  return currency === 'EUR' ? Math.round(num * PRIVATBANK_EUR_TO_UAH) : num
}

function normalizeVolume(volume) {
  const value = String(volume ?? '').trim()
  if (!value) return ''

  const compact = value
    .replace(/\s+/g, ' ')
    .replace(/^([A-Za-z]+)\.\s*/i, '$1 ')
    .replace(/^([A-Za-z]+)(?=\d)/i, '$1 ')
    .trim()

  const match = compact.match(/^([A-Za-z]+)\s*([0-9]+(?:[,.][0-9]+)?)$/)
  if (!match) return value

  const unit = match[1].toUpperCase()
  const amount = match[2].replace('.', ',')
  const units = {
    KG: 'кг',
    GR: 'г',
    G: 'г',
    LT: 'л',
    L: 'л',
    ML: 'мл',
  }

  return units[unit] ? `${amount} ${units[unit]}` : value
}

function normalizeVariantTitle(title, rawVolume, volume) {
  const value = String(title ?? '').trim()
  if (!value) return volume
  const raw = String(rawVolume ?? '').trim()
  if (!raw || !volume) return value
  return value.replace(raw, volume).replace(/\s+/g, ' ').trim()
}

function normalizeColors(colors) {
  return toArray(colors)
    .filter(Boolean)
    .map((color) => {
      if (typeof color === 'string') return { code: color, img: '' }
      return {
        code: color.code ?? color.name ?? '',
        img: color.img ?? '',
      }
    })
    .filter((c) => Boolean(c.code) || Boolean(c.img))
}

function normalizeTextures(textures) {
  return toArray(textures)
    .filter(Boolean)
    .map((texture) => {
      if (typeof texture === 'string') return { name: texture, url: '' }
      return {
        name: texture.name ?? '',
        url: texture.url ?? '',
      }
    })
    .filter((t) => Boolean(t.name) || Boolean(t.url))
}

function normalizePhotos(photos) {
  return toArray(photos).filter((p) => typeof p === 'string' && p.trim().length > 0)
}

const ORAC_CATEGORY_UK = {
  'Карнизы': 'Карнизи',
  'Молдинги': 'Молдинги',
  'Напольный плинтус': 'Підлоговий плінтус',
  'Скрытое освещение': 'Приховане освітлення',
  'Декоративные элементы': 'Декоративні елементи',
}

const ORAC_TEXT_REPLACEMENTS = [
  [/скрытого освещения/gi, 'прихованого освітлення'],
  [/скрытое освещение/gi, 'приховане освітлення'],
  [/скрытым освещением/gi, 'прихованим освітленням'],
  [/светодиодной лентой/gi, 'світлодіодною стрічкою'],
  [/светодиодного освещения/gi, 'світлодіодного освітлення'],
  [/освещения/gi, 'освітлення'],
  [/освещение/gi, 'освітлення'],
  [/освещает/gi, 'освітлює'],
  [/осветить/gi, 'освітити'],
  [/осветительные/gi, 'освітлювальні'],
  [/напольный плинтус/gi, 'підлоговий плінтус'],
  [/напольного плинтуса/gi, 'підлогового плінтуса'],
  [/напольных покрытий/gi, 'підлогових покриттів'],
  [/декоративные элементы/gi, 'декоративні елементи'],
  [/декоративный элемент/gi, 'декоративний елемент'],
  [/декоративным элементом/gi, 'декоративним елементом'],
  [/дверное обрамление/gi, 'дверне обрамлення'],
  [/потолочная розетка/gi, 'стельова розетка'],
  [/потолочные розетки/gi, 'стельові розетки'],
  [/стеновая панель/gi, 'стінова панель'],
  [/стеновые панели/gi, 'стінові панелі'],
  [/панели/gi, 'панелі'],
  [/из полиуретана/gi, 'з поліуретану'],
  [/из поліуретану/gi, 'з поліуретану'],
  [/из дюрополимера/gi, 'з дюрополімеру'],
  [/высококачественного/gi, 'високоякісного'],
  [/высококачественный/gi, 'високоякісний'],
  [/высококачественная/gi, 'високоякісна'],
  [/высококачественные/gi, 'високоякісні'],
  [/высокопрочный/gi, 'високоміцний'],
  [/прочный/gi, 'міцний'],
  [/прочная/gi, 'міцна'],
  [/прочные/gi, 'міцні'],
  [/прочностью/gi, 'міцністю'],
  [/долговечный/gi, 'довговічний'],
  [/долговечная/gi, 'довговічна'],
  [/долговечное/gi, 'довговічне'],
  [/долговечность/gi, 'довговічність'],
  [/изготовлен/gi, 'виготовлений'],
  [/изготовлена/gi, 'виготовлена'],
  [/изготовлено/gi, 'виготовлено'],
  [/произведен/gi, 'вироблений'],
  [/произведена/gi, 'вироблена'],
  [/производится/gi, 'виробляється'],
  [/производятся/gi, 'виробляються'],
  [/производитель/gi, 'виробник'],
  [/страна-производитель/gi, 'країна-виробник'],
  [/бельгийская/gi, 'бельгійська'],
  [/бельгийский/gi, 'бельгійський'],
  [/Бельгии/g, 'Бельгії'],
  [/Бельгия/g, 'Бельгія'],
  [/это/gi, 'це'],
  [/этот/gi, 'цей'],
  [/эта/gi, 'ця'],
  [/эти/gi, 'ці'],
  [/элемент/gi, 'елемент'],
  [/элементы/gi, 'елементи'],
  [/эстетический/gi, 'естетичний'],
  [/эстетической/gi, 'естетичної'],
  [/эстетичный/gi, 'естетичний'],
  [/эффект/gi, 'ефект'],
  [/эффектный/gi, 'ефектний'],
  [/элегантный/gi, 'елегантний'],
  [/элегантная/gi, 'елегантна'],
  [/элегантное/gi, 'елегантне'],
  [/изысканный/gi, 'вишуканий'],
  [/изысканная/gi, 'вишукана'],
  [/изысканное/gi, 'вишукане'],
  [/изысканность/gi, 'вишуканість'],
  [/роскоши/gi, 'розкоші'],
  [/уникальный/gi, 'унікальний'],
  [/уникальная/gi, 'унікальна'],
  [/уникальные/gi, 'унікальні'],
  [/отличное решение/gi, 'чудове рішення'],
  [/лучших выборов/gi, 'найкращих варіантів'],
  [/выбор/gi, 'вибір'],
  [/товар/gi, 'товар'],
  [/изделие/gi, 'виріб'],
  [/изделия/gi, 'виробу'],
  [/продукт/gi, 'продукт'],
  [/материал/gi, 'матеріал'],
  [/материала/gi, 'матеріалу'],
  [/материалы/gi, 'матеріали'],
  [/легкий/gi, 'легкий'],
  [/лёгкий/gi, 'легкий'],
  [/легкость/gi, 'легкість'],
  [/влаг[еи]/gi, 'вологи'],
  [/влагостойкий/gi, 'вологостійкий'],
  [/устойчивость/gi, 'стійкість'],
  [/устойчивый/gi, 'стійкий'],
  [/устойчивые/gi, 'стійкі'],
  [/стойкость/gi, 'стійкість'],
  [/воздействию/gi, 'впливу'],
  [/повреждений/gi, 'пошкоджень'],
  [/поверхность/gi, 'поверхню'],
  [/поверхности/gi, 'поверхні'],
  [/стены/gi, 'стіни'],
  [/стен/gi, 'стін'],
  [/потолка/gi, 'стелі'],
  [/потолок/gi, 'стеля'],
  [/помещения/gi, 'приміщення'],
  [/помещение/gi, 'приміщення'],
  [/комнаты/gi, 'кімнати'],
  [/комнату/gi, 'кімнату'],
  [/интерьера/gi, 'інтер`єру'],
  [/интерьер/gi, 'інтер`єр'],
  [/дизайне/gi, 'дизайні'],
  [/дизайн/gi, 'дизайн'],
  [/современного/gi, 'сучасного'],
  [/современный/gi, 'сучасний'],
  [/классическом/gi, 'класичному'],
  [/классический/gi, 'класичний'],
  [/дом[ае]/gi, 'домі'],
  [/вашем/gi, 'вашому'],
  [/вашего/gi, 'вашого'],
  [/вашу/gi, 'вашу'],
  [/своем/gi, 'своєму'],
  [/своего/gi, 'свого'],
  [/позволяет/gi, 'дозволяє'],
  [/позволят/gi, 'дозволять'],
  [/можно/gi, 'можна'],
  [/может быть/gi, 'може бути'],
  [/создать/gi, 'створити'],
  [/создает/gi, 'створює'],
  [/создан/gi, 'створений'],
  [/создана/gi, 'створена'],
  [/созданные/gi, 'створені'],
  [/придает/gi, 'надає'],
  [/придавая/gi, 'надаючи'],
  [/добавит/gi, 'додасть'],
  [/добавляет/gi, 'додає'],
  [/украшения/gi, 'оздоблення'],
  [/украшение/gi, 'оздоблення'],
  [/украсить/gi, 'прикрасити'],
  [/оформления/gi, 'оформлення'],
  [/оформить/gi, 'оформити'],
  [/отделки/gi, 'оздоблення'],
  [/лепное/gi, 'ліпне'],
  [/лепка/gi, 'ліпнина'],
  [/монтажный клей/gi, 'монтажний клей'],
  [/стыковочный клей/gi, 'стиковий клей'],
  [/клеится/gi, 'клеїться'],
  [/установке/gi, 'встановлення'],
  [/установить/gi, 'встановити'],
  [/устанавливается/gi, 'встановлюється'],
  [/монтажа/gi, 'монтажу'],
  [/монтаж элементов/gi, 'монтаж елементів'],
  [/Вам понадобится/g, 'Вам знадобиться'],
  [/вам понадобится/gi, 'вам знадобиться'],
  [/надежно/gi, 'надійно'],
  [/надёжно/gi, 'надійно'],
  [/надежный/gi, 'надійний'],
  [/надёжный/gi, 'надійний'],
  [/без швов/gi, 'без швів'],
  [/внешний вид/gi, 'зовнішній вигляд'],
  [/идеальный/gi, 'ідеальний'],
  [/идеальное/gi, 'ідеальне'],
  [/размеры/gi, 'розміри'],
  [/размер/gi, 'розмір'],
  [/длина/gi, 'довжина'],
  [/длину/gi, 'довжину'],
  [/ширина/gi, 'ширина'],
  [/ширину/gi, 'ширину'],
  [/высота/gi, 'висота'],
  [/высоту/gi, 'висоту'],
  [/радиус изгиба/gi, 'радіус вигину'],
  [/гибкая версия/gi, 'гнучка версія'],
  [/гибкий/gi, 'гнучкий'],
  [/гибкая/gi, 'гнучка'],
  [/гибкие/gi, 'гнучкі'],
  [/гибкого/gi, 'гнучкого'],
  [/гибкость/gi, 'гнучкість'],
  [/изогнутые/gi, 'вигнуті'],
  [/изогнутые поверхности/gi, 'вигнуті поверхні'],
  [/любой/gi, 'будь-який'],
  [/любом/gi, 'будь-якому'],
  [/любое/gi, 'будь-яке'],
  [/различных/gi, 'різних'],
  [/разные/gi, 'різні'],
  [/несколькими/gi, 'кількома'],
  [/прекрасный/gi, 'чудовий'],
  [/прекрасная/gi, 'чудова'],
  [/привлекательный/gi, 'привабливий'],
  [/красивая/gi, 'красива'],
  [/красивым/gi, 'красивим'],
  [/ярким/gi, 'яскравим'],
  [/белый/gi, 'білий'],
  [/белого/gi, 'білого'],
  [/цвет/gi, 'колір'],
  [/цвета/gi, 'кольору'],
  [/цветовые/gi, 'кольорові'],
  [/качество/gi, 'якість'],
  [/качества/gi, 'якості'],
  [/качественных/gi, 'якісних'],
  [/химикатов/gi, 'хімікатів'],
  [/пространства/gi, 'простору'],
  [/пространство/gi, 'простір'],
  [/дверей/gi, 'дверей'],
  [/окон/gi, 'вікон'],
  [/колонны/gi, 'колони'],
  [/колонну/gi, 'колону'],
  [/колонна/gi, 'колона'],
  [/полуколонна/gi, 'напівколона'],
  [/капитель/gi, 'капітель'],
  [/пилястра/gi, 'пілястра'],
  [/трехмерной/gi, 'тривимірної'],
  [/объем[а]?/gi, 'об`єму'],
]

function formatOracText(text) {
  return String(text ?? '')
    .replace(/Orac\s*Decor/gi, 'Orac Decor')
    .replace(/Oracdecor/gi, 'Orac Decor')
    .replace(/Orac\s+Decor(?=[A-ZА-ЯІЇЄҐ0-9])/g, 'Orac Decor ')
    .replace(/LED(?=[А-ЯІЇЄҐ])/g, 'LED ')
    .replace(/([а-яіїєґ])(?=Orac Decor)/gi, '$1 ')
    .replace(/([а-яіїєґ])(?=LED)/gi, '$1 ')
    .replace(/([а-яіїєґ])(?=[A-Z][0-9])/g, '$1 ')
    .replace(/([.!?])(?=[А-ЯІЇЄҐA-Z])/g, '$1 ')
    .replace(/([,:;])(?=[А-Яа-яІіЇїЄєҐґA-Z0-9])/g, '$1 ')
    .replace(/([–-])(?=[А-Яа-яІіЇїЄєҐґA-Z0-9])/g, '$1 ')
    .replace(/(?<=[А-Яа-яІіЇїЄєҐґA-Z0-9])([–-])/g, ' $1')
    .replace(/(\d)(мм|см|м²|м)/gi, '$1 $2')
    .replace(/(\d)\s*[xх]\s*(\d)/gi, '$1 x $2')
    .replace(/\s+/g, ' ')
    .trim()
}

function translateOracText(text) {
  const formatted = formatOracText(text)
  return ORAC_TEXT_REPLACEMENTS.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    formatted
  )
    .replace(/`/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizePriceVariants(variants, currency = '') {
  return toArray(variants)
    .filter(Boolean)
    .map((variant, index) => {
      const rawVolume = variant.volume ?? ''
      const volume = normalizeVolume(rawVolume)
      const price = toUah(variant.price, variant.price_currency ?? currency)

      return {
        id: `${index}-${variant.title ?? variant.name ?? rawVolume}`,
        title: normalizeVariantTitle(variant.title ?? variant.name ?? '', rawVolume, volume),
        volume,
        price,
      }
    })
    .filter((variant) => variant.volume && Number.isFinite(Number(variant.price)))
}

function mapProduct(product, { brand = 'oikos', category, subcategory, sectionId }) {
  const photos = normalizePhotos(product.photos)
  const colors = normalizeColors(product.colors)
  const textures = normalizeTextures(product.textures)
  const primaryImage =
    photos[0] || colors.find((c) => c.img)?.img || product.image || fallbackImage

  const priceCurrency = product.price_currency ?? ''
  const price =
    product.price_m2 ??
    product.pricePerM2 ??
    product.price_per_m2 ??
    product.price ??
    null
  const priceVariants = normalizePriceVariants(
    product.price_variants ?? product.priceVariants,
    priceCurrency
  )
  const convertedPrice = priceVariants.length
    ? Math.min(...priceVariants.map((variant) => Number(variant.price)))
    : toUah(price, priceCurrency)

  const title =
    brand === 'orac-decor'
      ? translateOracText(product.name_uk ?? product.name ?? '')
      : product.name ?? ''
  const description =
    brand === 'orac-decor'
      ? translateOracText(product.description_uk ?? product.desc ?? product.description ?? '')
      : product.desc ?? product.description ?? ''

  return {
    id: String(product.id ?? product.url ?? product.name),
    title,
    brand,
    category,
    subcategory,
    description,
    image: primaryImage,
    photos,
    colors,
    textures,
    unitPrice: convertedPrice,
    price: convertedPrice,
    priceCurrency: 'UAH',
    priceSource: product.price_source ?? '',
    priceVariants,
    originalPriceCurrency: priceCurrency,
    exchangeRate: priceCurrency === 'EUR' ? PRIVATBANK_EUR_TO_UAH : null,
    finish: toArray(product.finish),
    base: product.base ?? '',
    effect: product.effect ?? '',
    url: product.url ?? '',
    eco: Boolean(product.eco),
    washable: Boolean(product.washable),
    formaldehydeFree: Boolean(product.formaldehyde_free),
    colorsCount: product.colors_count ?? product.colorsCount ?? null,
    colorsNote: product.colors_note ?? '',
    colorsCollection: product.colors_collection ?? product.colorsCollection ?? '',
    colorCollection: product.color_collection ?? '',
    colorCollectionUrl: product.color_collection_url ?? '',
    versions: toArray(product.versions),
    note: product.note ?? '',
    sectionId: sectionId ?? '',
    tags: toArray(product.tags),
  }
}

/**
 * Трансформує дані з dtb.json у формат, сумісний з UI
 */
function transformProductsData() {
  const products = []

  // Завантажуємо OIKOS продукти
  toArray(dtb.sections).forEach((section) => {
    const categoryName = section.title ?? section.id ?? ''

    // 1) Секції з прямим масивом продуктів (наприклад: interior-decor)
    if (Array.isArray(section.products) && section.products.length > 0) {
      section.products.forEach((product) => {
        products.push(
          mapProduct(product, {
            brand: 'oikos',
            category: categoryName,
            subcategory: product.subcategory ?? '',
            sectionId: section.id,
          })
        )
      })
      return
    }

    // 2) Секції з підкатегоріями (interior-paint, exterior-paint, інші)
    if (Array.isArray(section.subcategories) && section.subcategories.length > 0) {
      section.subcategories.forEach((subCategory) => {
        toArray(subCategory.products).forEach((product) => {
          products.push(
            mapProduct(product, {
              brand: 'oikos',
              category: categoryName,
              subcategory: subCategory.name ?? '',
              sectionId: section.id,
            })
          )
        })
      })
    }
  })

  // Завантажуємо ORAC DECOR продукти
  toArray(oracDecor.sections).forEach((section) => {
    const rawCategoryName = section.title_uk ?? section.title ?? section.id ?? ''
    const categoryName = ORAC_CATEGORY_UK[rawCategoryName] ?? translateOracText(rawCategoryName)

    if (Array.isArray(section.products) && section.products.length > 0) {
      section.products.forEach((product) => {
        products.push(
          mapProduct(product, {
            brand: 'orac-decor',
            category: categoryName,
            subcategory: product.subcategory ?? '',
            sectionId: section.id,
          })
        )
      })
    }
  })

  return products
}

export const productsDb = transformProductsData()
