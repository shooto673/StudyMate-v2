import { motion } from 'framer-motion'
import { ArrowLeft, ChevronRight, Lock, Sparkles } from 'lucide-react'
import { getSubUnitPercent, isSubUnitMastered } from '../lib/progressStore'
import { useTheme } from '../lib/theme'

export default function SectionPage({ unit, onSelectSubUnit, onBack, mascotId }) {
  const { theme } = useTheme()
  const mascotSrc = mascotId === 'mona' ? '/mascots/mona/mascot-thinking.png' : '/mascots/taylor/mascot-thinking.png'
  const subUnits = unit?.subUnits || []

  const getProgress = (idx) => {
    const sub = subUnits[idx]
    if (!sub) return 0
    return getSubUnitPercent(sub.slug)
  }

  return (
    <div style={{ minHeight: '100dvh', background: theme.bg }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.cardBorder}`, background: theme.card }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack}
            style={{ width: 36, height: 36, borderRadius: 10, background: theme.tabBg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={18} style={{ color: theme.textSecondary }} />
          </button>
          <h1 className="font-bold" style={{ fontSize: 18, color: theme.text }}>{unit?.title}</h1>
        </div>
      </div>

      {/* Mascot */}
      <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
        <motion.img src={mascotSrc} alt="mascot"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ width: 80, height: 80, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))' }} />
        <div style={{ display: 'inline-block', borderRadius: 14, background: theme.card, padding: '6px 18px', fontSize: 13, fontWeight: 700, color: theme.text, boxShadow: `0 2px 8px ${theme.shadow}`, marginTop: -4 }}>
          どれから始める？
        </div>
      </div>

      {/* Sub-units list */}
      <div style={{ maxWidth: 600, margin: '16px auto', padding: '0 20px 40px' }}>
        {/* Summary Test Button */}
        {(() => {
          const hasAnyAttempt = subUnits.some(sub => getSubUnitPercent(sub.slug) > 0)
          return (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={hasAnyAttempt ? { scale: 1.02 } : {}}
              whileTap={hasAnyAttempt ? { scale: 0.97 } : {}}
              onClick={() => hasAnyAttempt && onSelectSubUnit({
                slug: `summary-${unit?.slug || 'unit'}`,
                title: 'まとめテスト',
                unitTitle: unit?.title,
                number: '★',
              })}
              style={{
                width: '100%', padding: '18px 20px', borderRadius: 18, border: 'none',
                cursor: hasAnyAttempt ? 'pointer' : 'default',
                background: hasAnyAttempt
                  ? 'linear-gradient(135deg, #6C63FF, #38BDF8)'
                  : '#e5e7eb',
                color: '#fff', marginBottom: 16,
                boxShadow: hasAnyAttempt ? '0 6px 24px rgba(108,99,255,0.3)' : 'none',
                opacity: hasAnyAttempt ? 1 : 0.5,
                display: 'flex', alignItems: 'center', gap: 14,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={22} style={{ color: '#fff' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div className="font-black" style={{ fontSize: 16, marginBottom: 2 }}>まとめテスト</div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>
                  {hasAnyAttempt ? 'この単元の全分野から10問出題！' : 'サブ単元を1つ以上学習すると解放'}
                </div>
              </div>
              {hasAnyAttempt && <ChevronRight size={20} style={{ color: '#fff', marginLeft: 'auto', flexShrink: 0 }} />}
            </motion.button>
          )
        })()}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {subUnits.map((sub, idx) => {
            const progress = getProgress(idx)
            const isLocked = false
            return (
              <motion.button key={sub.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={!isLocked ? { x: 4 } : {}}
                whileTap={!isLocked ? { scale: 0.98 } : {}}
                onClick={() => !isLocked && onSelectSubUnit(sub)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                  borderRadius: 16, background: theme.card, border: `1px solid ${theme.cardBorder}`,
                  boxShadow: `0 2px 10px ${theme.shadow}`,
                  cursor: isLocked ? 'default' : 'pointer', textAlign: 'left',
                  opacity: isLocked ? 0.5 : 1, width: '100%',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: progress === 100 ? '#51CF66' : isLocked ? '#e5e7eb' : '#6C63FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isLocked ? 'none' : '0 2px 8px rgba(0,0,0,0.1)',
                }}>
                  {isLocked ? <Lock size={16} style={{ color: '#9ca3af' }} />
                    : <span className="font-bold" style={{ color: '#fff', fontSize: 16 }}>{sub.number}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-bold" style={{ fontSize: 15, color: theme.text, marginBottom: 6 }}>{sub.title}</div>
                  {/* Progress bar */}
                  <div style={{ height: 6, borderRadius: 999, background: theme.tabBg, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.05 }}
                      style={{ height: '100%', borderRadius: 999, background: progress === 100 ? '#51CF66' : '#6C63FF' }}
                    />
                  </div>
                </div>
                {!isLocked && <ChevronRight size={18} style={{ color: '#d1d5db', flexShrink: 0 }} />}
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
