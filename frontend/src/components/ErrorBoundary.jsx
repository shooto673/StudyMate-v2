import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh', background: '#FFFDF7',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>😵</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>
              エラーが発生しました
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 24 }}>
              アプリでエラーが起きてしまいました。<br />
              ページを再読み込みしてもう一度お試しください。
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
              style={{
                padding: '14px 32px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #6C63FF, #38BDF8)', color: '#fff',
                fontSize: 15, fontWeight: 700, boxShadow: '0 4px 16px rgba(108,99,255,0.3)',
              }}>
              再読み込み
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
