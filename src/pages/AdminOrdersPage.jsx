import { useEffect, useState } from 'react'
import { Seo } from '../seo/Seo.jsx'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '')
const ADMIN_STORAGE_KEY = 'gildiya-admin-token'

const STATUS_UK = {
  pending:  'Очікує оплати',
  paid:     'Оплачено',
  failed:   'Помилка оплати',
  canceled: 'Скасовано',
  refunded: 'Повернуто кошти',
}

const STATUS_COLOR = {
  pending:  '#b08d57',
  paid:     '#2e7d32',
  failed:   '#c62828',
  canceled: '#555',
  refunded: '#1565c0',
}

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

function StatusBadge({ status }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '0.72rem',
      fontFamily: 'var(--mono)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      background: STATUS_COLOR[status] ?? '#888',
      color: '#fff',
      whiteSpace: 'nowrap',
    }}>
      {STATUS_UK[status] ?? status}
    </span>
  )
}

export default function AdminOrdersPage() {
  const [token, setToken] = useState(() => {
    try { return window.localStorage.getItem(ADMIN_STORAGE_KEY) || '' } catch { return '' }
  })
  const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [details, setDetails] = useState(null)
  const [editStatus, setEditStatus] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    try { window.localStorage.setItem(ADMIN_STORAGE_KEY, token) } catch { /* ignore */ }
  }, [token])

  async function loadOrders() {
    if (!token) { setError('Вкажіть admin token.'); return }
    setLoading(true)
    setError('')
    try {
      const search = new URLSearchParams()
      if (statusFilter !== 'all') search.set('status', statusFilter)
      const res = await fetch(`${API_BASE}/admin/orders?${search}`, { headers: { 'x-admin-token': token } })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || 'Не вдалося завантажити замовлення.')
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
      const res = await fetch(`${API_BASE}/admin/orders/${encodeURIComponent(orderNumber)}`, {
        headers: { 'x-admin-token': token },
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || 'Не вдалося завантажити замовлення.')
      setDetails(payload)
      setEditStatus(payload.order?.status ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити замовлення.')
    }
  }

  async function saveStatus() {
    if (!details?.order || !editStatus) return
    setSaving(true)
    try {
      const res = await fetch(
        `${API_BASE}/admin/orders/${encodeURIComponent(details.order.orderNumber)}`,
        {
          method: 'PATCH',
          headers: { 'x-admin-token': token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: editStatus }),
        }
      )
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || 'Помилка збереження.')
      setDetails((prev) => ({ ...prev, order: { ...prev.order, status: payload.order.status } }))
      setOrders((prev) =>
        prev.map((o) =>
          o.orderNumber === payload.order.orderNumber ? { ...o, status: payload.order.status } : o
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка збереження статусу.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteOrder() {
    if (!details?.order) return
    if (!window.confirm(`Видалити замовлення ${details.order.orderNumber}? Цю дію не можна скасувати.`)) return
    try {
      const res = await fetch(
        `${API_BASE}/admin/orders/${encodeURIComponent(details.order.orderNumber)}`,
        { method: 'DELETE', headers: { 'x-admin-token': token } }
      )
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || 'Помилка видалення.')
      setOrders((prev) => prev.filter((o) => o.orderNumber !== details.order.orderNumber))
      setDetails(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка видалення.')
    }
  }

  const order = details?.order ?? null
  const items = Array.isArray(order?.items) ? order.items : []

  return (
    <>
      <Seo title="Адмінка замовлень" description="Перегляд замовлень і оплат." canonicalPath="/admin/orders" noindex />
      <section className="contact">
        <div className="container">
          <h1 className="section-title">Замовлення</h1>

          {/* ── Access token + filters ── */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
            <input
              type="password"
              placeholder="Admin token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--soft)', minWidth: '200px' }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--soft)' }}
            >
              <option value="all">Усі статуси</option>
              {Object.entries(STATUS_UK).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <button type="button" className="add-btn" onClick={loadOrders} disabled={loading}>
              {loading ? 'Завантаження...' : 'Оновити'}
            </button>
          </div>

          {error && <p style={{ color: '#c62828', marginBottom: '1rem' }}>{error}</p>}

          {/* ── Orders table ── */}
          <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--soft)', textAlign: 'left' }}>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Номер</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Клієнт</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Сума</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Статус</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Дата</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, idx) => (
                  <tr
                    key={o.orderNumber}
                    onClick={() => openOrder(o.orderNumber)}
                    style={{
                      borderBottom: '1px solid var(--soft)',
                      background: order?.orderNumber === o.orderNumber
                        ? 'rgba(196, 112, 58, 0.08)'
                        : idx % 2 === 0 ? 'transparent' : 'rgba(245,240,232,0.4)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(196,112,58,0.1)' }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = order?.orderNumber === o.orderNumber
                        ? 'rgba(196,112,58,0.08)'
                        : idx % 2 === 0 ? 'transparent' : 'rgba(245,240,232,0.4)'
                    }}
                  >
                    <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'var(--mono)', fontSize: '0.78rem' }}>
                      {o.orderNumber}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{o.customerName}</td>
                    <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>{formatMoney(o.amount)}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}><StatusBadge status={o.status} /></td>
                    <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap', color: 'var(--muted)', fontSize: '0.8rem' }}>
                      {formatDate(o.createdAt)}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} style={{ padding: '1.5rem 0.75rem', color: 'var(--muted)', textAlign: 'center' }}>
                      Замовлень не знайдено
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Order detail panel ── */}
          {order && (
            <div style={{
              border: '1px solid var(--soft)',
              borderRadius: '12px',
              padding: '1.5rem',
              background: 'rgba(245,240,232,0.5)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: '0.9rem', letterSpacing: '0.1em' }}>
                    {order.orderNumber}
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.8rem' }}>
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={deleteOrder}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid #c62828',
                    background: 'transparent',
                    color: '#c62828',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  Видалити замовлення
                </button>
              </div>

              {/* Customer info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem 1.5rem', marginBottom: '1.25rem' }}>
                <div><span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>ПІБ</span><br /><strong>{order.customerName}</strong></div>
                <div><span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Email</span><br /><a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a></div>
                <div><span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Телефон</span><br /><a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a></div>
                <div><span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Сума</span><br /><strong>{formatMoney(order.amount)}</strong></div>
              </div>

              {order.customerComment && (
                <p style={{ marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Коментар:&nbsp;</span>
                  {order.customerComment}
                </p>
              )}

              {/* Items */}
              {items.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <p style={{ margin: '0 0 0.5rem', color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Товари
                  </p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--soft)', textAlign: 'left' }}>
                        <th style={{ padding: '0.4rem 0.5rem 0.4rem 0', fontWeight: 400, color: 'var(--muted)' }}>Назва</th>
                        <th style={{ padding: '0.4rem 0.5rem', fontWeight: 400, color: 'var(--muted)' }}>Об'єм</th>
                        <th style={{ padding: '0.4rem 0.5rem', fontWeight: 400, color: 'var(--muted)', textAlign: 'right' }}>К-сть</th>
                        <th style={{ padding: '0.4rem 0 0.4rem 0.5rem', fontWeight: 400, color: 'var(--muted)', textAlign: 'right' }}>Ціна</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                          <td style={{ padding: '0.4rem 0.5rem 0.4rem 0' }}>
                            {it.title}
                            {it.variantTitle ? <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}> · {it.variantTitle}</span> : null}
                          </td>
                          <td style={{ padding: '0.4rem 0.5rem', color: 'var(--muted)' }}>{it.volume || '-'}</td>
                          <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>{it.quantity}</td>
                          <td style={{ padding: '0.4rem 0 0.4rem 0.5rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {formatMoney(it.unitPrice * it.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Status editor */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid var(--soft)', paddingTop: '1.25rem' }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Статус:</span>
                <StatusBadge status={order.status} />
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--soft)' }}
                >
                  {Object.entries(STATUS_UK).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="add-btn"
                  onClick={saveStatus}
                  disabled={saving || editStatus === order.status}
                >
                  {saving ? 'Збереження...' : 'Зберегти'}
                </button>
              </div>

              {/* Payment logs (collapsed by default) */}
              {(details?.paymentLogs ?? []).length > 0 && (
                <details style={{ marginTop: '1.25rem' }}>
                  <summary style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: '0.8rem' }}>
                    Логи оплати ({details.paymentLogs.length})
                  </summary>
                  <pre style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    background: 'rgba(245,240,232,0.8)',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    marginTop: '0.75rem',
                    maxHeight: '300px',
                    overflow: 'auto',
                  }}>
                    {JSON.stringify(details.paymentLogs, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
