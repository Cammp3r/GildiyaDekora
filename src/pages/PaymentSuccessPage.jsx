import { Link, useParams } from 'react-router-dom'

export default function PaymentSuccessPage() {
  const { orderId } = useParams()

  return (
    <section className="checkout">
      <div className="container">
        <div className="checkout-summary" style={{ marginTop: '2rem' }}>
          <h2>Платіж успішний</h2>
          <p>Номер замовлення: {orderId}</p>
          <p>Ми надішлемо підтвердження на ваш email.</p>
          <Link to="/products" className="checkout-submit" style={{ display: 'inline-block', textDecoration: 'none' }}>
            Продовжити покупки
          </Link>
        </div>
      </div>
    </section>
  )
}