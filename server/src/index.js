import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { createAdminRouter } from './routes/admin.js'
import { createPaymentRouter } from './routes/payment.js'
import { createReviewsRouter } from './routes/reviews.js'

const currentDir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(currentDir, '../.env') })

const prisma = new PrismaClient()
const app = express()

const frontendUrl = String(process.env.FRONTEND_URL ?? '').trim() || 'http://localhost:5173'
const publicApiUrl = String(process.env.PUBLIC_API_URL ?? '').trim() || 'http://localhost:3001'
const corsOrigins = String(process.env.CORS_ORIGIN ?? frontendUrl)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

app.locals.prisma = prisma

const restrictedCors = cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.length === 0 || corsOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
})

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false }))

app.use(
  '/api/payment',
  restrictedCors,
  createPaymentRouter({
    liqpayPublicKey: String(process.env.LIQPAY_PUBLIC_KEY ?? '').trim(),
    liqpayPrivateKey: String(process.env.LIQPAY_PRIVATE_KEY ?? '').trim(),
    liqpaySandbox: String(process.env.LIQPAY_SANDBOX ?? '1').trim() !== '0',
    frontendUrl,
    webhookUrl: String(process.env.LIQPAY_WEBHOOK_URL ?? '').trim() || `${publicApiUrl.replace(/\/$/, '')}/api/payment/callback`,
  })
)

app.use(
  '/api/admin',
  restrictedCors,
  createAdminRouter({
    adminToken: String(process.env.ADMIN_API_TOKEN ?? '').trim(),
  })
)

// Deliberately open to any origin (read: public review data anyway; write:
// moderated before publishing) — the Netlify build's prerender step renders
// every product page against a local preview server (http://localhost:4174,
// not the production domain), so restricting this to the production origin
// would silently strip aggregateRating/review from the static HTML Google
// actually crawls, even though it'd keep working for real site visitors.
app.use('/api/reviews', cors(), createReviewsRouter())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'gildiyadekora-server' })
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'Internal server error' })
})

const port = Number(process.env.PORT ?? 3001)
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down...`)
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
