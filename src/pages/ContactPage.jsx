import { useEffect } from 'react'

export default function ContactPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  return (
    <>
      {/* Contact Section */}
      <section className="contact">
        <div className="container">
          <h2 className="section-title">Зв'яжіться з <em>нами</em></h2>
          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <h3>📍 Адреса</h3>
                <p><a href="https://maps.app.goo.gl/dRX4TLoQzrdfMqeS9">м. Київ, вул.Сергія Гусовського 12/7, оф.10</a></p>
              </div>
              <div className="contact-item">
                <h3>📞 Телефон</h3>
                <p><a href="tel:+380675039352">+38 (067) 503-93-52</a></p>
              </div>
              <div className="contact-item">
                <h3>💬 Замовлення</h3>
                <p>Заповніть форму справа і ми зв'яжемось з вами найближчим часом</p>
              </div>
            </div>
            <form className="contact-form" onSubmit={(e) => { e.preventDefault(); alert('Дякуємо за ваше повідомлення!'); }}>
              <input type="text" placeholder="Ваше ім'я" required />
              <input type="email" placeholder="Ваша email" required />
              <textarea
                placeholder="Ваше повідомлення"
                rows="5"
                required
              ></textarea>
              <button type="submit" className="submit-button">
                Надіслати повідомлення
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
