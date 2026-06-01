import { useEffect, useState } from 'react'
import { useCart } from '../cart/CartContext.jsx'

const CONTACT_EMAIL = 'gildiya@meta.ua'
const CONTACT_FORM_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`
const CONTACT_RATE_LIMIT_KEY = 'gildiyaDekoraContactSubmissions'
const CONTACT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const CONTACT_RATE_LIMIT_MAX = 3
const CONTACT_COOLDOWN_MS = 60 * 1000
const CONTACT_MIN_FILL_TIME_MS = 3000

const initialErrors = {
  name: '',
  email: '',
  phone: '',
  message: '',
}

function validateContactForm(values) {
  const errors = { ...initialErrors }
  const namePattern = /^[A-Za-zА-Яа-яЁёІіЇїЄєҐґ'’ -]{2,60}$/
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  const normalizedPhone = values.phone.replace(/[^\d+]/g, '')
  const phoneDigits = normalizedPhone.replace(/\D/g, '')

  if (!namePattern.test(values.name)) {
    errors.name = "Вкажіть ім'я від 2 до 60 літер без цифр і зайвих символів."
  }

  if (!emailPattern.test(values.email)) {
    errors.email = 'Вкажіть коректний email, наприклад name@gmail.com.'
  }

  if (!/^\+?[\d\s()-.]{10,20}$/.test(values.phone) || phoneDigits.length < 10 || phoneDigits.length > 15) {
    errors.phone = 'Вкажіть коректний номер телефону, наприклад +38 (067) 503-93-52.'
  }

  if (values.message.length < 10 || values.message.length > 1000 || !/[A-Za-zА-Яа-яЁёІіЇїЄєҐґ]/.test(values.message)) {
    errors.message = 'Напишіть повідомлення від 10 до 1000 символів.'
  }

  return errors
}

function hasErrors(errors) {
  return Object.values(errors).some(Boolean)
}

function getContactSubmissions(now = Date.now()) {
  try {
    const saved = JSON.parse(localStorage.getItem(CONTACT_RATE_LIMIT_KEY) || '[]')

    if (!Array.isArray(saved)) {
      return []
    }

    return saved
      .filter((timestamp) => Number.isFinite(timestamp))
      .filter((timestamp) => now - timestamp < CONTACT_RATE_LIMIT_WINDOW_MS)
  } catch {
    return []
  }
}

function getRateLimitMessage(now = Date.now()) {
  const submissions = getContactSubmissions(now)
  const lastSubmission = submissions.at(-1)

  if (lastSubmission && now - lastSubmission < CONTACT_COOLDOWN_MS) {
    const secondsLeft = Math.ceil((CONTACT_COOLDOWN_MS - (now - lastSubmission)) / 1000)
    return `Зачекайте ${secondsLeft} секунд перед наступним повідомленням.`
  }

  if (submissions.length >= CONTACT_RATE_LIMIT_MAX) {
    return 'Занадто багато повідомлень за короткий час. Спробуйте ще раз через 10 хвилин або зателефонуйте нам.'
  }

  return ''
}

function saveContactSubmission(now = Date.now()) {
  const submissions = [...getContactSubmissions(now), now]
  localStorage.setItem(CONTACT_RATE_LIMIT_KEY, JSON.stringify(submissions))
}

export default function OrderPage() {
  const { items, totalQuantity, totalPrice } = useCart()
  const [status, setStatus] = useState('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [errors, setErrors] = useState(initialErrors)
  const [formStartedAt] = useState(() => Date.now())

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  function sanitizeInput(value, maxLen = 1000) {
    if (typeof value !== 'string') return ''
    let s = value.replace(/<[^>]*>/g, '')
    s = s.replace(/[\u0000-\u001F\u007F]+/g, ' ')
    s = s.replace(/\s+/g, ' ')
    s = s.trim()
    if (s.length > maxLen) s = s.slice(0, maxLen)
    return s
  }

  const buildOrderText = () => {
    if (!items || items.length === 0) return 'Кошик порожній'
    return items
      .map((i) => `${sanitizeInput(i.title, 200)} — ${Number(i.quantity)} шт.`)
      .join('\n')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

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
    const nextErrors = validateContactForm(values)

    setErrors(nextErrors)

    if (hasErrors(nextErrors)) {
      setStatus('error')
      setStatusMessage('Перевірте поля форми і спробуйте ще раз.')
      return
    }

    if (honeypot) {
      form.reset()
      setErrors(initialErrors)
      setStatus('success')
      setStatusMessage('Дякуємо! Повідомлення відправлено.')
      return
    }

    if (now - formStartedAt < CONTACT_MIN_FILL_TIME_MS) {
      setStatus('error')
      setStatusMessage('Спробуйте відправити повідомлення ще раз через кілька секунд.')
      return
    }

    const rateLimitMessage = getRateLimitMessage(now)

    if (rateLimitMessage) {
      setStatus('error')
      setStatusMessage(rateLimitMessage)
      return
    }

    const cleanFormData = new FormData()
    cleanFormData.append('_subject', 'Нове замовлення з сайту Gildiya Dekora')
    cleanFormData.append('_template', 'table')
    cleanFormData.append('_captcha', 'false')
    cleanFormData.append('_honey', '')
    cleanFormData.append("Ім'я", values.name)
    cleanFormData.append('Email', values.email)
    cleanFormData.append('Телефон', values.phone)
    cleanFormData.append('Повідомлення', values.message)

    // Append cart details (sanitized)
    cleanFormData.append('Замовлення', buildOrderText())
    cleanFormData.append('Кількість товарів', String(Number(totalQuantity)))
    cleanFormData.append('Сума', `${Number(totalPrice)} грн`)
    try {
      const orderJson = items.map((it) => ({
        id: sanitizeInput(it.id, 200),
        title: sanitizeInput(it.title, 200),
        quantity: Number(it.quantity) || 0,
        unitPrice: Number(it.unitPrice) || 0,
      }))
      cleanFormData.append('order_json', JSON.stringify(orderJson))
    } catch {
      // ignore serialization errors
    }

    setStatus('sending')
    setStatusMessage('Відправляємо замовлення...')

    try {
      const response = await fetch(CONTACT_FORM_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: cleanFormData,
      })

      if (!response.ok) {
        throw new Error('Message was not sent')
      }

      form.reset()
      saveContactSubmission()
      setErrors(initialErrors)
      setStatus('success')
      setStatusMessage('Дякуємо! Замовлення відправлено. Ми з вами звʼяжемось.')
    } catch {
      setStatus('error')
      setStatusMessage('Не вдалося відправити замовлення. Спробуйте ще раз або зателефонуйте нам.')
    }
  }

  return (
    <>
      <section className="contact">
        <div className="container">
          <h2 className="section-title">Оформлення замовлення</h2>
          <div className="contact-order-banner">Перевірте заявку та заповніть форму</div>
          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <h3>Ваше замовлення</h3>
                <p style={{ whiteSpace: 'pre-line' }}>{buildOrderText()}</p>
                <p><strong>Сума:</strong> {totalPrice} грн</p>
              </div>
            </div>
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <label className="contact-honeypot" aria-hidden="true">
                <span>Website</span>
                <input
                  type="text"
                  name="_honey"
                  tabIndex="-1"
                  autoComplete="off"
                />
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
                  aria-describedby={errors.name ? 'contact-name-error' : undefined}
                  required
                />
                {errors.name && <span id="contact-name-error" className="contact-field-error">{errors.name}</span>}
              </label>

              <label className="contact-field">
                <input
                  type="email"
                  name="email"
                  placeholder="Ваш email"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'contact-email-error' : undefined}
                  required
                />
                {errors.email && <span id="contact-email-error" className="contact-field-error">{errors.email}</span>}
              </label>

              <label className="contact-field">
                <input
                  type="tel"
                  name="phone"
                  placeholder="Ваш номер телефону"
                  autoComplete="tel"
                  inputMode="tel"
                  minLength="10"
                  maxLength="20"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
                  required
                />
                {errors.phone && <span id="contact-phone-error" className="contact-field-error">{errors.phone}</span>}
              </label>

              <label className="contact-field">
                <textarea
                  name="message"
                  placeholder="Додаткова інформація (опціонально)"
                  rows="5"
                  minLength="0"
                  maxLength="1000"
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                ></textarea>
                {errors.message && <span id="contact-message-error" className="contact-field-error">{errors.message}</span>}
              </label>

              <button type="submit" className="submit-button" disabled={status === 'sending'}>
                {status === 'sending' ? 'Відправляємо...' : 'Підтвердити замовлення'}
              </button>
              {statusMessage && (
                <p className={`contact-form-status contact-form-status-${status}`} role="status">
                  {statusMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
