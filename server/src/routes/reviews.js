import express from 'express'

function getPrisma(req) {
  return req.app.locals.prisma
}

function serializeReview(review) {
  return {
    id: review.id,
    productId: review.productId,
    authorName: review.authorName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  }
}

export function createReviewsRouter() {
  const router = express.Router()

  // Public: approved reviews + aggregate rating for one product. Only
  // `approved` rows are ever returned here — this is also what feeds the
  // Product JSON-LD on the storefront, so a pending/rejected review must
  // never leak into either surface.
  router.get('/:productId', async (req, res, next) => {
    try {
      const prisma = getPrisma(req)
      const productId = String(req.params.productId ?? '').trim()
      if (!productId) return res.status(400).json({ error: 'productId is required.' })

      const reviews = await prisma.review.findMany({
        where: { productId, status: 'approved' },
        orderBy: { createdAt: 'desc' },
      })

      const count = reviews.length
      const average = count
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
        : 0

      return res.json({
        reviews: reviews.map(serializeReview),
        aggregate: { average, count },
      })
    } catch (error) {
      return next(error)
    }
  })

  // Public: submit a review — always lands as `pending` until an admin
  // approves it in /admin/reviews, so it can't be used to fabricate ratings.
  router.post('/', async (req, res, next) => {
    try {
      const prisma = getPrisma(req)
      const productId = String(req.body?.productId ?? '').trim()
      const productTitle = String(req.body?.productTitle ?? '').trim()
      const authorName = String(req.body?.authorName ?? '').trim()
      const comment = String(req.body?.comment ?? '').trim()
      const rating = Math.round(Number(req.body?.rating))

      if (!productId || !productTitle) {
        return res.status(400).json({ error: 'productId і productTitle обов’язкові.' })
      }
      if (!authorName || authorName.length > 80) {
        return res.status(400).json({ error: 'Вкажіть ім’я (до 80 символів).' })
      }
      if (!comment || comment.length < 10 || comment.length > 2000) {
        return res.status(400).json({ error: 'Відгук має містити від 10 до 2000 символів.' })
      }
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Оцінка має бути від 1 до 5.' })
      }

      const review = await prisma.review.create({
        data: { productId, productTitle, authorName, comment, rating, status: 'pending' },
      })

      return res.status(201).json({
        review: serializeReview(review),
        message: 'Дякуємо! Відгук зʼявиться на сайті після перевірки модератором.',
      })
    } catch (error) {
      return next(error)
    }
  })

  return router
}
