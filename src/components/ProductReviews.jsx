import { useEffect, useState } from 'react'

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace(/\/$/, '')

// The backend can be cold (Render free tier) or briefly unreachable — this
// component is rendered on every product page, including during the build's
// prerender pass, so a hung fetch here would hang prerendering for the whole
// catalog. Bound every request so it always settles quickly and falls back
// to "no reviews yet" instead.
const FETCH_TIMEOUT_MS = 5000

async function fetchJson(url, options) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    const payload = await res.json().catch(() => null)
    if (!res.ok) throw new Error(payload?.error || 'Request failed')
    return payload
  } finally {
    clearTimeout(timer)
  }
}

function Stars({ value, size = '1rem' }) {
  const rounded = Math.min(5, Math.max(0, Math.round(value)))
  return (
    <span aria-label={`Оцінка ${value} з 5`} style={{ fontSize: size, letterSpacing: '1px', whiteSpace: 'nowrap' }}>
      <span style={{ color: '#c4703a' }}>{'★★★★★'.slice(0, rounded)}</span>
      <span style={{ color: 'var(--soft)' }}>{'★★★★★'.slice(rounded)}</span>
    </span>
  )
}

const EMPTY_AGGREGATE = { average: 0, count: 0 }
const initialForm = { authorName: '', rating: 5, comment: '' }

export default function ProductReviews({ productId, productTitle, onData }) {
  const [reviews, setReviews] = useState([])
  const [aggregate, setAggregate] = useState(EMPTY_AGGREGATE)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetchJson(`${API_URL}/reviews/${encodeURIComponent(productId)}`)
      .then((payload) => {
        if (cancelled) return
        const nextReviews = Array.isArray(payload?.reviews) ? payload.reviews : []
        const nextAggregate = payload?.aggregate ?? EMPTY_AGGREGATE
        setReviews(nextReviews)
        setAggregate(nextAggregate)
        onData?.({ reviews: nextReviews, aggregate: nextAggregate })
      })
      .catch(() => {
        if (cancelled) return
        setReviews([])
        setAggregate(EMPTY_AGGREGATE)
        onData?.({ reviews: [], aggregate: EMPTY_AGGREGATE })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onData is the stable setState from the parent
  }, [productId])

  async function handleSubmit(e) {
    e.preventDefault()
    setFeedback(null)

    if (form.authorName.trim().length < 2) {
      setFeedback({ type: 'error', text: "Вкажіть ім'я." })
      return
    }
    if (form.comment.trim().length < 10) {
      setFeedback({ type: 'error', text: 'Відгук має містити щонайменше 10 символів.' })
      return
    }

    setSubmitting(true)
    try {
      const payload = await fetchJson(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          productTitle,
          authorName: form.authorName.trim(),
          rating: Number(form.rating),
          comment: form.comment.trim(),
        }),
      })
      setFeedback({ type: 'success', text: payload?.message || 'Дякуємо за відгук!' })
      setForm(initialForm)
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Не вдалося надіслати відгук. Спробуйте пізніше.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="product-reviews" style={{ marginTop: '2.5rem', borderTop: '1px solid var(--soft)', paddingTop: '1.5rem' }}>
      <h3 style={{ margin: '0 0 0.75rem' }}>
        Відгуки{aggregate.count > 0 ? ` (${aggregate.count})` : ''}
      </h3>

      {aggregate.count > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Stars value={aggregate.average} size="1.2rem" />
          <strong>{aggregate.average.toFixed(1)}</strong>
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            з 5 · {aggregate.count} {aggregate.count === 1 ? 'відгук' : 'відгуків'}
          </span>
        </div>
      )}

      {!loading && aggregate.count === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Ще немає відгуків про цей товар — будьте першим!
        </p>
      )}

      {reviews.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {reviews.map((r) => (
            <li key={r.id} style={{ borderBottom: '1px solid var(--soft)', paddingBottom: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', gap: '0.75rem' }}>
                <strong style={{ fontSize: '0.9rem' }}>{r.authorName}</strong>
                <Stars value={r.rating} />
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{r.comment}</p>
            </li>
          ))}
        </ul>
      )}

      <details>
        <summary style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--muted)' }}>Залишити відгук</summary>
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.9rem', maxWidth: '420px' }}
        >
          <input
            type="text"
            placeholder="Ваше ім'я"
            value={form.authorName}
            onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
            maxLength={80}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--soft)' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            Оцінка
            <select
              value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
              style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--soft)' }}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} {'★'.repeat(n)}</option>
              ))}
            </select>
          </label>
          <textarea
            placeholder="Ваш відгук про товар"
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            rows={3}
            maxLength={2000}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--soft)', resize: 'vertical' }}
          />
          <button
            type="submit"
            className="add-btn add-btn-primary"
            disabled={submitting}
            style={{ alignSelf: 'flex-start' }}
          >
            {submitting ? 'Надсилання...' : 'Надіслати відгук'}
          </button>
          {feedback && (
            <p style={{ margin: 0, fontSize: '0.85rem', color: feedback.type === 'error' ? '#c62828' : '#2e7d32' }}>
              {feedback.text}
            </p>
          )}
        </form>
      </details>
    </div>
  )
}
