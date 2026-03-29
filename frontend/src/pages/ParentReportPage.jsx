import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, Share2, Download, Mail, BookOpen, Calculator, TrendingUp, Clock, Target, Calendar, Check, Lock, Crown } from 'lucide-react'
import { getAggregateStats, getSubjectStats, getStreak, getAllProgress, getRecentSessions } from '../lib/progressStore'

export default function ParentReportPage({ mascotId, userPlan, onBack, onNavigate }) {
  const [shared, setShared] = useState(false)
  const isPremium = userPlan === 'premium'

  const agg = useMemo(() => getAggregateStats(), [])
  const engStats = useMemo(() => getSubjectStats('english'), [])
  const mathStats = useMemo(() => getSubjectStats('math'), [])
  const streak = useMemo(() => getStreak(), [])
  const allProgress = useMemo(() => getAllProgress(), [])
  const sessions = useMemo(() => getRecentSessions(50), [])

  // Calculate study days
  const studyDates = [...new Set(sessions.map(s => s.date.slice(0, 10)))]

  // Find strong/weak units per subject
  const getUnitAnalysis = (subjectKey) => {
    const entries = Object.values(allProgress).filter(e => e.subject === subjectKey)
    const strong = entries.filter(e => e.bestScore >= 80).map(e => e.unitTitle)
    const weak = entries.filter(e => e.bestScore < 70 && e.attempts > 0).map(e => e.unitTitle)
    return { strong: [...new Set(strong)].slice(0, 3), weak: [...new Set(weak)].slice(0, 3) }
  }
  const engAnalysis = getUnitAnalysis('english')
  const mathAnalysis = getUnitAnalysis('math')

  // Behavior notes based on real data
  const behaviorNotes = []
  if (streak.current >= 3) behaviorNotes.push(`${streak.current}日連続で学習に取り組んでいます`)
  if (agg.totalQuestions > 0) behaviorNotes.push(`合計${agg.totalQuestions}問に挑戦しています`)
  if (agg.accuracy >= 80) behaviorNotes.push('正答率が80%以上で、よく理解できています')
  else if (agg.accuracy >= 60) behaviorNotes.push('基礎的な内容は理解できています')
  if (engStats.accuracy > 0 && mathStats.accuracy > 0) {
    if (engStats.accuracy > mathStats.accuracy + 10) behaviorNotes.push('英語が得意で、数学のサポートがあるとより伸びそうです')
    else if (mathStats.accuracy > engStats.accuracy + 10) behaviorNotes.push('数学が得意で、英語のサポートがあるとより伸びそうです')
  }
  if (behaviorNotes.length === 0) behaviorNotes.push('まだ学習データが少ないです。クイズに挑戦してみましょう！')

  const d = {
    childName: '冒険者',
    grade: '中学1年',
    period: `${new Date().getFullYear()}年${new Date().getMonth() + 1}月`,
    totalStudyDays: studyDates.length,
    totalQuestions: agg.totalQuestions,
    accuracy: agg.accuracy,
    avgDailyMinutes: studyDates.length > 0 ? Math.round((agg.totalQuestions * 0.5) / studyDates.length) : 0,
    subjects: [
      { name: '英語', icon: BookOpen, color: '#4DABF7', progress: engStats.totalUnits > 0 ? Math.round((engStats.unitsCleared / Math.max(engStats.totalUnits, 1)) * 100) : 0, accuracy: engStats.accuracy, strongUnits: engAnalysis.strong.length > 0 ? engAnalysis.strong : ['--'], weakUnits: engAnalysis.weak.length > 0 ? engAnalysis.weak : ['--'] },
      { name: '数学', icon: Calculator, color: '#FF922B', progress: mathStats.totalUnits > 0 ? Math.round((mathStats.unitsCleared / Math.max(mathStats.totalUnits, 1)) * 100) : 0, accuracy: mathStats.accuracy, strongUnits: mathAnalysis.strong.length > 0 ? mathAnalysis.strong : ['--'], weakUnits: mathAnalysis.weak.length > 0 ? mathAnalysis.weak : ['--'] },
    ],
    behaviorNotes,
    monthlyProgress: [],
  }

  if (!isPremium) {
    return (
      <div style={{ minHeight: '100dvh', background: '#FFFDF7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ maxWidth: 400, textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20, margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 24px rgba(255,165,0,0.3)',
          }}>
            <Crown size={36} style={{ color: '#fff' }} />
          </div>
          <h2 className="font-black" style={{ fontSize: 22, color: '#1a1a2e', marginBottom: 8 }}>
            プレミアム限定機能
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 24 }}>
            保護者レポート共有はプレミアムプランの機能です。<br />
            お子さまの学習状況を保護者にシェアできます。
          </p>
          <button onClick={() => onNavigate?.('subscription')}
            style={{
              padding: '14px 32px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#fff',
              fontSize: 15, fontWeight: 700, boxShadow: '0 4px 16px rgba(255,165,0,0.3)',
              marginBottom: 12,
            }}>
            プレミアムにアップグレード
          </button>
          <br />
          <button onClick={onBack}
            style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
            ← 戻る
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#FFFDF7' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #2d2b55)', padding: '16px 20px 60px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={onBack}
                style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeft size={18} style={{ color: '#fff' }} />
              </button>
              <div>
                <h1 className="font-bold" style={{ fontSize: 18, color: '#fff' }}>保護者レポート</h1>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Premium</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Crown size={14} style={{ color: '#FFD700' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#FFD700' }}>Premium</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Shield size={36} style={{ color: '#6C63FF' }} />
            <div>
              <div className="font-bold" style={{ fontSize: 16, color: '#fff' }}>{d.childName} さんの学習レポート</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{d.grade} ・ {d.period}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '-36px auto 0', padding: '0 16px 40px', position: 'relative', zIndex: 1 }}>
        {/* Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { icon: Calendar, label: '学習日数', value: `${d.totalStudyDays}日`, color: '#6C63FF' },
            { icon: Clock, label: '平均学習時間', value: `${d.avgDailyMinutes}分/日`, color: '#38BDF8' },
            { icon: Target, label: '総問題数', value: d.totalQuestions, color: '#51CF66' },
            { icon: TrendingUp, label: '正答率', value: `${d.accuracy}%`, color: '#FF922B' },
          ].map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              style={{ background: '#fff', borderRadius: 16, padding: '16px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #f1f1f1' }}>
              <s.icon size={18} style={{ color: s.color, marginBottom: 8 }} />
              <div className="font-black" style={{ fontSize: 20, color: '#1a1a2e' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Summary Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ background: '#fff', borderRadius: 20, padding: '20px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #f1f1f1', marginBottom: 16 }}>
          <h3 className="font-bold" style={{ fontSize: 15, color: '#1a1a2e', marginBottom: 14 }}>📈 学習サマリー</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: '総正解数', value: `${agg.totalCorrect}問`, color: '#51CF66' },
              { label: '総間違い数', value: `${agg.totalQuestions - agg.totalCorrect}問`, color: '#FF6B6B' },
              { label: '現在のレベル', value: `Lv.${agg.level}`, color: '#6C63FF' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: '#f9fafb' }}>
                <span style={{ fontSize: 14, color: '#6b7280' }}>{item.label}</span>
                <span className="font-bold" style={{ fontSize: 16, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Subject Details */}
        {d.subjects.map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.08 }}
            style={{ background: '#fff', borderRadius: 20, padding: '20px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #f1f1f1', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <span className="font-bold" style={{ fontSize: 16, color: '#1a1a2e' }}>{s.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: s.accuracy >= 80 ? '#2b8a3e' : '#e67700' }}>
                正答率 {s.accuracy}%
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
              <div>
                <div style={{ marginBottom: 2 }}>進捗率</div>
                <div className="font-bold" style={{ color: '#1a1a2e' }}>{s.progress}%</div>
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#2b8a3e', fontWeight: 600 }}>✅ 得意: </span>
              <span style={{ fontSize: 12, color: '#495057' }}>{s.strongUnits.join(', ')}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#e67700', fontWeight: 600 }}>⚠️ 苦手: </span>
              <span style={{ fontSize: 12, color: '#495057' }}>{s.weakUnits.join(', ')}</span>
            </div>
          </motion.div>
        ))}

        {/* Behavior Notes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{ background: '#fff', borderRadius: 20, padding: '20px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #f1f1f1', marginBottom: 20 }}>
          <h3 className="font-bold" style={{ fontSize: 15, color: '#1a1a2e', marginBottom: 12 }}>📝 学習の様子</h3>
          {d.behaviorNotes.map((note, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < d.behaviorNotes.length - 1 ? 10 : 0, fontSize: 13, color: '#495057', lineHeight: 1.6 }}>
              <Check size={16} style={{ color: '#6C63FF', flexShrink: 0, marginTop: 2 }} />
              {note}
            </div>
          ))}
        </motion.div>

        {/* Share Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setShared(true); setTimeout(() => setShared(false), 2000) }}
            style={{
              flex: 1, padding: '14px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: shared ? '#51CF66' : 'linear-gradient(135deg, #6C63FF, #38BDF8)', color: '#fff',
              fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 16px rgba(108,99,255,0.25)', transition: 'background 0.3s',
            }}>
            {shared ? <><Check size={16} /> 共有リンクをコピー！</> : <><Share2 size={16} /> レポートを共有</>}
          </button>
          <button style={{
            width: 50, borderRadius: 14, border: '2px solid #e5e7eb', background: '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Download size={18} style={{ color: '#6b7280' }} />
          </button>
        </div>
      </div>
    </div>
  )
}
