import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, TrendingDown, Target, Zap, Flame, BookOpen, Calculator, Calendar, Trophy, Star, Award } from 'lucide-react'
import { getWeeklyReportData, getStreak } from '../lib/progressStore'

function TrendBadge({ current, previous }) {
  const diff = current - previous
  const isUp = diff > 0
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700,
      color: isUp ? '#2b8a3e' : diff < 0 ? '#c92a2a' : '#6b7280',
      background: isUp ? '#EBFBEE' : diff < 0 ? '#FFF0F0' : '#f3f4f6',
      borderRadius: 999, padding: '3px 10px',
    }}>
      {isUp ? <TrendingUp size={12} /> : diff < 0 ? <TrendingDown size={12} /> : null}
      {isUp ? '+' : ''}{diff}{typeof current === 'number' && current <= 100 ? '%' : '問'}
    </span>
  )
}

function BarChart({ data, theme = 'count' }) {
  const maxVal = Math.max(...data.map(d => theme === 'count' ? d.count : d.accuracy), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'end', gap: 6, height: 100, justifyContent: 'space-between' }}>
      {data.map((d, i) => {
        const val = theme === 'count' ? d.count : d.accuracy
        const h = Math.max((val / maxVal) * 80, 4)
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: val > 0 ? '#1a1a2e' : '#d1d5db' }}>
              {val > 0 ? val : '-'}
            </span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: h }}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
              style={{
                width: '100%', maxWidth: 32, borderRadius: 8,
                background: val > 0
                  ? theme === 'count' ? 'linear-gradient(to top, #6C63FF, #38BDF8)' : `linear-gradient(to top, #51CF66, #38BDF8)`
                  : '#e5e7eb',
              }}
            />
            <span style={{ fontSize: 11, color: d.day === '土' || d.day === '日' ? '#FF6B6B' : '#9ca3af', fontWeight: 600 }}>
              {d.day}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function WeeklyReportPage({ mascotId, onBack }) {
  const reportData = useMemo(() => getWeeklyReportData(), [])
  const streak = useMemo(() => getStreak(), [])

  const bestDay = reportData.dailyData.reduce((best, d) => d.count > best.count ? d : best, { day: '-', count: 0 })

  const achievements = []
  if (streak.current >= 3) achievements.push({ title: `${streak.current}日連続ログイン！`, emoji: '🔥' })
  if (reportData.accuracy >= 80) achievements.push({ title: '正答率80%突破！', emoji: '🎯' })
  if (reportData.totalQuestions >= 50) achievements.push({ title: '50問突破！', emoji: '🏆' })
  if (achievements.length === 0) achievements.push({ title: '今週も頑張ろう！', emoji: '💪' })

  const r = {
    weekLabel: reportData.weekLabel,
    totalQuestions: reportData.totalQuestions,
    prevWeekQuestions: reportData.prevWeekQuestions,
    accuracy: reportData.accuracy,
    prevAccuracy: reportData.prevAccuracy,
    xpEarned: reportData.xpEarned,
    bestDay: bestDay.day + '曜日',
    bestDayCount: bestDay.count,
    dailyData: reportData.dailyData,
    subjectBreakdown: [
      { subject: '英語', icon: BookOpen, color: '#4DABF7', questions: reportData.subjectBreakdown.english.questions, accuracy: reportData.subjectBreakdown.english.accuracy, bestUnit: '-' },
      { subject: '数学', icon: Calculator, color: '#FF922B', questions: reportData.subjectBreakdown.math.questions, accuracy: reportData.subjectBreakdown.math.accuracy, bestUnit: '-' },
    ],
    weakPoints: reportData.weakPoints,
    achievements,
  }
  const mascotSrc = mascotId === 'mona' ? '/mascots/mona/mascot-happy.png' : '/mascots/taylor/mascot-cheering.png'

  return (
    <div style={{ minHeight: '100dvh', background: '#FFFDF7' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #6C63FF, #38BDF8)', padding: '16px 20px 60px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button onClick={onBack}
              style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={18} style={{ color: '#fff' }} />
            </button>
            <div>
              <h1 className="font-bold" style={{ fontSize: 18, color: '#fff' }}>週間レポート</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Calendar size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{r.weekLabel}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <motion.img src={mascotSrc} alt="mascot"
              animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity }}
              style={{ width: 56, height: 56, objectFit: 'contain' }} />
            <div style={{ borderRadius: 14, background: 'rgba(255,255,255,0.15)', padding: '8px 18px', fontSize: 14, fontWeight: 700, color: '#fff' }}>
              今週もよくがんばったね！✨
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '-36px auto 0', padding: '0 16px 40px', position: 'relative', zIndex: 1 }}>
        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { icon: Target, label: '問題数', value: r.totalQuestions, color: '#6C63FF', trend: <TrendBadge current={r.totalQuestions} previous={r.prevWeekQuestions} /> },
            { icon: Trophy, label: '正答率', value: `${r.accuracy}%`, color: '#51CF66', trend: <TrendBadge current={r.accuracy} previous={r.prevAccuracy} /> },
            { icon: Zap, label: 'XP', value: r.xpEarned, color: '#FFB300' },
          ].map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              style={{
                background: '#fff', borderRadius: 18, padding: '16px 12px', textAlign: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #f1f1f1',
              }}>
              <s.icon size={20} style={{ color: s.color, margin: '0 auto 6px' }} />
              <div className="font-black" style={{ fontSize: 22, color: '#1a1a2e' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
              {s.trend}
            </motion.div>
          ))}
        </div>

        {/* Daily Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ background: '#fff', borderRadius: 20, padding: '20px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #f1f1f1', marginBottom: 16 }}>
          <h3 className="font-bold" style={{ fontSize: 15, color: '#1a1a2e', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            📊 日別アクティビティ
          </h3>
          <BarChart data={r.dailyData} theme="count" />
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: '#6b7280' }}>
            🏆 ベストデー: <strong>{r.bestDay}</strong>（{r.bestDayCount}問）
          </div>
        </motion.div>

        {/* Subject Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ background: '#fff', borderRadius: 20, padding: '20px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #f1f1f1', marginBottom: 16 }}>
          <h3 className="font-bold" style={{ fontSize: 15, color: '#1a1a2e', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            📚 科目別
          </h3>
          {r.subjectBreakdown.map((s, i) => (
            <div key={i} style={{ marginBottom: i < r.subjectBreakdown.length - 1 ? 14 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.icon size={14} style={{ color: s.color }} />
                  </div>
                  <span className="font-bold" style={{ fontSize: 14 }}>{s.subject}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                  <span style={{ color: '#6b7280' }}>{s.questions}問</span>
                  <span className="font-bold" style={{ color: s.accuracy >= 80 ? '#2b8a3e' : '#e67700' }}>{s.accuracy}%</span>
                </div>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: '#f3f4f6' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${s.accuracy}%` }}
                  transition={{ duration: 0.8, delay: 0.1 * i }}
                  style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${s.color}, ${s.color}AA)` }} />
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                ✨ 得意単元: {s.bestUnit}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Weak Points */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ background: '#fff', borderRadius: 20, padding: '20px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #f1f1f1', marginBottom: 16 }}>
          <h3 className="font-bold" style={{ fontSize: 15, color: '#1a1a2e', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            💪 苦手克服チャレンジ
          </h3>
          {r.weakPoints.map((w, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: 12, background: '#FFF8F0', marginBottom: i < r.weakPoints.length - 1 ? 8 : 0,
            }}>
              <div>
                <span className="font-bold" style={{ fontSize: 14, color: '#1a1a2e' }}>{w.unit}</span>
                <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>{w.subject}</span>
              </div>
              <span className="font-bold" style={{ fontSize: 14, color: '#e67700' }}>{w.accuracy}%</span>
            </div>
          ))}
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 10, textAlign: 'center' }}>
            来週はこの単元を重点的にやってみよう！
          </p>
        </motion.div>

        {/* Achievements */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ background: 'linear-gradient(135deg, #EDE9FF, #E7F5FF)', borderRadius: 20, padding: '20px 18px', border: '1px solid #d8d0ff' }}>
          <h3 className="font-bold" style={{ fontSize: 15, color: '#1a1a2e', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={16} style={{ color: '#6C63FF' }} /> 今週の実績
          </h3>
          <div style={{ display: 'flex', gap: 10 }}>
            {r.achievements.map((a, i) => (
              <motion.div key={i}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.15, type: 'spring' }}
                style={{
                  flex: 1, background: '#fff', borderRadius: 14, padding: '14px 12px', textAlign: 'center',
                  boxShadow: '0 2px 10px rgba(108,99,255,0.1)',
                }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>{a.emoji}</div>
                <div className="font-bold" style={{ fontSize: 12, color: '#1a1a2e' }}>{a.title}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
