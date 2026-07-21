export const SITE_NAME = 'Гільдія Декора'
export const DEFAULT_DESCRIPTION =
  'Гільдія Декора у Києві: декоративні фарби OIKOS, ліпнина ORAC DECOR, консультація, підбір матеріалів та замовлення для інтерʼєру.'
export const DEFAULT_IMAGE = '/logo-transparent.png'

export function getSiteUrl() {
  const envUrl = import.meta.env.VITE_SITE_URL
  if (envUrl) return envUrl.replace(/\/+$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

export function absoluteUrl(value) {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  const siteUrl = getSiteUrl()
  const path = value.startsWith('/') ? value : `/${value}`
  return `${siteUrl}${path}`
}

const MAX_TITLE_LENGTH = 65
const SITE_NAME_SUFFIX_RE = new RegExp(`\\s*\\|\\s*${SITE_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i')

// Builds the final <title> tag: appends the site name once (callers should
// not include it themselves) and truncates so the total stays within the
// 35-65 char range SEO tools check for.
export function buildPageTitle(title) {
  if (!title) return SITE_NAME
  const base = title.replace(SITE_NAME_SUFFIX_RE, '').trim()
  const full = `${base} | ${SITE_NAME}`
  if (full.length <= MAX_TITLE_LENGTH) return full

  const suffix = ` | ${SITE_NAME}`
  const budget = MAX_TITLE_LENGTH - suffix.length - 1
  if (budget <= 10) return `${full.slice(0, MAX_TITLE_LENGTH - 1)}…`
  return `${base.slice(0, budget).trimEnd()}…${suffix}`
}
