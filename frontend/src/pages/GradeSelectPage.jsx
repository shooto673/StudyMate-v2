import { motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'

const grades = [
  { id: 'j1', label: '中学1年', num: '1', color: '#4DABF7', desc: '基礎から始めよう！' },
  { id: 'j2', label: '中学2年', num: '2', color: '#6C63FF', desc: '応用力をつけよう！' },
  { id: 'j3', label: '中学3年', num: '3', color: '#FF922B', desc: '受験に向けて総仕上げ！' },
]

export default function GradeSelectPage({ onSelect, mascotId }) {
  const mascotSrc = mascotId === 'mona' ? '/mascots/mona/mascot-happy.png' : '/mascots/taylor/mascot-normal.png'

  return (
    <div style={{ minHeight: '100dvh', background: '#FFFDF7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Mascot */}
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: 'center', marginBottom: 12 }}>
        <motion.img src={mascotSrc} alt="mascot"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 100, height: 100, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }} />
        <div style={{ borderRadius: 16, background: '#fff', padding: '8px 20px', fontSize: 14, fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'inline-block', marginTop: -4 }}>
          学年を選んでね！
        </div>
      </motion.div>

      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="font-black" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: '#1a1a2e', textAlign: 'center', marginBottom: 32 }}>
        キミの学年は？
      </motion.h1>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 700, width: '100%' }}>
        {grades.map((g, i) => (
          <motion.button key={g.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1, type: 'spring', stiffness: 200 }}
            whileHover={{ y: -8, scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(g.id)}
            style={{
              flex: '1 1 180px', maxWidth: 220, borderRadius: 24, padding: '36px 24px',
              background: '#fff', border: '2px solid #f1f1f1', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = g.color}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f1f1'}
          >
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: `linear-gradient(135deg, ${g.color}, ${g.color}CC)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 16px ${g.color}40`,
            }}>
              <span className="font-black" style={{ fontSize: 28, color: '#fff' }}>{g.num}</span>
            </div>
            <h2 className="font-bold" style={{ fontSize: 18, color: '#1a1a2e' }}>{g.label}</h2>
            <p style={{ fontSize: 12, color: '#9ca3af' }}>{g.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
