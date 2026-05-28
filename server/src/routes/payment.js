/* global process */
import express from 'express'
import { prisma } from '../index.js'
import {
  generateSignature,
  verifySignature,
  encodePayload,
  decodePayload,
  generateOrderId,
} from '../utils/liqpay.js'
import { resolveLineItemPrice } from '../utils/productCatalog.js'

const router = express.Router()

router.post('/create-order', async (req, res) => {
  try {
    const { items, customerName, customerEmail, customerPhone } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' })
    }

    let amount = 0
    const resolvedItems = []

    for (const item of items) {
      const resolved = resolveLineItemPrice(item)
      if (!resolved.ok) {
        return res.status(400).json({ error: resolved.error })
      }

      amount += resolved.lineAmount
      resolvedItems.push({
        id: String(item.id),
        title: String(item.title ?? ''),
        variantId: String(item.variantId ?? ''),
        volume: String(item.volume ?? ''),
        quantity: resolved.quantity,
        unitPrice: resolved.unitPrice,
      })
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Order amount must be greater than 0' })
    }

    const orderId = generateOrderId()

    const order = await prisma.order.create({
      data: {
        orderId,
        items: JSON.stringify(resolvedItems),
        amount,
        currency: 'UAH',
        status: 'pending',
        customerName,
        customerEmail,
        customerPhone,
      },
    })

    const payload = {
      public_key: process.env.LIQPAY_PUBLIC_KEY,
      version: '3',
      action: 'pay',
      amount: order.amount.toFixed(2),
      currency: 'UAH',
      description: `Order #${order.orderId}`,
      order_id: order.orderId,
      server_url: process.env.LIQPAY_WEBHOOK_URL,
      ...(process.env.FRONTEND_URL ? { result_url: `${process.env.FRONTEND_URL.replace(/\/$/, '')}/payment/success/${order.orderId}` } : {}),
      ...(process.env.LIQPAY_SANDBOX === '1' && { sandbox: '1' }),
    }

    const data = encodePayload(payload)
    const signature = generateSignature(data, process.env.LIQPAY_PRIVATE_KEY)

    await prisma.order.update({
      where: { id: order.id },
      data: {
        liqpayData: data,
        liqpaySignature: signature,
      },
    })

    res.json({
      success: true,
      data,
      signature,
      orderId: order.orderId,
    })
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({ error: 'Failed to create order' })
  }
})

router.post('/webhook', async (req, res) => {
  try {
    const { data, signature } = req.body

    if (!verifySignature(data, signature, process.env.LIQPAY_PRIVATE_KEY)) {
      await prisma.paymentLog.create({
        data: {
          orderId: 'UNKNOWN',
          action: 'signature_verification_failed',
          payload: JSON.stringify({ data, signature }),
        },
      })

      return res.status(200).send('ok')
    }

    const payload = decodePayload(data)
    const { order_id, status, transaction_id } = payload

    const order = await prisma.order.findUnique({
      where: { orderId: order_id },
    })

    if (!order) {
      await prisma.paymentLog.create({
        data: {
          orderId: order_id,
          action: 'order_not_found',
          payload: JSON.stringify(payload),
        },
      })

      return res.status(200).send('ok')
    }

    if (Number.parseFloat(payload.amount) !== order.amount) {
      await prisma.paymentLog.create({
        data: {
          orderId: order_id,
          action: 'amount_mismatch',
          payload: JSON.stringify({ expected: order.amount, received: payload.amount }),
        },
      })

      return res.status(200).send('ok')
    }

    const newStatus = status === 'success' ? 'paid' : 'failed'

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        liqpayOrderId: transaction_id,
      },
    })

    await prisma.paymentLog.create({
      data: {
        orderId: order_id,
        action: 'status_updated',
        payload: JSON.stringify({ status: newStatus, transactionId: transaction_id }),
      },
    })

    res.status(200).send('ok')
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(200).send('ok')
  }
})

router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params

    const order = await prisma.order.findUnique({
      where: { orderId },
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    res.json({
      orderId: order.orderId,
      status: order.status,
      amount: order.amount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    res.status(500).json({ error: 'Failed to fetch order' })
  }
})

export default router