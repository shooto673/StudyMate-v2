import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, Zap, Target, TrendingUp, ArrowRight, RotateCcw, Home } from 'lucide-react'
import AdBanner from '../components/AdBanner'

function AnimatedNumber({ target, duration = 1.5 }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / (duration * 60)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setValue(target); clearInterval(timer) }
      else setValue(Math.floor(start))
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [target, duration])
  return <>{value}</>
}

export default function QuizResultPage({ result, subUnit, mascotId, userPlan, onRetry, onNext, onHome }) {
  const { correctCount, totalQuestions, xpGained } = result
  const accuracy = Math.round((correctCount / totalQuestions) * 100)
  const isPerfect = correctCount === totalQuestions
  const isGreat = accuracy >= 80
  const isPassed = accuracy >= 60

  const mascotSrc = mascotId === 'mona'
    ? '/mascots/mona/mascot-happy.png'
    : isPassed ? '/mascots/taylor/mascot-cheering.png' : '/mascots/taylor/mascot-thinking.png'

  const grade = isPerfect ? { label: 'S', color: '#FFD700', bg: 'linear-gradient(135deg, #FFD700, #FFA500)' }
    : isGreat ? { label: 'A', color: '#51CF66', bg: 'linear-gradient(135deg, #51CF66, #38BDF8)' }
    : isPassed ? { label: 'B', color: '#4DABF7', bg: 'linear-gradient(135deg, #4DABF7, #6C63FF)' }
    : { label: 'C', color: '#FF922B', bg: 'linear-gradient(135deg, #FF922B, #FF6B6B)' }

  return (
    <div style={{ minHeight: '100dvh', background: '#FFFDF7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Stars animation */}
      {isPerfect && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div key={i}
              initial={{ y: -20, x: Math.random() * 400, opacity: 0 }}
              animate={{ y: '100vh', opacity: [0, 1, 0], rotate: 360 }}
              transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 1.5, repeat: Infinity }}
              style={{ position: 'absolute', fontSize: 20 }}>
              ✨
            </motion.div>
          ))}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: 440, width: '100%', position: 'relative', zIndex: 1 }}>

        {/* Mascot */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <motion.img src={mascotSrc} alt="mascot"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
            style={{ width: 100, height: 100, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }} />
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
            style={{ display: 'inline-block', borderRadius: 16, background: '#fff', padding: '8px 20px', fontSize: 14, fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginTop: -4 }}>
            {isPerfect ? 'パーフェクト！すごすぎ！🎉' : isGreat ? 'よくできたね！✨' : isPassed ? 'クリアおめでとう！' : 'もう一回チャレンジしよう！💪'}
          </motion.div>
        </div>

        {/* Result Card */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '32px 24px', boxShadow: '0 8px 40px rgba(0,0,0,0.06)', border: '1px solid #f1f1f1' }}>
          <h2 className="font-bold" style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', marginBottom: 4 }}>
            {subUnit?.title || 'クイズ'} 結果
          </h2>

          {/* Grade Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 150, delay: 0.6 }}
            style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}
          >
            <div style={{
              width: 96, height: 96, borderRadius: '50%', background: grade.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 8px 32px ${grade.color}40`,
            }}>
              <span className="font-black" style={{ fontSize: 48, color: '#fff' }}>{grade.label}</span>
            </div>
          </motion.div>

          {/* Stars */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
            {[0, 1, 2].map(i => {
              const filled = (isPerfect && i <= 2) || (isGreat && i <= 1) || (isPassed && i === 0)
              return (
                <motion.div key={i}
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: filled ? 1 : 0.7, rotate: 0 }}
                  transition={{ delay: 0.8 + i * 0.15, type: 'spring' }}
                >
                  <Star size={32} fill={filled ? '#FFD700' : 'none'}
                    style={{ color: filled ? '#FFD700' : '#d1d5db' }} />
                </motion.div>
              )
            })}
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            {[
              { icon: Target, label: '正答率', value: `${accuracy}%`, color: '#6C63FF' },
              { icon: Zap, label: '獲得XP', value: `+${xpGained}`, color: '#FFD700' },
              { icon: Trophy, label: '正解数', value: `${correctCount}/${totalQuestions}`, color: '#51CF66' },
              { icon: TrendingUp, label: 'レベル', value: 'Lv.7', color: '#FF922B' },
            ].map((stat, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.1 }}
                style={{
                  borderRadius: 16, padding: '16px 14px', textAlign: 'center',
                  background: '#f9fafb', border: '1px solid #f1f1f1',
                }}
              >
                <stat.icon size={20} style={{ color: stat.color, margin: '0 auto 8px' }} />
                <div className="font-black" style={{ fontSize: 22, color: '#1a1a2e', marginBottom: 2 }}>
                  {stat.value.startsWith('+') ? <>+<AnimatedNumber target={parseInt(stat.value.slice(1))} /></> : stat.value}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!isPassed && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={onRetry}
                style={{
                  width: '100%', padding: '16px 0', borderRadius: 16, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #FF922B, #FF6B6B)', color: '#fff',
                  fontSize: 16, fontWeight: 700, boxShadow: '0 4px 16px rgba(255,107,107,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                <RotateCcw size={18} /> もう一度チャレンジ！
              </motion.button>
            )}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={onNext}
              style={{
                width: '100%', padding: '16px 0', borderRadius: 16, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #6C63FF, #38BDF8)', color: '#fff',
                fontSize: 16, fontWeight: 700, boxShadow: '0 4px 16px rgba(108,99,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              {isPassed ? '次のステージへ' : 'ステージ選択に戻る'} <ArrowRight size={18} />
            </motion.button>
            <button onClick={onHome}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 16, cursor: 'pointer',
                background: '#fff', border: '2px solid #e5e7eb', color: '#6b7280',
                fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              <Home size={16} /> ステージマップに戻る
            </button>

            {/* Ad for free users */}
            {userPlan === 'free' && (
              <AdBanner style={{ marginTop: 8 }} />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
