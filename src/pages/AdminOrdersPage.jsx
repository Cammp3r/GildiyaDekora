import { useEffect, useState } from 'react'
import { Seo } from '../seo/Seo.jsx'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '')
const ADMIN_STORAGE_KEY = 'gildiya-admin-token'

function formatMoney(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '-'
  return `${num.toLocaleString('uk-UA')} грн`
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('uk-UA')
}

export default function AdminOrdersPage() {
  const [token, setToken] = useState(() => {
    try {
      return window.localStorage.getItem(ADMIN_STORAGE_KEY) || ''
    } catch {
      return ''
    }
  })
  const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [details, setDetails] = useState(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(ADMIN_STORAGE_KEY, token)
    } catch {
      // ignore storage failures
    }
  }, [token])

  async function loadOrders() {
    if (!token) {
      setError('Вкажіть admin token.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const search = new URLSearchParams()
      if (statusFilter !== 'all') {
        search.set('status', statusFilter)
      }

      const response = await fetch(`${API_BASE}/admin/orders?${search.toString()}`, {
        headers: {
          'x-admin-token': token,
        },
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Не вдалося завантажити замовлення.')
      }

      setOrders(Array.isArray(payload.orders) ? payload.orders : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити замовлення.')
    } finally {
      setLoading(false)
    }
  }

  async function openOrder(orderNumber) {
    if (!token || !orderNumber) return

    try {
      const response = await fetch(`${API_BASE}/admin/orders/${encodeURIComponent(orderNumber)}`, {
        headers: {
          'x-admin-token': token,
        },
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'Не вдалося завантажити замовлення.')
      }

      setDetails(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити замовлення.')
    }
  }

  return (
    <>
      <Seo title="Адмінка замовлень" description="Перегляд замовлень і оплат." canonicalPath="/admin/orders" noindex />
      <section className="contact">
        <div className="container">
          <h1 className="section-title">Замовлення</h1>

          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <h3>Доступ</h3>
                <label className="contact-field" style={{ marginTop: '1rem' }}>
                  <input
                    type="password"
                    placeholder="Admin token"
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                  />
                </label>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="all">Усі</option>
                    <option value="pending">pending</option>
                    <option value="paid">paid</option>
                    <option value="failed">failed</option>
                    <option value="canceled">canceled</option>
                    <option value="refunded">refunded</option>
                  </select>
                  <button type="button" className="add-btn" onClick={loadOrders} disabled={loading}>
                    {loading ? 'Завантаження...' : 'Оновити'}
                  </button>
                </div>

                {error && <p style={{ color: '#b3422f', marginTop: '1rem' }}>{error}</p>}
              </div>
            </div>

            <div className="contact-form" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th align="left">Номер</th>
                    <th align="left">Клієнт</th>
                    <th align="left">Сума</th>
                    <th align="left">Статус</th>
                    <th align="left">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.orderNumber} style={{ borderTop: '1px solid rgba(32,32,32,0.1)' }}>
                      <td style={{ padding: '0.75rem 0' }}>
                        <button type="button" className="add-btn" onClick={() => openOrder(order.orderNumber)}>
                          {order.orderNumber}
                        </button>
                      </td>
                      <td>{order.customerName}</td>
                      <td>{formatMoney(order.amount)}</td>
                      <td>{order.status}</td>
                      <td>{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {details?.order && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h3>{details.order.orderNumber}</h3>
                  <p><strong>Клієнт:</strong> {details.order.customerName}</p>
                  <p><strong>Email:</strong> {details.order.customerEmail}</p>
                  <p><strong>Телефон:</strong> {details.order.customerPhone}</p>
                  <p><strong>Сума:</strong> {formatMoney(details.order.amount)}</p>
                  <p><strong>Статус:</strong> {details.order.status}</p>
                  <p><strong>Коментар:</strong> {details.order.customerComment || '-'}</p>
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#faf7f3', padding: '1rem', borderRadius: '12px' }}>
                    {JSON.stringify(details.paymentLogs ?? [], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}