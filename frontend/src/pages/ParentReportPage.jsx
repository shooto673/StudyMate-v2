import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, Share2, Download, Mail, BookOpen, Calculator, TrendingUp, Clock, Target, Calendar, Check, Lock, Crown } from 'lucide-react'

const MOCK_PARENT_DATA = {
  childName: '冒険者',
  grade: '中学1年',
  period: '2026年3月',
  totalStudyDays: 22,
  totalStudyMinutes: 198,
  avgDailyMinutes: 9,
  totalQuestions: 342,
  accuracy: 78,
  monthlyProgress: [
    { week: '第1週', questions: 72, accuracy: 71 },
    { week: '第2週', questions: 88, accuracy: 75 },
    { week: '第3週', questions: 95, accuracy: 80 },
    { week: '第4週', questions: 87, accuracy: 81 },
  ],
  subjects: [
    { name: '英語', icon: BookOpen, color: '#4DABF7', progress: 33, accuracy: 82, strongUnits: ['アルファベット', 'be動詞'], weakUnits: ['一般動詞'] },
    { name: '数学', icon: Calculator, color: '#FF922B', progress: 22, accuracy: 73, strongUnits: ['正負の数'], weakUnits: ['1次方程式', '文字と式'] },
  ],
  behaviorNotes: [
    '毎日コツコツ取り組めています 📚',
    '英語の正答率が先月より6%アップしました 📈',
    '数学の文字と式が苦手なようです。サポートをおすすめします 💡',
  ],
}

export default function ParentReportPage({ mascotId, userPlan, onBack, onNavigate }) {
  const [shared, setShared] = useState(false)
  const isPremium = userPlan === 'premium'
  const d = MOCK_PARENT_DATA

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

        {/* Monthly Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ background: '#fff', borderRadius: 20, padding: '20px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #f1f1f1', marginBottom: 16 }}>
          <h3 className="font-bold" style={{ fontSize: 15, color: '#1a1a2e', marginBottom: 14 }}>📈 月間推移</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {d.monthlyProgress.map((w, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: '#6b7280', width: 48, flexShrink: 0 }}>{w.week}</span>
                <div style={{ flex: 1, height: 10, borderRadius: 999, background: '#f3f4f6' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${w.accuracy}%` }}
                    transition={{ duration: 0.6, delay: 0.1 * i }}
                    style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #6C63FF, #38BDF8)' }} />
                </div>
                <span className="font-bold" style={{ fontSize: 13, color: '#1a1a2e', width: 40, textAlign: 'right' }}>{w.accuracy}%</span>
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
