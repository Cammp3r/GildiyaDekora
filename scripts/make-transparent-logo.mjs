import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'

function clamp01(value) {
  return Math.max(0, Math.min(1, value))
}

function rgbToHsv(r, g, b) {
  const rN = r / 255
  const gN = g / 255
  const bN = b / 255

  const max = Math.max(rN, gN, bN)
  const min = Math.min(rN, gN, bN)
  const delta = max - min

  const v = max
  const s = max === 0 ? 0 : delta / max

  return { s, v }
}

function findOpaqueBounds(png, alphaThreshold = 8) {
  const { width, height, data } = png

  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) * 4
      const a = data[idx + 3]
      if (a > alphaThreshold) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX === -1) return null
  return { minX, minY, maxX, maxY }
}

function cropPng(png, bounds, padding = 6) {
  const { width, height, data } = png
  const { minX, minY, maxX, maxY } = bounds

  const left = Math.max(0, minX - padding)
  const top = Math.max(0, minY - padding)
  const right = Math.min(width - 1, maxX + padding)
  const bottom = Math.min(height - 1, maxY + padding)

  const outWidth = right - left + 1
  const outHeight = bottom - top + 1
  const out = new PNG({ width: outWidth, height: outHeight })

  for (let y = 0; y < outHeight; y++) {
    for (let x = 0; x < outWidth; x++) {
      const srcIdx = (width * (top + y) + (left + x)) * 4
      const dstIdx = (outWidth * y + x) * 4
      out.data[dstIdx] = data[srcIdx]
      out.data[dstIdx + 1] = data[srcIdx + 1]
      out.data[dstIdx + 2] = data[srcIdx + 2]
      out.data[dstIdx + 3] = data[srcIdx + 3]
    }
  }

  return out
}

function resizePngBilinear(png, maxDim = 512) {
  const { width: srcW, height: srcH } = png
  const scale = maxDim / Math.max(srcW, srcH)

  if (scale >= 1) return png

  const dstW = Math.max(1, Math.round(srcW * scale))
  const dstH = Math.max(1, Math.round(srcH * scale))
  const out = new PNG({ width: dstW, height: dstH })

  const src = png.data
  const dst = out.data

  for (let y = 0; y < dstH; y++) {
    const srcY = (y + 0.5) / scale - 0.5
    const y0 = Math.max(0, Math.floor(srcY))
    const y1 = Math.min(srcH - 1, y0 + 1)
    const wy = srcY - y0

    for (let x = 0; x < dstW; x++) {
      const srcX = (x + 0.5) / scale - 0.5
      const x0 = Math.max(0, Math.floor(srcX))
      const x1 = Math.min(srcW - 1, x0 + 1)
      const wx = srcX - x0

      const i00 = (srcW * y0 + x0) * 4
      const i10 = (srcW * y0 + x1) * 4
      const i01 = (srcW * y1 + x0) * 4
      const i11 = (srcW * y1 + x1) * 4

      const o = (dstW * y + x) * 4

      for (let c = 0; c < 4; c++) {
        const p00 = src[i00 + c]
        const p10 = src[i10 + c]
        const p01 = src[i01 + c]
        const p11 = src[i11 + c]

        const top = p00 * (1 - wx) + p10 * wx
        const bottom = p01 * (1 - wx) + p11 * wx
        dst[o + c] = Math.round(top * (1 - wy) + bottom * wy)
      }
    }
  }

  return out
}

function removeGrayBackground(png) {
  const { width, height, data } = png

  // Tuned for light gray/white checkerboard backgrounds.
  const hardSat = 0.12
  const hardVal = 0.45

  const softSat = 0.22
  const softVal = 0.60

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const a = data[idx + 3]

      if (a === 0) continue

      const { s, v } = rgbToHsv(r, g, b)

      if (s < hardSat && v > hardVal) {
        data[idx + 3] = 0
        continue
      }

      // Soft fade for near-background pixels (helps anti-aliased edges).
      if (s < softSat && v > softVal) {
        const satT = clamp01((s - hardSat) / (softSat - hardSat))
        const valT = clamp01((v - softVal) / (1 - softVal))
        const keep = clamp01(satT * (1 - valT))
        data[idx + 3] = Math.round(a * keep)
      }
    }
  }

  return png
}

function usageAndExit() {
  console.error('Usage: node scripts/make-transparent-logo.mjs <input.png> <output.png>')
  process.exit(1)
}

const [inputArg, outputArg] = process.argv.slice(2)
if (!inputArg || !outputArg) usageAndExit()

const inputPath = path.resolve(process.cwd(), inputArg)
const outputPath = path.resolve(process.cwd(), outputArg)

const inputBuffer = fs.readFileSync(inputPath)
const png = PNG.sync.read(inputBuffer)

removeGrayBackground(png)

const bounds = findOpaqueBounds(png)
const cropped = bounds ? cropPng(png, bounds, 6) : png
const outPng = resizePngBilinear(cropped, 512)

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, PNG.sync.write(outPng))

console.log(`Wrote ${outputArg}`)
