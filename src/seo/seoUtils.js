export const SITE_NAME = 'Гільдія Декору'
export const DEFAULT_DESCRIPTION =
  'Гільдія Декору у Києві: декоративні фарби OIKOS, ліпнина ORAC DECOR, консультація, підбір матеріалів та замовлення для інтерʼєру.'
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
