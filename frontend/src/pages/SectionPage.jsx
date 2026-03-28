import { motion } from 'framer-motion'
import { ArrowLeft, ChevronRight, Lock } from 'lucide-react'

export default function SectionPage({ unit, onSelectSubUnit, onBack, mascotId }) {
  const mascotSrc = mascotId === 'mona' ? '/mascots/mona/mascot-thinking.png' : '/mascots/taylor/mascot-thinking.png'
  const subUnits = unit?.subUnits || []

  // Mock progress: first sub-unit mastered, second in-progress
  const getProgress = (idx) => idx === 0 ? 100 : idx === 1 ? 40 : 0

  return (
    <div style={{ minHeight: '100dvh', background: '#FFFDF7' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f1f1', background: '#fff' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack}
            style={{ width: 36, height: 36, borderRadius: 10, background: '#f3f4f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={18} style={{ color: '#6b7280' }} />
          </button>
          <h1 className="font-bold" style={{ fontSize: 18, color: '#1a1a2e' }}>{unit?.title}</h1>
        </div>
      </div>

      {/* Mascot */}
      <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
        <motion.img src={mascotSrc} alt="mascot"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ width: 80, height: 80, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))' }} />
        <div style={{ display: 'inline-block', borderRadius: 14, background: '#fff', padding: '6px 18px', fontSize: 13, fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginTop: -4 }}>
          どれから始める？
        </div>
      </div>

      {/* Sub-units list */}
      <div style={{ maxWidth: 600, margin: '16px auto', padding: '0 20px 40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {subUnits.map((sub, idx) => {
            const progress = getProgress(idx)
            const isLocked = idx > 3
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
                  borderRadius: 16, background: '#fff', border: '1px solid #f1f1f1',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
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
                  <div className="font-bold" style={{ fontSize: 15, color: '#1a1a2e', marginBottom: 6 }}>{sub.title}</div>
                  {/* Progress bar */}
                  <div style={{ height: 6, borderRadius: 999, background: '#f3f4f6', overflow: 'hidden' }}>
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
