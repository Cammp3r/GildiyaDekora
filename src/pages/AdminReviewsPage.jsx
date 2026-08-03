import { useEffect, useState } from 'react'
import { Seo } from '../seo/Seo.jsx'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '')
const ADMIN_STORAGE_KEY = 'gildiya-admin-token'

const STATUS_UK = {
  pending: 'На модерації',
  approved: 'Опубліковано',
  rejected: 'Відхилено',
}

const STATUS_COLOR = {
  pending: '#b08d57',
  approved: '#2e7d32',
  rejected: '#c62828',
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

export default function AdminReviewsPage() {
  const [token, setToken] = useState(() => {
    try { return window.localStorage.getItem(ADMIN_STORAGE_KEY) || '' } catch { return '' }
  })
  const [reviews, setReviews] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try { window.localStorage.setItem(ADMIN_STORAGE_KEY, token) } catch { /* ignore */ }
  }, [token])

  async function loadReviews() {
    if (!token) { setError('Вкажіть admin token.'); return }
    setLoading(true)
    setError('')
    try {
      const search = new URLSearchParams()
      if (statusFilter !== 'all') search.set('status', statusFilter)
      const res = await fetch(`${API_BASE}/admin/reviews?${search}`, { headers: { 'x-admin-token': token } })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || 'Не вдалося завантажити відгуки.')
      setReviews(Array.isArray(payload.reviews) ? payload.reviews : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити відгуки.')
    } finally {
      setLoading(false)
    }
  }

  async function setStatus(id, status) {
    try {
      const res = await fetch(`${API_BASE}/admin/reviews/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'x-admin-token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || 'Помилка збереження.')
      setReviews((prev) =>
        statusFilter === 'all'
          ? prev.map((r) => (r.id === id ? { ...r, status } : r))
          : prev.filter((r) => r.id !== id)
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка збереження.')
    }
  }

  async function deleteReview(id) {
    if (!window.confirm('Видалити цей відгук назавжди?')) return
    try {
      const res = await fetch(`${API_BASE}/admin/reviews/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || 'Помилка видалення.')
      setReviews((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка видалення.')
    }
  }

  return (
    <>
      <Seo title="Адмінка відгуків" description="Модерація відгуків про товари." canonicalPath="/admin/reviews" noindex />
      <section className="contact">
        <div className="container">
          <h1 className="section-title">Відгуки</h1>

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
            <button type="button" className="add-btn" onClick={loadReviews} disabled={loading}>
              {loading ? 'Завантаження...' : 'Оновити'}
            </button>
          </div>

          {error && <p style={{ color: '#c62828', marginBottom: '1rem' }}>{error}</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map((r) => (
              <div key={r.id} style={{
                border: '1px solid var(--soft)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                background: 'rgba(245,240,232,0.5)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <strong>{r.authorName}</strong>
                    <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}> · {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} · {r.productTitle} ({r.productId})</span>
                    <br />
                    <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{formatDate(r.createdAt)}</span>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <p style={{ margin: '0.75rem 0' }}>{r.comment}</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {r.status !== 'approved' && (
                    <button type="button" className="add-btn" onClick={() => setStatus(r.id, 'approved')}>
                      Опублікувати
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button type="button" className="add-btn add-btn-secondary" onClick={() => setStatus(r.id, 'rejected')}>
                      Відхилити
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteReview(r.id)}
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
                    Видалити
                  </button>
                </div>
              </div>
            ))}
            {reviews.length === 0 && !loading && (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem 0' }}>
                Відгуків не знайдено
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
