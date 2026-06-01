import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { DEFAULT_DESCRIPTION, DEFAULT_IMAGE, SITE_NAME, absoluteUrl } from './seoUtils.js'

function setMeta(selector, attributes) {
  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      element.removeAttribute(key)
    } else {
      element.setAttribute(key, String(value))
    }
  })
}

function setLink(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`)

  if (!href) {
    element?.remove()
    return
  }

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

function setJsonLd(id, data) {
  const existing = document.getElementById(id)

  if (!data) {
    existing?.remove()
    return
  }

  const element = existing || document.createElement('script')
  element.id = id
  element.type = 'application/ld+json'
  element.textContent = JSON.stringify(data)

  if (!existing) document.head.appendChild(element)
}

export function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
  canonicalPath,
  jsonLd,
}) {
  const location = useLocation()

  useEffect(() => {
    const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
    const canonicalUrl = absoluteUrl(canonicalPath || location.pathname)
    const imageUrl = absoluteUrl(image)
    const robots = noindex ? 'noindex, nofollow' : 'index, follow'

    document.documentElement.lang = 'uk'
    document.title = pageTitle

    setMeta('meta[name="description"]', { name: 'description', content: description })
    setMeta('meta[name="robots"]', { name: 'robots', content: robots })
    setMeta('meta[name="theme-color"]', { name: 'theme-color', content: '#111111' })

    setMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME })
    setMeta('meta[property="og:type"]', { property: 'og:type', content: type })
    setMeta('meta[property="og:title"]', { property: 'og:title', content: pageTitle })
    setMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: description,
    })
    setMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
    setMeta('meta[property="og:image"]', { property: 'og:image', content: imageUrl })

    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: pageTitle })
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: imageUrl })

    setLink('canonical', canonicalUrl)
    setJsonLd('seo-jsonld', jsonLd)

    return () => {
      setJsonLd('seo-jsonld', null)
    }
  }, [canonicalPath, description, image, jsonLd, location.pathname, noindex, title, type])

  return null
}
