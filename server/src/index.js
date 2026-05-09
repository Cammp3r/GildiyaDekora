import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import paymentRoutes from './routes/payment.js'

dotenv.config()

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.SERVER_PORT || 5000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

// Important: Parse webhook data BEFORE JSON middleware
app.use('/api/payment/webhook', express.urlencoded({ extended: true }))
app.use(express.json())

// Routes
app.use('/api/payment', paymentRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})

export { prisma, app }
