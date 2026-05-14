import { useState } from 'react'
import { useCart } from '../cart/CartContext.jsx'
import { usePayment } from '../hooks/usePayment.js'
import { Link } from 'react-router-dom'
import './checkout.css'

export default function CheckoutPage() {
  const { items, clearCart } = useCart()
  const { loading, error, createOrder, submitToLiqPay } = usePayment()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [formError, setFormError] = useState(null)

  // Вычисляем общую сумму
  const total = items.reduce((sum, item) => {
    return sum + (item.unitPrice || 0) * item.quantity
  }, 0)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)

    // Валидация формы
    if (!formData.name || !formData.email || !formData.phone) {
      setFormError('Заповніть усі поля')
      return
    }

    if (items.length === 0) {
      setFormError('Кошик порожній')
      return
    }

    try {
      // Готовим товары для заказа
      const orderItems = items.map((item) => ({
        id: item.productId,
        title: item.title,
        variantId: item.variantId,
        quantity: item.quantity,
        volume: item.volume,
        texture: item.texture,
        color: item.color,
      }))

      // Створюємо заказ на бекенду
      const orderResult = await createOrder(orderItems, formData)

      if (!orderResult.success) {
        throw new Error('Failed to create order')
      }

      // Очищаємо кошик
      clearCart()

      // Отправляем форму на LiqPay
      submitToLiqPay(orderResult.data, orderResult.signature)
    } catch (err) {
      console.error('Checkout error:', err)
      setFormError(err.message || 'Помилка при оформленні замовлення')
    }
  }

  if (items.length === 0) {
    return (
      <section className="checkout">
        <div className="container">
          <h2 className="section-title">Оформлення замовлення</h2>
          <div className="checkout-empty">
            <p>Ваш кошик порожній</p>
            <Link to="/products" className="add-btn">
              Повернутися до каталогу
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="checkout">
      <div className="container">
        <h2 className="section-title">Оформлення замовлення</h2>

        <div className="checkout-grid">
          {/* Ліва сторона - форма */}
          <div className="checkout-form-section">
            <form onSubmit={handleSubmit} className="checkout-form">
              <fieldset disabled={loading}>
                <legend>Ваші дані</legend>

                <label className="checkout-label">
                  Ім'я *
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ваше ім'я"
                    required
                    className="checkout-input"
                  />
                </label>

                <label className="checkout-label">
                  Email *
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    required
                    className="checkout-input"
                  />
                </label>

                <label className="checkout-label">
                  Телефон *
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+38 (0XX) XXX-XX-XX"
                    required
                    className="checkout-input"
                  />
                </label>

                {(formError || error) && (
                  <div className="checkout-error">
                    {formError || error}
                  </div>
                )}

                <button
                  type="submit"
                  className="checkout-submit"
                  disabled={loading || items.length === 0}
                >
                  {loading ? 'Обработка...' : 'Перейти до оплати'}
                </button>
              </fieldset>
            </form>
          </div>

          {/* Права сторона - зведення замовлення */}
          <div className="checkout-summary-section">
            <div className="checkout-summary">
              <h3>Зведення замовлення</h3>

              <div className="checkout-items">
                {items.map((item) => (
                  <div key={item.cartId || item.id} className="checkout-item">
                    <div className="checkout-item-title">
                      {item.title}
                    </div>
                    <div className="checkout-item-details">
                      {item.volume && (
                        <span className="checkout-item-detail">
                          Об'єм: {item.volume}
                        </span>
                      )}
                      {item.texture && (
                        <span className="checkout-item-detail">
                          Текстура: {item.texture}
                        </span>
                      )}
                      {item.color && (
                        <span className="checkout-item-detail">
                          Колір: {item.color}
                        </span>
                      )}
                    </div>
                    <div className="checkout-item-price">
                      {item.quantity} x{' '}
                      {item.unitPrice.toLocaleString('uk-UA')} грн
                    </div>
                    <div className="checkout-item-total">
                      <strong>
                        {(item.unitPrice * item.quantity).toLocaleString('uk-UA')} грн
                      </strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="checkout-divider"></div>

              <div className="checkout-total">
                <div className="checkout-total-label">Разом до сплати:</div>
                <div className="checkout-total-amount">
                  {total.toLocaleString('uk-UA')} грн
                </div>
              </div>

              <p className="checkout-info">
                🔒 Оплата проводиться безпечно через LiqPay
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
