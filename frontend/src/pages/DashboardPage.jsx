import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Flame, Trophy, Target, Zap, BookOpen, Calculator, Crown, ChevronRight, Settings, Star, TrendingUp, Calendar, Award, BarChart3, Users, Gem, Pencil, Check, X } from 'lucide-react'
import { getAggregateStats, getSubjectStats, getWeeklyActivity, getStreak, getRecentSessions } from '../lib/progressStore'
import { useTheme } from '../lib/theme'

function StatCard({ icon: Icon, label, value, sub, color, delay = 0, theme }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        borderRadius: 18, padding: '18px 16px', background: theme.card,
        border: `1px solid ${theme.cardBorder}`, boxShadow: `0 2px 10px ${theme.shadow}`,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} style={{ color }} />
        </div>
        <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>{label}</span>
      </div>
      <div className="font-black" style={{ fontSize: 26, color: theme.text }}>{value}</div>
      {sub && <span style={{ fontSize: 11, color: theme.textMuted }}>{sub}</span>}
    </motion.div>
  )
}

function WeeklyChart({ data }) {
  const max = Math.max(...data, 1)
  const days = ['月', '火', '水', '木', '金', '土', '日']
  return (
    <div style={{ display: 'flex', alignItems: 'end', gap: 8, height: 80, justifyContent: 'space-between' }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${Math.max((v / max) * 60, 4)}px` }}
            transition={{ delay: 0.1 * i, duration: 0.5 }}
            style={{
              width: '100%', maxWidth: 28, borderRadius: 6,
              background: v > 0 ? 'linear-gradient(to top, #6C63FF, #38BDF8)' : '#e5e7eb',
            }}
          />
          <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>{days[i]}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage({ mascotId, profile, grade, userPlan, onBack, onNavigate, onGradeChange, onSignOut, onUpdateName }) {
  const { theme } = useTheme()
  const [tab, setTab] = useState('stats')
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState(profile?.displayName || '')
  const [nameSaving, setNameSaving] = useState(false)
  const agg = useMemo(() => getAggregateStats(), [])
  const english = useMemo(() => getSubjectStats('english'), [])
  const math = useMemo(() => getSubjectStats('math'), [])
  const weekly = useMemo(() => getWeeklyActivity(), [])
  const streak = useMemo(() => getStreak(), [])
  const sessions = useMemo(() => getRecentSessions(10), [])
  const stats = {
    level: agg.level,
    xp: agg.totalXp,
    xpToNext: agg.xpToNext,
    totalQuestions: agg.totalQuestions,
    accuracy: agg.accuracy,
    streak: streak.current,
    bestStreak: streak.best,
    plan: userPlan === 'free' ? 'Free' : userPlan === 'standard' ? 'Standard' : 'Premium',
    english, math,
    weeklyActivity: weekly.map(d => d.count),
    recentSessions: sessions.map(s => ({
      date: s.dateLabel,
      unit: s.unitTitle,
      subUnit: s.subUnitTitle,
      score: s.score,
      xp: s.xpGained,
    })),
  }
  const mascotSrc = mascotId === 'mona' ? '/mascots/mona/mascot-happy.png' : '/mascots/taylor/mascot-cheering.png'
  const xpProgress = agg.xpToNext > 0 ? ((agg.xpInLevel || 0) / agg.xpToNext) * 100 : 0

  return (
    <div style={{ minHeight: '100dvh', background: theme.bg }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #6C63FF, #38BDF8)', padding: '16px 20px 80px', position: 'relative' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button onClick={onBack}
              style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={18} style={{ color: '#fff' }} />
            </button>
            <h1 className="font-bold" style={{ fontSize: 17, color: '#fff' }}>マイページ</h1>
            <button onClick={() => onNavigate?.('settings')}
              style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={18} style={{ color: '#fff' }} />
            </button>
          </div>

          {/* Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <motion.img src={mascotSrc} alt="mascot"
              animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity }}
              style={{ width: 64, height: 64, objectFit: 'contain', background: 'rgba(255,255,255,0.2)', borderRadius: 16, padding: 4 }} />
            <div>
              <div className="font-black" style={{ fontSize: 20, color: '#fff' }}>{profile?.displayName || '冒険者'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  Lv.{stats.level}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                  <Flame size={13} /> {stats.streak}日連続
                </span>
              </div>
              {/* XP Bar */}
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.2)', overflow: 'hidden', minWidth: 120 }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 1 }}
                    style={{ height: '100%', borderRadius: 999, background: '#FFD700' }} />
                </div>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {stats.xp}/{stats.xpToNext} XP
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - overlaps header */}
      <div style={{ maxWidth: 600, margin: '-56px auto 0', padding: '0 16px 40px', position: 'relative', zIndex: 1 }}>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderRadius: 14, background: theme.card, padding: 4, boxShadow: `0 4px 16px ${theme.shadow}`, marginBottom: 20 }}>
          {[
            { id: 'stats', label: 'スタッツ' },
            { id: 'history', label: '学習履歴' },
            { id: 'account', label: 'アカウント' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: tab === t.id ? 'linear-gradient(135deg, #6C63FF, #38BDF8)' : 'transparent',
                color: tab === t.id ? '#fff' : theme.textMuted,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {tab === 'stats' && (
          <>
            {/* Main Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <StatCard icon={Target} label="正答率" value={`${stats.accuracy}%`} color="#6C63FF" delay={0.05} theme={theme} />
              <StatCard icon={Flame} label="連続ストリーク" value={`${stats.streak}日`} sub={`最長: ${stats.bestStreak}日`} color="#FF6B6B" delay={0.1} theme={theme} />
              <StatCard icon={Trophy} label="解いた問題数" value={stats.totalQuestions} color="#FFD700" delay={0.15} theme={theme} />
              <StatCard icon={Zap} label="獲得XP" value={stats.xp} color="#FF922B" delay={0.2} theme={theme} />
            </div>

            {/* Weekly Activity */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{ background: theme.card, borderRadius: 18, padding: '20px 18px', border: `1px solid ${theme.cardBorder}`, boxShadow: `0 2px 10px ${theme.shadow}`, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={16} style={{ color: '#6C63FF' }} />
                  <span className="font-bold" style={{ fontSize: 14, color: theme.text }}>今週のアクティビティ</span>
                </div>
                <span style={{ fontSize: 12, color: theme.textMuted }}>合計 {stats.weeklyActivity.reduce((a, b) => a + b, 0)}問</span>
              </div>
              <WeeklyChart data={stats.weeklyActivity} />
            </motion.div>

            {/* Quick Navigation */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { icon: BarChart3, label: '週間レポート', page: 'weeklyReport', color: '#6C63FF' },
                { icon: Award, label: '実績', page: 'achievements', color: '#FFD700' },
                { icon: Users, label: '保護者レポート', page: 'parentReport', color: '#38BDF8' },
                { icon: Gem, label: 'プラン', page: 'subscription', color: '#FF922B' },
              ].map((item, i) => (
                <button key={i} onClick={() => onNavigate?.(item.page)}
                  style={{
                    background: theme.card, borderRadius: 14, padding: '14px 8px', border: `1px solid ${theme.cardBorder}`,
                    boxShadow: `0 2px 10px ${theme.shadow}`, cursor: 'pointer', textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: `${item.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <item.icon size={18} style={{ color: item.color }} />
                  </div>
                  <span style={{ fontSize: 10, color: theme.textSecondary, fontWeight: 600, lineHeight: 1.3 }}>{item.label}</span>
                </button>
              ))}
            </motion.div>

            {/* Subject Breakdown */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 className="font-bold" style={{ fontSize: 14, color: theme.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={15} style={{ color: '#6C63FF' }} /> 科目別
              </h3>
              {[
                { key: 'english', icon: BookOpen, label: '英語', color: '#4DABF7', data: stats.english },
                { key: 'math', icon: Calculator, label: '数学', color: '#FF922B', data: stats.math },
              ].map(s => (
                <div key={s.key} style={{ background: theme.card, borderRadius: 16, padding: '16px 18px', border: `1px solid ${theme.cardBorder}`, boxShadow: `0 2px 10px ${theme.shadow}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <s.icon size={16} style={{ color: s.color }} />
                    </div>
                    <span className="font-bold" style={{ fontSize: 15, color: theme.text }}>{s.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                    <div>
                      <div style={{ color: theme.textMuted, marginBottom: 2 }}>問題数</div>
                      <div className="font-bold" style={{ color: theme.text }}>{s.data.total}</div>
                    </div>
                    <div>
                      <div style={{ color: theme.textMuted, marginBottom: 2 }}>正答率</div>
                      <div className="font-bold" style={{ color: theme.text }}>{s.data.accuracy}%</div>
                    </div>
                    <div>
                      <div style={{ color: theme.textMuted, marginBottom: 2 }}>クリア</div>
                      <div className="font-bold" style={{ color: theme.text }}>{s.data.unitsCleared}/{s.data.totalUnits}</div>
                    </div>
                  </div>
                  {/* Progress */}
                  <div style={{ marginTop: 10, height: 6, borderRadius: 999, background: theme.tabBg }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(s.data.unitsCleared / s.data.totalUnits) * 100}%` }}
                      transition={{ duration: 0.8 }}
                      style={{ height: '100%', borderRadius: 999, background: s.color }} />
                  </div>
                </div>
              ))}
            </motion.div>
          </>
        )}

        {/* History Tab */}
        {tab === 'history' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 className="font-bold" style={{ fontSize: 14, color: theme.text, marginBottom: 4 }}>最近の学習</h3>
            {stats.recentSessions.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{
                  background: theme.card, borderRadius: 16, padding: '14px 18px',
                  border: `1px solid ${theme.cardBorder}`, boxShadow: `0 2px 10px ${theme.shadow}`,
                  display: 'flex', alignItems: 'center', gap: 14,
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: s.score >= 80 ? '#EBFBEE' : s.score >= 60 ? '#E7F5FF' : '#FFF4E6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="font-black" style={{
                    fontSize: 16,
                    color: s.score >= 80 ? '#2b8a3e' : s.score >= 60 ? '#1971c2' : '#e67700',
                  }}>{s.score}%</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-bold" style={{ fontSize: 14, color: theme.text }}>{s.unit}</div>
                  <div style={{ fontSize: 12, color: theme.textMuted }}>{s.subUnit}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, color: '#FF922B', fontWeight: 700 }}>
                    <Zap size={13} /> +{s.xp}
                  </div>
                  <div style={{ fontSize: 11, color: '#d1d5db' }}>{s.date}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Account Tab */}
        {tab === 'account' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Plan Card */}
            <div style={{
              background: theme.card, borderRadius: 18, padding: '20px 18px',
              border: `1px solid ${theme.cardBorder}`, boxShadow: `0 2px 10px ${theme.shadow}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Crown size={18} style={{ color: '#FFD700' }} />
                  <span className="font-bold" style={{ fontSize: 15, color: theme.text }}>利用プラン</span>
                </div>
                <span style={{
                  borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700,
                  background: stats.plan === 'Free' ? theme.tabBg : '#EDE9FF',
                  color: stats.plan === 'Free' ? theme.textSecondary : '#6C63FF',
                }}>
                  {stats.plan}
                </span>
              </div>
              <p style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.6, marginBottom: 14 }}>
                {stats.plan === 'Free'
                  ? '1日10問まで解けます。アップグレードしてもっと冒険しよう！'
                  : 'すべての機能が使えます。'}
              </p>
              {stats.plan === 'Free' && (
                <button onClick={() => onNavigate?.('subscription')} style={{
                  width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #6C63FF, #38BDF8)', color: '#fff',
                  fontSize: 14, fontWeight: 700, boxShadow: '0 4px 16px rgba(108,99,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <Star size={15} /> アップグレード
                </button>
              )}
            </div>

            {/* Account Info */}
            <div style={{ background: '#fff', borderRadius: 18, padding: '20px 18px', border: '1px solid #f1f1f1', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
              <h3 className="font-bold" style={{ fontSize: 15, color: '#1a1a2e', marginBottom: 14 }}>アカウント情報</h3>
              {/* Nickname - editable */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0', borderBottom: '1px solid #f3f4f6',
              }}>
                <span style={{ fontSize: 14, color: '#6b7280' }}>ニックネーム</span>
                {editingName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      autoFocus
                      maxLength={20}
                      style={{
                        fontSize: 14, fontWeight: 700, color: '#1a1a2e', border: '2px solid #6C63FF',
                        borderRadius: 8, padding: '4px 8px', width: 120, outline: 'none', fontFamily: 'inherit',
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (newName.trim() && onUpdateName) {
                            setNameSaving(true)
                            onUpdateName(newName.trim()).then(() => { setEditingName(false) }).catch(() => {}).finally(() => setNameSaving(false))
                          }
                        }
                        if (e.key === 'Escape') { setEditingName(false); setNewName(profile?.displayName || '') }
                      }}
                    />
                    <button onClick={() => {
                      if (newName.trim() && onUpdateName) {
                        setNameSaving(true)
                        onUpdateName(newName.trim()).then(() => { setEditingName(false) }).catch(() => {}).finally(() => setNameSaving(false))
                      }
                    }} disabled={nameSaving || !newName.trim()}
                      style={{ background: '#6C63FF', border: 'none', borderRadius: 6, padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Check size={14} color="#fff" />
                    </button>
                    <button onClick={() => { setEditingName(false); setNewName(profile?.displayName || '') }}
                      style={{ background: '#e5e7eb', border: 'none', borderRadius: 6, padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <X size={14} color="#6b7280" />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="font-bold" style={{ fontSize: 14, color: '#1a1a2e' }}>{profile?.displayName || '冒険者'}</span>
                    <button onClick={() => { setNewName(profile?.displayName || ''); setEditingName(true) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
                      <Pencil size={13} color="#9ca3af" />
                    </button>
                  </div>
                )}
              </div>
              {/* Other account info */}
              {[
                { label: 'メール', value: profile?.email || '未設定' },
                { label: 'バディ', value: mascotId === 'mona' ? 'モナちゃん' : 'テイラーくん' },
                { label: '登録日', value: '2026年3月15日' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0', borderBottom: '1px solid #f3f4f6',
                }}>
                  <span style={{ fontSize: 14, color: '#6b7280' }}>{item.label}</span>
                  <span className="font-bold" style={{ fontSize: 14, color: '#1a1a2e' }}>{item.value}</span>
                </div>
              ))}
              {/* Grade selector */}
              <div style={{ padding: '12px 0' }}>
                <span style={{ fontSize: 14, color: '#6b7280', marginBottom: 8, display: 'block' }}>学年</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: 'j1', label: '中学1年' },
                    { id: 'j2', label: '中学2年' },
                    { id: 'j3', label: '中学3年' },
                  ].map(g => (
                    <button key={g.id} onClick={() => onGradeChange?.(g.id)}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 700,
                        border: grade === g.id ? '2px solid #6C63FF' : '2px solid #e5e7eb',
                        background: grade === g.id ? '#EDE9FF' : '#fff',
                        color: grade === g.id ? '#6C63FF' : '#6b7280',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Danger zone */}
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={onSignOut} style={{
                width: '100%', padding: '12px 0', borderRadius: 12, cursor: 'pointer',
                background: '#fff', border: '1px solid #e5e7eb', color: '#6b7280', fontSize: 14, fontWeight: 600,
              }}>
                ログアウト
              </button>
              <button style={{
                width: '100%', padding: '12px 0', borderRadius: 12, cursor: 'pointer',
                background: '#fff', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, fontWeight: 600,
              }}>
                アカウントを削除
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
