import { Component } from 'react'
import { Link } from 'react-router-dom'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '3rem 1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 5vw, 3rem)', color: 'var(--ink)' }}>
            Щось пішло не так
          </h1>
          <p style={{ color: 'var(--muted)', maxWidth: '420px' }}>
            Виникла непередбачена помилка. Спробуйте оновити сторінку або повернутися на головну.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '0.75rem 1.5rem', background: 'var(--ink)', color: 'var(--cream)', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              Оновити сторінку
            </button>
            <Link
              to="/"
              onClick={() => this.setState({ hasError: false })}
              style={{ padding: '0.75rem 1.5rem', border: '1px solid var(--ink)', color: 'var(--ink)', textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              На головну
            </Link>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
