import { Link } from 'react-router-dom'
import { useCart } from '../cart/CartContext.jsx'

function formatMoneyUAH(value) {
  if (value === null || value === undefined || value === '') return '—'
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return '—'
  return `${num.toLocaleString('uk-UA')} грн`
}

export default function CartPage() {
  const { items, totalPrice, setAreaM2, removeItem } = useCart()

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
                const pricePerM2 = Number(item.pricePerM2)
                const areaM2 = Number(item.areaM2)
                const lineTotal =
                  (Number.isFinite(pricePerM2) ? pricePerM2 : 0) *
                  (Number.isFinite(areaM2) ? areaM2 : 0)

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
                        <span>{formatMoneyUAH(item.pricePerM2)} / м²</span>
                      </div>

                      <div className="cart-item-controls">
                        <label className="cart-label">
                          Площа, м²
                          <input
                            className="cart-input"
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={item.areaM2}
                            onChange={(e) => setAreaM2(item.id, e.target.value)}
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

                    <div className="cart-item-total">{formatMoneyUAH(lineTotal)}</div>
                  </div>
                )
              })}
            </div>

            <div className="cart-summary">
              <div className="cart-summary-row">
                <span>Разом</span>
                <strong>{formatMoneyUAH(totalPrice)}</strong>
              </div>
              <div className="cart-summary-note">Ціна розрахована як грн/м² × площа.</div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
