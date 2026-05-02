import { useEffect, useState } from 'react'

const CONTACT_EMAIL = 'geogen2007@gmail.com'
const CONTACT_FORM_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`

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

export default function ContactPage() {
  const [status, setStatus] = useState('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [errors, setErrors] = useState(initialErrors)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)
    const values = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      message: String(formData.get('message') || '').trim(),
    }
    const nextErrors = validateContactForm(values)

    setErrors(nextErrors)

    if (hasErrors(nextErrors)) {
      setStatus('error')
      setStatusMessage('Перевірте поля форми і спробуйте ще раз.')
      return
    }

    const cleanFormData = new FormData()
    cleanFormData.append('_subject', 'Нове повідомлення з сайту Gildiya Dekora')
    cleanFormData.append('_template', 'table')
    cleanFormData.append('_captcha', 'false')
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
      {/* Contact Section */}
      <section className="contact">
        <div className="container">
          <h2 className="section-title">Зв'яжіться з <em>нами</em></h2>
          <div className="contact-order-banner">
            Щоб замовити заповніть форму та з вами зв'яжуться
          </div>
          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <h3>Адреса</h3>
                <p><a href="https://maps.app.goo.gl/dRX4TLoQzrdfMqeS9">м. Київ, вул. Сергія Гусовського 12/7, оф.10</a></p>
              </div>
              <div className="contact-item">
                <h3>Телефон</h3>
                <p><a href="tel:+380675039352">+38 (067) 503-93-52</a></p>
              </div>
              <div className="contact-item">
                <h3>Замовлення</h3>
                <p>Заповніть форму справа і ми зв'яжемось з вами найближчим часом</p>
              </div>
            </div>
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
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
