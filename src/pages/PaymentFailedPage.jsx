import { Link } from 'react-router-dom'

export default function PaymentFailedPage() {
  return (
    <section className="checkout">
      <div className="container">
        <div className="checkout-summary" style={{ marginTop: '2rem' }}>
          <h2>Платіж не пройшов</h2>
          <p>Спробуйте ще раз або поверніться до оформлення замовлення.</p>
          <Link to="/checkout" className="checkout-submit" style={{ display: 'inline-block', textDecoration: 'none' }}>
            Повернутися до оплати
          </Link>
        </div>
      </div>
    </section>
  )
}