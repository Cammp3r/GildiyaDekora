import { Link } from 'react-router-dom'
import { useCart } from '../cart/CartContext.jsx'

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '-'
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return '-'
  return `${num.toLocaleString('uk-UA')} грн`
}

export default function CartPage() {
  const { items, totalPrice, setQuantity, removeItem } = useCart()

  return (
    <section className="cart">
      <div className="container">
        <h2 className="section-title">Кошик</h2>

        {items.length === 0 ? (
          <div className="cart-empty">
            <p>Кошик порожній</p>
            <div style={{ marginTop: '1rem' }}>
              <Link to="/products" className="add-btn">
                Перейти до каталогу
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="cart-list">
              {items.map((item) => {
                const unitPrice = Number(item.unitPrice)
                const quantity = Number(item.quantity)
                const lineTotal =
                  (Number.isFinite(unitPrice) ? unitPrice : 0) *
                  (Number.isFinite(quantity) ? quantity : 0)

                return (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-media">
                      {item.image ? (
                        <img src={item.image} alt={item.title} loading="lazy" />
                      ) : (
                        <div className="cart-item-placeholder" />
                      )}
                    </div>

                    <div className="cart-item-main">
                      <div className="cart-item-title">{item.title}</div>
                      <div className="cart-item-meta">
                        {item.volume && <span>{item.volume}</span>}
                        <span>{formatMoney(item.unitPrice)} / шт.</span>
                      </div>

                      <div className="cart-item-controls">
                        <label className="cart-label">
                          Кількість
                          <input
                            className="cart-input"
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(event) => setQuantity(item.id, event.target.value)}
                          />
                        </label>

                        <button
                          type="button"
                          className="add-btn"
                          onClick={() => removeItem(item.id)}
                        >
                          Видалити
                        </button>
                      </div>
                    </div>

                    <div className="cart-item-total">{formatMoney(lineTotal)}</div>
                  </div>
                )
              })}
            </div>

            <div className="cart-summary">
              <div className="cart-summary-row">
                <span>Разом</span>
                <strong>{formatMoney(totalPrice)}</strong>
              </div>
              <div className="cart-summary-note">
                Ціна розрахована як вартість обраного об'єму x кількість.
              </div>
              <Link to="/contact" className="cart-order-button">
                Замовити
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
