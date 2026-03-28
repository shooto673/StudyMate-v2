import { motion } from 'framer-motion'

export default function AdBanner({ style, variant = 'banner' }) {
  if (variant === 'interstitial') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          ...style,
        }}
      >
        <div style={{
          width: 320, background: '#fff', borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            height: 250, background: 'linear-gradient(135deg, #e0e7ff, #f0e6ff)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 8,
          }}>
            <span style={{ fontSize: 32 }}>📢</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#6b7280' }}>広告エリア</span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Google AdMob Interstitial</span>
          </div>
          <div style={{ padding: '12px 16px', textAlign: 'center' }}>
            <span style={{ fontSize: 11, color: '#d1d5db' }}>
              広告なしで学ぶには → Standardプラン
            </span>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div style={{
      background: 'linear-gradient(90deg, #f3f4f6, #e5e7eb)',
      borderRadius: 12, padding: '12px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      border: '1px dashed #d1d5db',
      ...style,
    }}>
      <span style={{ fontSize: 18 }}>📢</span>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af' }}>広告エリア</div>
        <div style={{ fontSize: 10, color: '#d1d5db' }}>Google AdSense / AdMob Banner</div>
      </div>
    </div>
  )
}
