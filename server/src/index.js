/* global process */
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import rateLimit from 'express-rate-limit'
import paymentRoutes from './routes/payment.js'

dotenv.config()

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.SERVER_PORT || process.env.SERVER_PORT || 5000

app.set('trust proxy', 1)

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173', 
    'https://endearing-kelpie-00eca5.netlify.app',
    'https://gihldihja-decora.ua'
    ],
    credentials: true,
}));

app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  next()
})

app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`)
  }

  next()
})

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
})

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
})

app.use('/api', apiLimiter)

// Important: Parse webhook data BEFORE JSON middleware
app.use('/api/payment/webhook', webhookLimiter, express.urlencoded({ extended: true }))
app.use(express.json())

// Routes
app.use('/api/payment', paymentRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Error handler
app.use((err, req, res, _next) => {
  void _next
  console.error('Error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})

export { prisma, app }
