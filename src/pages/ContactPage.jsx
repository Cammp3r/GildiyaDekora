import { useEffect, useState } from 'react'
import { Seo } from '../seo/Seo.jsx'

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

function sanitizeInput(value, maxLen = 1000) {
  if (typeof value !== 'string') return ''
  // Remove HTML tags
  let s = value.replace(/<[^>]*>/g, '')
  // Remove control chars except newline and basic whitespace
  s = s.replace(/[\u0000-\u001F\u007F]+/g, ' ')
  // Collapse multiple whitespace
  s = s.replace(/\s+/g, ' ')
  s = s.trim()
  if (s.length > maxLen) s = s.slice(0, maxLen)
  return s
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

export default function ContactPage() {
  const [status, setStatus] = useState('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [errors, setErrors] = useState(initialErrors)
  const [formStartedAt] = useState(() => Date.now())

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)
    const honeypot = String(formData.get('_honey') || '').trim()
    const now = Date.now()
    // Read raw values then sanitize
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
    cleanFormData.append('_subject', 'Нове повідомлення з сайту Gildiya Dekora')
    cleanFormData.append('_template', 'table')
    cleanFormData.append('_captcha', 'false')
    cleanFormData.append('_honey', '')
    // Use sanitized values
    cleanFormData.append("Ім'я", values.name)
    cleanFormData.append('Email', values.email)
    cleanFormData.append('Телефон', values.phone)
    cleanFormData.append('Повідомлення', values.message)

    setStatus('sending')
    setStatusMessage('Відправляємо повідомлення...')

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
      setStatusMessage('Дякуємо! Повідомлення відправлено.')
    } catch {
      setStatus('error')
      setStatusMessage('Не вдалося відправити повідомлення. Спробуйте ще раз або зателефонуйте нам.')
    }
  }

  return (
    <>
      <Seo
        title="Контакти"
        description="Контакти Гільдії Декору у Києві: вул. Сергія Гусовського 12/7, офіс 10, телефон +38 (067) 503-93-52, email gildiya@meta.ua."
        canonicalPath="/contact"
      />
      {/* Contact Section */}
      <section className="contact">
        <div className="container">
          <h1 className="section-title">Зв'яжіться з <em>нами</em></h1>
          <div className="contact-order-banner">
            Щоб замовити консультацію заповніть форму
          </div>
          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <h3>Адреса</h3>
                <p><a href="https://maps.app.goo.gl/dRX4TLoQzrdfMqeS9">м. Київ, вул. Сергія Гусовського 12/7, оф.10 </a></p>
              </div>
              <div className="contact-item">
                <h3>Email</h3>
                <p><a href="mailto:gildiya@meta.ua">gildiya@meta.ua</a></p>
              </div>
              <div className="contact-item">
                <h3>Телефон</h3>
                <p><a href="tel:+380675039352">+38 (067) 503-93-52</a></p>
                <p><a
                    href="https://t.me/natkakhmelova"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="contact-social-btn contact-social-btn--telegram"
                    aria-label="Telegram"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.47l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.268.089z"/>
                    </svg>
                    Telegram
                  </a></p>
              </div>
              <div className="contact-item">
                <h3>Замовити консультацію</h3>
                <p>Заповніть форму та ми зв'яжемось з вами найближчим часом</p>
              </div>

              <div className="contact-item">
                <h3>Ми в соцмережах</h3>
                <div className="contact-social-links">
                  
                  <a
                    href="https://www.instagram.com/gildiya_decora/"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="contact-social-btn contact-social-btn--instagram"
                    aria-label="Instagram"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162S8.597 18.163 12 18.163s6.162-2.759 6.162-6.162S15.403 5.838 12 5.838zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Instagram
                  </a>
                  <a
                    href="https://www.facebook.com/GildiyaDecora/"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="contact-social-btn contact-social-btn--facebook"
                    aria-label="Facebook"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </a>
                </div>
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
                  placeholder="Ваше повідомлення"
                  rows="5"
                  minLength="10"
                  maxLength="1000"
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                  required
                ></textarea>
                {errors.message && <span id="contact-message-error" className="contact-field-error">{errors.message}</span>}
              </label>

              <button type="submit" className="submit-button" disabled={status === 'sending'}>
                {status === 'sending' ? 'Відправляємо...' : 'Надіслати повідомлення'}
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
