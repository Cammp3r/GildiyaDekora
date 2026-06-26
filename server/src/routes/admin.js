import { createHash, timingSafeEqual } from 'node:crypto'
import express from 'express'
import { serializeOrder } from '../lib/orderUtils.js'

function getPrisma(req) {
  return req.app.locals.prisma
}

function safeTokenCompare(a, b) {
  try {
    const h = (s) => createHash('sha256').update(s).digest()
    return timingSafeEqual(h(a), h(b))
  } catch {
    return false
  }
}

export function createAdminRouter(config) {
  const router = express.Router()

  router.use((req, res, next) => {
    const provided = String(req.header('x-admin-token') ?? '').trim()

    if (!config.adminToken) {
      return res.status(500).json({ error: 'ADMIN_API_TOKEN is not configured.' })
    }

    if (!provided || !safeTokenCompare(provided, config.adminToken)) {
      return res.status(401).json({ error: 'Unauthorized.' })
    }

    return next()
  })

  router.get('/orders', async (req, res, next) => {
    try {
      const prisma = getPrisma(req)
      const status = String(req.query.status ?? '').trim()
      const take = Math.min(Math.max(Number(req.query.take) || 50, 1), 200)
      const skip = Math.max(Number(req.query.skip) || 0, 0)

      const orders = await prisma.order.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      })

      return res.json({
        orders: orders.map(serializeOrder),
        take,
        skip,
      })
    } catch (error) {
      return next(error)
    }
  })

  router.get('/orders/:orderNumber', async (req, res, next) => {
    try {
      const prisma = getPrisma(req)
      const orderNumber = String(req.params.orderNumber ?? '').trim()

      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: { paymentLogs: { orderBy: { createdAt: 'desc' } } },
      })

      if (!order) {
        return res.status(404).json({ error: 'Order not found.' })
      }

      return res.json({
        order: serializeOrder(order),
        paymentLogs: order.paymentLogs,
      })
    } catch (error) {
      return next(error)
    }
  })

  router.patch('/orders/:orderNumber', async (req, res, next) => {
    try {
      const prisma = getPrisma(req)
      const orderNumber = String(req.params.orderNumber ?? '').trim()
      const newStatus = String(req.body?.status ?? '').trim()

      const valid = ['pending', 'paid', 'failed', 'canceled', 'refunded']
      if (!valid.includes(newStatus)) {
        return res.status(400).json({ error: 'Невалідний статус.' })
      }

      const order = await prisma.order.update({
        where: { orderNumber },
        data: { status: newStatus },
      })

      return res.json({ order: serializeOrder(order) })
    } catch (error) {
      return next(error)
    }
  })

  router.delete('/orders/:orderNumber', async (req, res, next) => {
    try {
      const prisma = getPrisma(req)
      const orderNumber = String(req.params.orderNumber ?? '').trim()

      await prisma.order.delete({ where: { orderNumber } })

      return res.json({ success: true })
    } catch (error) {
      return next(error)
    }
  })

  return router
}