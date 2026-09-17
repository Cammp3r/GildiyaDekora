const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace(/\/$/, '')

export function notifyTelegram(payload) {
  fetch(`${API_URL}/notify/telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {})
}
