import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useCart } from '../cart/CartContext.jsx'
import { Seo } from '../seo/Seo.jsx'
import { notifyTelegram } from '../utils/telegramNotify.js'

const ORDER_EMAIL = 'gildiya@meta.ua'
const ORDER_FORM_ENDPOINT = `https://formsubmit.co/ajax/${ORDER_EMAIL}`
const ORDER_RATE_LIMIT_KEY = 'gildiyaDekoraOrderSubmissions'
const ORDER_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const ORDER_RATE_LIMIT_MAX = 3
const ORDER_COOLDOWN_MS = 60 * 1000

const initialErrors = { name: '', email: '', phone: '', message: '' }

function sanitizeInput(value, maxLen = 1000) {
  if (typeof value !== 'string') return ''
  let text = value.replace(/<[^>]*>/g, '')
  text = text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0)
      return code <= 31 || code === 127 ? ' ' : char
    })
    .join('')
  text = text.replace(/\s+/g, ' ').trim()
  if (text.length > maxLen) text = text.slice(0, maxLen)
  return text
}

function validateCheckoutForm(values) {
  const errors = { ...initialErrors }
  const namePattern = /^[A-Za-zА-Яа-яЁёІіЇїЄєҐґ'' -]{2,60}$/
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  const phoneDigits = values.phone.replace(/\D/g, '')

  if (!namePattern.test(values.name)) {
    errors.name = "Вкажіть ім'я від 2 до 60 літер без цифр і зайвих символів."
  }
  if (!emailPattern.test(values.email)) {
    errors.email = 'Вкажіть коректний email, наприклад name@gmail.com.'
  }
  if (
    !/^\+?[\d\s()-.]{10,20}$/.test(values.phone) ||
    phoneDigits.length < 10 ||
    phoneDigits.length > 15
  ) {
    errors.phone = 'Вкажіть коректний номер телефону, наприклад +38 (067) 503-93-52.'
  }
  if (values.message.length > 1000) {
    errors.message = 'Повідомлення не повинно перевищувати 1000 символів.'
  }
  return errors
}

function hasErrors(errors) {
  return Object.values(errors).some(Boolean)
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '-'
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return '-'
  return `${num.toLocaleString('uk-UA')} грн`
}

function getOrderSubmissions(now = Date.now()) {
  try {
    const saved = JSON.parse(localStorage.getItem(ORDER_RATE_LIMIT_KEY) || '[]')
    if (!Array.isArray(saved)) return []
    return saved
      .filter((ts) => Number.isFinite(ts))
      .filter((ts) => now - ts < ORDER_RATE_LIMIT_WINDOW_MS)
  } catch {
    return []
  }
}

function getRateLimitMessage(now = Date.now()) {
  const submissions = getOrderSubmissions(now)
  const lastSubmission = submissions.at(-1)
  if (lastSubmission && now - lastSubmission < ORDER_COOLDOWN_MS) {
    const secondsLeft = Math.ceil((ORDER_COOLDOWN_MS - (now - lastSubmission)) / 1000)
    return `Зачекайте ${secondsLeft} секунд перед наступним замовленням.`
  }
  if (submissions.length >= ORDER_RATE_LIMIT_MAX) {
    return 'Занадто багато замовлень за короткий час. Спробуйте ще раз через 10 хвилин або зателефонуйте нам.'
  }
  return ''
}

function saveOrderSubmission(now = Date.now()) {
  const submissions = [...getOrderSubmissions(now), now]
  localStorage.setItem(ORDER_RATE_LIMIT_KEY, JSON.stringify(submissions))
}

function OrderSuccess() {
  const { clearCart } = useCart()

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <>
      <Seo title="Замовлення прийнято" canonicalPath="/order" noindex />
      <section className="contact checkout">
        <div className="container">
          <div className="payment-success">
            <div className="payment-success-icon">✓</div>
            <h1 className="payment-success-title">Замовлення прийнято!</h1>
            <p className="payment-success-text">
              Дякуємо за замовлення. Менеджер звʼяжеться з вами найближчим часом для підтвердження та оплати.
            </p>
            <a href="/" className="btn-primary" style={{ marginTop: '2.5rem' }}>
              На головну →
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

export default function OrderPage() {
  const { items, totalQuantity, totalPrice } = useCart()
  const [status, setStatus] = useState('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [errors, setErrors] = useState(initialErrors)
  const location = useLocation()
  const [formStartedAt] = useState(() => Date.now())

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  const orderPreview = useMemo(() => {
    if (!items || items.length === 0) return 'Кошик порожній'
    return items
      .map((item) => {
        const variant = item.variantTitle ? ` — ${sanitizeInput(item.variantTitle, 80)}` : ''
        const volume = item.volume ? ` ${sanitizeInput(item.volume, 40)}` : ''
        return `${sanitizeInput(item.title, 200)}${variant}${volume} × ${Number(item.quantity) || 1}`
      })
      .join('\n')
  }, [items])

  if (status === 'success') {
    return <OrderSuccess />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!items.length) {
      setStatus('error')
      setStatusMessage('Кошик порожній. Додайте товари перед оформленням замовлення.')
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)
    const honeypot = String(formData.get('_honey') || '').trim()
    const now = Date.now()

    const raw = {
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      phone: String(formData.get('phone') || ''),
      message: String(formData.get('message') || ''),
    }

    const values = {
      name: sanitizeInput(raw.name, 60),
      email: sanitizeInput(raw.email, 254),
      phone: sanitizeInput(raw.phone, 20),
      message: sanitizeInput(raw.message, 1000),
    }

    const nextErrors = validateCheckoutForm(values)
    setErrors(nextErrors)

    if (hasErrors(nextErrors)) {
      setStatus('error')
      setStatusMessage('Перевірте поля форми і спробуйте ще раз.')
      return
    }

    if (honeypot) return

    if (now - formStartedAt < 3000) {
      setStatus('error')
      setStatusMessage('Спробуйте відправити форму ще раз через кілька секунд.')
      return
    }

    const rateLimitMessage = getRateLimitMessage(now)
    if (rateLimitMessage) {
      setStatus('error')
      setStatusMessage(rateLimitMessage)
      return
    }

    setStatus('sending')
    setStatusMessage('Відправляємо замовлення...')

    const cleanFormData = new FormData()
    cleanFormData.append('_subject', 'Нове замовлення з сайту Gildiya Dekora')
    cleanFormData.append('_template', 'table')
    cleanFormData.append('_captcha', 'false')
    cleanFormData.append('_honey', '')
    cleanFormData.append("Ім'я", values.name)
    cleanFormData.append('Email', values.email)
    cleanFormData.append('Телефон', values.phone)
    cleanFormData.append('Замовлення', orderPreview)
    cleanFormData.append('Кількість', String(totalQuantity))
    cleanFormData.append('Сума', formatMoney(totalPrice))
    cleanFormData.append('Коментар', values.message || '-')

    try {
      const response = await fetch(ORDER_FORM_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: cleanFormData,
      })

      if (!response.ok) {
        throw new Error('Order was not sent')
      }

      saveOrderSubmission()
      notifyTelegram({
        type: 'order',
        name: values.name,
        email: values.email,
        phone: values.phone,
        message: values.message,
        items: orderPreview,
        totalQuantity,
        totalPrice: formatMoney(totalPrice),
      })
      setStatus('success')
      setStatusMessage('Дякуємо! Замовлення відправлено.')
    } catch {
      setStatus('error')
      setStatusMessage('Не вдалося відправити замовлення. Спробуйте ще раз або зателефонуйте нам.')
    }
  }

  return (
    <>
      <Seo
        title="Оформлення замовлення"
        description="Оформлення замовлення у Гільдії Декора."
        canonicalPath="/order"
        noindex
      />
      <section className="contact checkout">
        <div className="container">
          <h1 className="section-title">Оформлення замовлення</h1>
          <div className="contact-order-banner">
            Заповніть форму — і менеджер звʼяжеться з вами для підтвердження замовлення та оплати
          </div>

          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <h3>Ваше замовлення</h3>
                <p style={{ whiteSpace: 'pre-line', marginBottom: '0.75rem' }}>{orderPreview}</p>
                <p><strong>Кількість:</strong> {totalQuantity}</p>
                <p><strong>Сума:</strong> {formatMoney(totalPrice)}</p>
              </div>
            </div>

            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <label className="contact-honeypot" aria-hidden="true">
                <span>Website</span>
                <input type="text" name="_honey" tabIndex="-1" autoComplete="off" />
              </label>

              <label className="contact-field">
                <input
                  type="text"
                  name="name"
                  placeholder="Ваше ім'я"
                  autoComplete="name"
                  minLength="2"
                  maxLength="60"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'checkout-name-error' : undefined}
                  required
                />
                {errors.name && (
                  <span id="checkout-name-error" className="contact-field-error">
                    {errors.name}
                  </span>
                )}
              </label>

              <label className="contact-field">
                <input
                  type="email"
                  name="email"
                  placeholder="Ваш email"
                  autoComplete="email"
                  maxLength="254"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'checkout-email-error' : undefined}
                  required
                />
                {errors.email && (
                  <span id="checkout-email-error" className="contact-field-error">
                    {errors.email}
                  </span>
                )}
              </label>

              <label className="contact-field">
                <input
                  type="tel"
                  name="phone"
                  placeholder="Ваш телефон"
                  autoComplete="tel"
                  maxLength="20"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'checkout-phone-error' : undefined}
                  required
                />
                {errors.phone && (
                  <span id="checkout-phone-error" className="contact-field-error">
                    {errors.phone}
                  </span>
                )}
              </label>

              <label className="contact-field">
                <textarea
                  name="message"
                  placeholder="Коментар до замовлення (необов'язково)"
                  rows="4"
                  maxLength="1000"
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? 'checkout-message-error' : undefined}
                />
                {errors.message && (
                  <span id="checkout-message-error" className="contact-field-error">
                    {errors.message}
                  </span>
                )}
              </label>

              <button
                className="submit-button"
                type="submit"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? statusMessage : 'Оформити замовлення'}
              </button>

              {statusMessage && status !== 'sending' && (
                <div
                  className={[
                    'contact-form-status',
                    status === 'error' ? 'contact-form-status-error' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {statusMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
