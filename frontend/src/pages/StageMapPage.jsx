import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, BookOpen, Calculator, Trophy, Star, Lock, User, Check } from 'lucide-react'
import AdBanner from '../components/AdBanner'
import { getSubUnitPercent } from '../lib/progressStore'

const SUBJECT_THEME = {
  english: { color: '#4DABF7', light: '#E7F5FF', icon: BookOpen, label: '英語' },
  math: { color: '#FF922B', light: '#FFF4E6', icon: Calculator, label: '数学' },
}

// S-curve positions: alternates left-center-right in a winding pattern
function getNodeLayout(index, total) {
  // Row pattern: repeats every 5 nodes
  // Row 0: center-right
  // Row 1: far right
  // Row 2: center-right
  // Row 3: center-left
  // Row 4: far left
  const patterns = [
    { x: 50, align: 'center' },   // center
    { x: 78, align: 'right' },    // right
    { x: 50, align: 'center' },   // center
    { x: 22, align: 'left' },     // left
    { x: 50, align: 'center' },   // center
  ]
  const p = patterns[index % patterns.length]
  return { xPercent: p.x, align: p.align }
}

function PathNode({ unit, index, total, theme, status, onTap }) {
  const { xPercent } = getNodeLayout(index, total)
  const isLocked = status === 'locked'
  const isMastered = status === 'mastered'
  const isActive = status === 'in-progress' || status === 'available'
  const nodeSize = isActive ? 76 : 66

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 180 }}
      style={{
        position: 'absolute',
        left: `${xPercent}%`,
        top: index * 120 + 20,
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        zIndex: isActive ? 10 : 1,
      }}
    >
      {/* Active pulse ring */}
      {isActive && (
        <>
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: 'absolute', top: -8,
              width: nodeSize + 16, height: nodeSize + 16,
              borderRadius: '50%', background: `${theme.color}15`,
              border: `2px solid ${theme.color}20`,
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            style={{
              position: 'absolute', top: -4,
              width: nodeSize + 8, height: nodeSize + 8,
              borderRadius: '50%', border: `2px solid ${theme.color}30`,
            }}
          />
        </>
      )}

      {/* Node button */}
      <motion.button
        whileHover={!isLocked ? { scale: 1.15, y: -6 } : {}}
        whileTap={!isLocked ? { scale: 0.9 } : {}}
        onClick={() => !isLocked && onTap(unit)}
        style={{
          width: nodeSize, height: nodeSize, borderRadius: '50%', border: 'none',
          cursor: isLocked ? 'default' : 'pointer',
          background: isLocked ? 'linear-gradient(135deg, #E5E7EB, #D1D5DB)'
            : isMastered ? `linear-gradient(135deg, ${theme.color}, ${theme.color}CC)`
            : isActive ? `linear-gradient(135deg, ${theme.color}, #6C63FF)`
            : `linear-gradient(135deg, ${theme.color}90, ${theme.color}60)`,
          boxShadow: isLocked ? 'inset 0 3px 6px rgba(0,0,0,0.12)'
            : isActive ? `0 8px 28px ${theme.color}45, 0 0 0 5px ${theme.color}25`
            : isMastered ? `0 6px 20px ${theme.color}30`
            : `0 4px 14px ${theme.color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}
      >
        {isLocked ? (
          <Lock size={26} style={{ color: '#9ca3af' }} />
        ) : isMastered ? (
          <Check size={28} style={{ color: '#fff' }} strokeWidth={3} />
        ) : (
          <span className="font-black" style={{ fontSize: 28, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
            {index + 1}
          </span>
        )}

        {/* Star for mastered */}
        {isMastered && (
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            style={{ position: 'absolute', top: -8, right: -6 }}
          >
            <div style={{
              background: '#FFD700', borderRadius: '50%', width: 24, height: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
              border: '2px solid #fff',
            }}>
              <Star size={13} fill="#fff" style={{ color: '#fff' }} />
            </div>
          </motion.div>
        )}

        {/* Bounce START badge */}
        {isActive && (
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ position: 'absolute', top: -28 }}
          >
            <div style={{
              background: `linear-gradient(135deg, ${theme.color}, #6C63FF)`,
              color: '#fff', borderRadius: 10, padding: '4px 14px',
              fontSize: 12, fontWeight: 800, letterSpacing: 1,
              boxShadow: `0 4px 12px ${theme.color}40`,
            }}>
              START
            </div>
            <div style={{
              width: 0, height: 0, margin: '0 auto',
              borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
              borderTop: `6px solid #6C63FF`,
            }} />
          </motion.div>
        )}
      </motion.button>

      {/* Label */}
      <div style={{
        background: isLocked ? 'transparent' : '#fff',
        borderRadius: 12, padding: isLocked ? '4px 0' : '5px 16px',
        boxShadow: isLocked ? 'none' : '0 2px 10px rgba(0,0,0,0.06)',
        fontSize: 13, fontWeight: 700, textAlign: 'center', maxWidth: 110,
        color: isLocked ? '#b0b0b0' : '#1a1a2e',
        lineHeight: 1.3,
      }}>
        {unit.title}
      </div>
    </motion.div>
  )
}

// Generate SVG path that connects nodes in S-curve
function RoadPath({ units, theme }) {
  const points = units.map((_, i) => {
    const { xPercent } = getNodeLayout(i, units.length)
    return { x: xPercent * 3.6, y: i * 120 + 50 } // scale x to SVG coords (360 wide)
  })

  // Create smooth bezier curves between points
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpY = (prev.y + curr.y) / 2
    d += ` C ${prev.x} ${cpY}, ${curr.x} ${cpY}, ${curr.x} ${curr.y}`
  }
  // Extend to goal
  const last = points[points.length - 1]
  d += ` L ${180} ${last.y + 140}`

  const totalHeight = units.length * 120 + 180

  return (
    <svg
      style={{
        position: 'absolute', top: 0, left: 0, width: '100%',
        height: totalHeight, zIndex: 0, overflow: 'visible',
      }}
      viewBox={`0 0 360 ${totalHeight}`}
      preserveAspectRatio="none"
    >
      {/* Shadow path */}
      <path d={d} fill="none" stroke={`${theme.color}15`} strokeWidth="28" strokeLinecap="round" />
      {/* Dashed road */}
      <path d={d} fill="none" stroke={`${theme.color}35`} strokeWidth="5" strokeDasharray="14 10" strokeLinecap="round" />
    </svg>
  )
}

export default function StageMapPage({ grade, subject, units, mascotId, onSelectUnit, onSubjectChange, onNavigate, profile, userPlan }) {
  const theme = SUBJECT_THEME[subject]
  const mascotSrc = mascotId === 'mona' ? '/mascots/mona/mascot-cheering.png' : '/mascots/taylor/mascot-cheering.png'
  const gradeLabel = { j1: '中1', j2: '中2', j3: '中3' }[grade]
  const totalHeight = units.length * 120 + 200

  const getStatus = (idx) => {
    const unit = units[idx]
    if (!unit) return 'locked'
    const subUnits = unit.subUnits || []
    const progresses = subUnits.map(s => getSubUnitPercent(s.slug))
    const allMastered = progresses.length > 0 && progresses.every(p => p >= 80)
    const anyAttempted = progresses.some(p => p > 0)
    if (allMastered) return 'mastered'
    if (anyAttempted) return 'in-progress'
    // First unit or previous unit has progress → available
    if (idx === 0) return 'available'
    const prevUnit = units[idx - 1]
    const prevProgresses = (prevUnit?.subUnits || []).map(s => getSubUnitPercent(s.slug))
    if (prevProgresses.some(p => p > 0)) return 'available'
    return 'available' // Keep all units accessible for now
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#FFFDF7' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,253,247,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #f1f1f1', padding: '12px 20px',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 14,
              background: `linear-gradient(135deg, ${theme.color}, ${theme.color}CC)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 3px 10px ${theme.color}30`,
            }}>
              <span className="font-bold" style={{ color: '#fff', fontSize: 14 }}>{gradeLabel}</span>
            </div>
            <div>
              <div className="font-bold" style={{ fontSize: 15, color: '#1a1a2e' }}>{profile?.displayName || '冒険者'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6b7280' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Flame size={13} style={{ color: '#FF6B6B' }} /> 3日連続
                </span>
                <span>残り 8/10問</span>
              </div>
            </div>
          </div>
          <button onClick={() => onNavigate('mypage')}
            style={{
              width: 40, height: 40, borderRadius: 12, background: '#f3f4f6',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <User size={18} style={{ color: '#6b7280' }} />
          </button>
        </div>
      </div>

      {/* Subject Tabs */}
      <div style={{ maxWidth: 600, margin: '16px auto 0', padding: '0 20px' }}>
        <div style={{ display: 'flex', borderRadius: 16, background: '#f3f4f6', padding: 4 }}>
          {Object.entries(SUBJECT_THEME).map(([key, t]) => (
            <button key={key} onClick={() => onSubjectChange(key)}
              style={{
                flex: 1, padding: '13px 0', borderRadius: 14, fontSize: 15, fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: subject === key ? '#fff' : 'transparent',
                color: subject === key ? t.color : '#9ca3af',
                boxShadow: subject === key ? '0 2px 10px rgba(0,0,0,0.06)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
              <t.icon size={18} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Adventure Roadmap */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '12px 20px 80px', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div key={subject} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'relative', height: totalHeight }}>

            {/* Winding road path */}
            <RoadPath units={units} theme={theme} />

            {/* Nodes */}
            {units.map((unit, idx) => (
              <PathNode key={unit.slug} unit={unit} index={idx} total={units.length}
                theme={theme} status={getStatus(idx)} onTap={onSelectUnit} />
            ))}

            {/* Goal at bottom */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: units.length * 0.06 }}
              style={{
                position: 'absolute',
                left: '50%', transform: 'translateX(-50%)',
                top: units.length * 120 + 40,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              }}
            >
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [0, 3, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{
                  width: 84, height: 84, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 28px rgba(255,165,0,0.35)',
                  border: '4px solid rgba(255,255,255,0.6)',
                }}
              >
                <Trophy size={38} style={{ color: '#fff' }} />
              </motion.div>
              <span className="font-bold" style={{ fontSize: 14, color: '#9ca3af', background: '#fff', borderRadius: 10, padding: '4px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                全クリア！
              </span>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Ad Banner for free users */}
      {userPlan === 'free' && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, padding: '8px 16px 12px', background: 'linear-gradient(to top, #FFFDF7, transparent)' }}>
          <AdBanner />
        </div>
      )}

      {/* Floating mascot */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'fixed', bottom: userPlan === 'free' ? 80 : 24, right: 20, zIndex: 40 }}
      >
        <img src={mascotSrc} alt="mascot"
          style={{ width: 72, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }} />
      </motion.div>
    </div>
  )
}
