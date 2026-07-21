// Product photos are exported at ~1920px, but texture/color swatches and
// catalog cards only ever display them at 100-300px. A "-thumb" WebP
// variant (480px wide) is generated at build time — see
// scripts/generate-image-thumbnails.mjs — this points <img> tags at that
// smaller file instead of the full original.
export function thumbSrc(url) {
  if (!url) return url
  if (/^https?:\/\//i.test(url)) return url
  return url.replace(/\.\w+$/, '-thumb.webp')
}

// For the main/hero product photo (loading="eager", the LCP candidate) —
// capped at 1600px instead of the ~1920px original.
export function heroSrc(url) {
  if (!url) return url
  if (/^https?:\/\//i.test(url)) return url
  return url.replace(/\.\w+$/, '-lg.webp')
}
