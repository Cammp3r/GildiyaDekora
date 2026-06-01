import { Link } from 'react-router-dom'
import { useCart } from '../cart/CartContext.jsx'
import { useEffect, useState } from 'react'

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '-'
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return '-'
  return `${num.toLocaleString('uk-UA')} грн`
}

export default function CartPage() {
  const { items, totalPrice, setQuantity, removeItem } = useCart()
  const [localQty, setLocalQty] = useState({})

  useEffect(() => {
    const map = {}
    items.forEach((it) => {
      map[it.id] = String(it.quantity)
    })
    setLocalQty(map)
  }, [items])

  function commitQuantity(id) {
    const raw = localQty[id]
    const item = items.find((x) => x.id === id)
    const current = item ? Number(item.quantity) || 1 : 1

    if (raw == null) return
    const trimmed = String(raw).trim()
    if (trimmed === '') {
      // restore visible value to current quantity without removing item
      setLocalQty((prev) => ({ ...prev, [id]: String(current) }))
      return
    }

    const num = Number(trimmed)
    if (!Number.isFinite(num) || num < 1) {
      setQuantity(id, 1)
      setLocalQty((prev) => ({ ...prev, [id]: '1' }))
    } else {
      setQuantity(id, Math.floor(num))
    }
  }

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
                        {item.variantTitle ? (
                          <span>{item.variantTitle}{item.volume ? ' ' + item.volume : ''}</span>
                        ) : (
                          item.volume && <span>{item.volume}</span>
                        )}
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
                            value={localQty[item.id] ?? String(item.quantity)}
                            onChange={(event) =>
                              setLocalQty((prev) => ({ ...prev, [item.id]: event.target.value }))
                            }
                            onBlur={() => commitQuantity(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                commitQuantity(item.id)
                                // remove focus so blur also fires consistently
                                e.currentTarget.blur()
                              }
                            }}
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
              <Link to="/order" className="cart-order-button">
                Оформити замовлення
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
