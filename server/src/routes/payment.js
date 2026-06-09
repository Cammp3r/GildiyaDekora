import { randomBytes } from 'node:crypto'
import express from 'express'
import { Prisma } from '@prisma/client'
import {
  LIQPAY_CHECKOUT_URL,
  createLiqPaySignature,
  decodeLiqPayData,
  encodeLiqPayData,
  verifyLiqPaySignature,
} from '../lib/liqpay.js'
import { resolveCartItem } from '../lib/catalog.js'

function sanitizeText(value, maxLen = 1000) {
  if (typeof value !== 'string') return ''
  let text = value.replace(/<[^>]*>/g, '')
  text = text.replace(/[\u0000-\u001F\u007F]+/g, ' ')
  text = text.replace(/\s+/g, ' ').trim()
  return text.slice(0, maxLen)
}

function createOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase()
  const suffix = randomBytes(3).toString('hex').toUpperCase()
  return `GD-${stamp}-${suffix}`
}

function roundAmount(value) {
  return Math.round(Number(value) * 100) / 100
}

function mapCheckoutStatus(status) {
  const normalized = String(status ?? '').toLowerCase()

  if (['success', 'sandbox', 'subscribed'].includes(normalized)) {
    return 'paid'
  }

  if (['failure', 'error', 'reversed', 'expired'].includes(normalized)) {
    return 'failed'
  }

  if (['canceled', 'cancelled'].includes(normalized)) {
    return 'canceled'
  }

  return 'pending'
}

function getPublicUrls(config, orderNumber) {
  const frontendUrl = config.frontendUrl.replace(/\/$/, '')
  const webhookUrl = config.webhookUrl.replace(/\/$/, '')

  return {
    resultUrl: `${frontendUrl}/order?payment=success&order=${encodeURIComponent(orderNumber)}`,
    serverUrl: webhookUrl,
  }
}

function serializeOrder(order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    customerComment: order.customerComment,
    currency: order.currency,
    amount: Number(order.amount),
    status: order.status,
    items: order.items,
    liqpayStatus: order.liqpayStatus,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

function getPrisma(req) {
  return req.app.locals.prisma
}

async function createValidatedItems(items) {
  const normalized = []

  for (const item of items) {
    const resolved = await resolveCartItem(item)
    const quantity = Math.max(1, Math.floor(Number(item?.quantity) || 0))
    normalized.push({
      productId: resolved.productId,
      variantId: resolved.variantId,
      title: sanitizeText(resolved.title, 200),
      variantTitle: sanitizeText(resolved.variantTitle ?? '', 200),
      volume: sanitizeText(resolved.volume ?? '', 50),
      quantity,
      unitPrice: Number(resolved.unitPrice),
      priceCurrency: 'UAH',
      texture: sanitizeText(String(item?.texture ?? ''), 100),
      color: sanitizeText(String(item?.color ?? ''), 100),
    })
  }

  return normalized
}

export function createPaymentRouter(config) {
  const router = express.Router()

  router.post('/init', async (req, res, next) => {
    try {
      const prisma = getPrisma(req)
      const customer = req.body?.customer ?? req.body ?? {}
      const items = Array.isArray(req.body?.items) ? req.body.items : []

      if (!config.liqpayPublicKey || !config.liqpayPrivateKey) {
        return res.status(500).json({ error: 'LiqPay is not configured.' })
      }

      if (!customer?.name || !customer?.email || !customer?.phone) {
        return res.status(400).json({ error: 'Customer contact details are required.' })
      }

      if (!items.length) {
        return res.status(400).json({ error: 'Cart is empty.' })
      }

      const normalizedItems = await createValidatedItems(items)
      const amount = roundAmount(
        normalizedItems.reduce((sum, item) => sum + Number(item.unitPrice) * Number(item.quantity), 0)
      )

      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Order amount is invalid.' })
      }

      const orderNumber = createOrderNumber()
      const { resultUrl, serverUrl } = getPublicUrls(config, orderNumber)
      const checkoutPayload = {
        version: 3,
        public_key: config.liqpayPublicKey,
        action: 'pay',
        amount: amount.toFixed(2),
        currency: 'UAH',
        description: `Замовлення ${orderNumber} — Гільдія Декора`,
        order_id: orderNumber,
        result_url: resultUrl,
        server_url: serverUrl,
        language: 'uk',
        sandbox: config.liqpaySandbox ? 1 : 0,
      }

      const data = encodeLiqPayData(checkoutPayload)
      const signature = createLiqPaySignature(config.liqpayPrivateKey, data)

      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerName: sanitizeText(String(customer.name), 120),
          customerEmail: sanitizeText(String(customer.email), 120),
          customerPhone: sanitizeText(String(customer.phone), 40),
          customerComment: sanitizeText(String(customer.message ?? customer.comment ?? ''), 1000) || null,
          amount: new Prisma.Decimal(amount.toFixed(2)),
          currency: 'UAH',
          status: 'pending',
          items: normalizedItems,
          checkoutPayload,
          liqpayData: data,
          liqpaySignature: signature,
        },
      })

      await prisma.paymentLog.create({
        data: {
          orderId: order.id,
          event: 'init',
          payload: { orderNumber, amount, items: normalizedItems, checkoutPayload },
          signature,
          verified: true,
        },
      })

      return res.json({
        order: serializeOrder(order),
        checkoutUrl: LIQPAY_CHECKOUT_URL,
        data,
        signature,
        amount,
      })
    } catch (error) {
      return next(error)
    }
  })

  router.post('/callback', async (req, res, next) => {
    try {
      const prisma = getPrisma(req)
      const data = String(req.body?.data ?? '')
      const signature = String(req.body?.signature ?? '')

      if (!verifyLiqPaySignature(config.liqpayPrivateKey, data, signature)) {
        await prisma.paymentLog.create({
          data: {
            event: 'callback-invalid-signature',
            payload: req.body ?? {},
            signature: signature || null,
            verified: false,
          },
        })

        return res.status(403).json({ error: 'Invalid LiqPay signature.' })
      }

      const payload = decodeLiqPayData(data)
      const orderNumber = String(payload.order_id ?? '').trim()

      if (!orderNumber) {
        return res.status(400).json({ error: 'Missing order_id.' })
      }

      const order = await prisma.order.findUnique({ where: { orderNumber } })
      if (!order) {
        return res.status(404).json({ error: 'Order not found.' })
      }

      const nextStatus = mapCheckoutStatus(payload.status)
      const now = new Date()

      await prisma.paymentLog.create({
        data: {
          orderId: order.id,
          event: 'callback',
          payload,
          signature,
          verified: true,
        },
      })

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: nextStatus,
          liqpayStatus: String(payload.status ?? ''),
          liqpayCallbackData: payload,
          paidAt: nextStatus === 'paid' ? order.paidAt ?? now : order.paidAt,
        },
      })

      return res.status(200).send('OK')
    } catch (error) {
      return next(error)
    }
  })

  router.get('/order/:orderNumber', async (req, res, next) => {
    try {
      const prisma = getPrisma(req)
      const orderNumber = String(req.params.orderNumber ?? '').trim()

      if (!orderNumber) {
        return res.status(400).json({ error: 'Missing order number.' })
      }

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

  return router
}