import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')
const srcLogos = path.join(root, 'src', 'logos')
const publicDir = path.join(root, 'public')

const files = ['logo.png', 'logo-transparent.png']

if (!fs.existsSync(publicDir)) {
  console.error('Public directory not found:', publicDir)
  process.exit(1)
}

files.forEach((file) => {
  const src = path.join(srcLogos, file)
  const dest = path.join(publicDir, file)
  if (!fs.existsSync(src)) {
    console.warn('Source logo missing:', src)
    return
  }
  fs.copyFileSync(src, dest)
  console.log(`Copied ${file} → public/`)
})

console.log('Done. Verify files at public/ and commit them to deploy.')
