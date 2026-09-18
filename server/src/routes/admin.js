import { createHash, timingSafeEqual } from 'node:crypto'
import express from 'express'

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

  router.get('/reviews', async (req, res, next) => {
    try {
      const prisma = getPrisma(req)
      const status = String(req.query.status ?? '').trim()
      const take = Math.min(Math.max(Number(req.query.take) || 100, 1), 500)
      const skip = Math.max(Number(req.query.skip) || 0, 0)

      const validStatuses = ['pending', 'approved', 'rejected']
      const reviews = await prisma.review.findMany({
        where: validStatuses.includes(status) ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      })

      return res.json({ reviews, take, skip })
    } catch (error) {
      return next(error)
    }
  })

  router.patch('/reviews/:id', async (req, res, next) => {
    try {
      const prisma = getPrisma(req)
      const id = String(req.params.id ?? '').trim()
      const newStatus = String(req.body?.status ?? '').trim()

      const valid = ['pending', 'approved', 'rejected']
      if (!valid.includes(newStatus)) {
        return res.status(400).json({ error: 'Невалідний статус.' })
      }

      const review = await prisma.review.update({
        where: { id },
        data: { status: newStatus },
      })

      return res.json({ review })
    } catch (error) {
      return next(error)
    }
  })

  router.delete('/reviews/:id', async (req, res, next) => {
    try {
      const prisma = getPrisma(req)
      const id = String(req.params.id ?? '').trim()

      await prisma.review.delete({ where: { id } })

      return res.json({ success: true })
    } catch (error) {
      return next(error)
    }
  })

  return router
}