import { motion } from 'framer-motion'

const COLORS = ['#FFD700', '#FF6B6B', '#51CF66', '#6C63FF', '#38BDF8', '#FF922B', '#f472b6', '#E040FB']

function ConfettiPiece({ index }) {
  const color = COLORS[index % COLORS.length]
  const startX = 10 + Math.random() * 80
  const drift = (Math.random() - 0.5) * 250
  const size = 8 + Math.random() * 10
  const delay = Math.random() * 0.3
  const duration = 1.8 + Math.random() * 1.2
  const rotation = Math.random() * 1080 - 540
  const shape = index % 3 // 0=circle, 1=rect, 2=triangle

  const shapeStyle = shape === 0
    ? { width: size, height: size, borderRadius: '50%', background: color }
    : shape === 1
    ? { width: size * 1.2, height: size * 0.5, borderRadius: 2, background: color }
    : { width: 0, height: 0, background: 'transparent',
        borderLeft: `${size / 2}px solid transparent`,
        borderRight: `${size / 2}px solid transparent`,
        borderBottom: `${size}px solid ${color}`,
      }

  return (
    <motion.div
      initial={{ opacity: 1, y: 0, x: 0, rotate: 0, scale: 0.5 }}
      animate={{
        opacity: [0, 1, 1, 0.8, 0],
        y: [-40, 100, 350 + Math.random() * 300],
        x: [0, drift * 0.3, drift],
        rotate: [0, rotation * 0.5, rotation],
        scale: [0.5, 1.3, 0.8],
      }}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        position: 'absolute',
        top: '5%',
        left: `${startX}%`,
        pointerEvents: 'none',
        ...shapeStyle,
      }}
    />
  )
}

export default function Confetti({ count = 40 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {Array.from({ length: count }).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </div>
  )
}
