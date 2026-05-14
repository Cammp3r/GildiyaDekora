/**
 * usePayment - Hook для интеграции с платежной системой LiqPay
 */
import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export function usePayment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Создаёт заказ и возвращает LiqPay данные
   */
  const createOrder = async (items, customerInfo) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create order')
      }

      const result = await response.json()
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Отправляет форму оплаты на LiqPay
   */
  const submitToLiqPay = (data, signature) => {
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = 'https://www.liqpay.ua/api/3/checkout'

    const dataInput = document.createElement('input')
    dataInput.type = 'hidden'
    dataInput.name = 'data'
    dataInput.value = data

    const signatureInput = document.createElement('input')
    signatureInput.type = 'hidden'
    signatureInput.name = 'signature'
    signatureInput.value = signature

    form.appendChild(dataInput)
    form.appendChild(signatureInput)
    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  }

  /**
   * Получает статус заказа
   */
  const getOrderStatus = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE}/payment/order/${orderId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch order status')
      }
      return await response.json()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    loading,
    error,
    createOrder,
    submitToLiqPay,
    getOrderStatus,
  }
}
