import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, Trophy, Flame, Target, Zap, Star, BookOpen, Calculator, Award, Crown, Heart, Sparkles } from 'lucide-react'

const BADGES = [
  // Unlocked
  { id: 'first-quest', title: '初めての冒険', desc: '初めてクイズに挑戦した', emoji: '🗡️', color: '#6C63FF', unlocked: true, date: '3/15' },
  { id: 'streak-3', title: '3日連続ログイン', desc: '3日間休まず学習した', emoji: '🔥', color: '#FF6B6B', unlocked: true, date: '3/18' },
  { id: 'perfect', title: 'パーフェクト！', desc: '全問正解を達成した', emoji: '💯', color: '#FFD700', unlocked: true, date: '3/20' },
  { id: 'english-10', title: '英語マスターへの道', desc: '英語を10セッション学習した', emoji: '📚', color: '#4DABF7', unlocked: true, date: '3/22' },
  { id: 'accuracy-80', title: '正答率80%突破', desc: '正答率が80%を超えた', emoji: '🎯', color: '#51CF66', unlocked: true, date: '3/25' },
  { id: 'xp-500', title: 'XPハンター', desc: '累計500XPを獲得した', emoji: '⚡', color: '#FF922B', unlocked: true, date: '3/26' },
  { id: 'combo-5', title: 'コンボマスター', desc: '5コンボを達成した', emoji: '💥', color: '#C084FC', unlocked: true, date: '3/27' },
  // Locked
  { id: 'streak-7', title: '1週間チャレンジ', desc: '7日連続でログインする', emoji: '🔥', color: '#FF6B6B', unlocked: false, progress: 5, total: 7 },
  { id: 'streak-30', title: '30日の勇者', desc: '30日連続でログインする', emoji: '👑', color: '#FFD700', unlocked: false, progress: 5, total: 30 },
  { id: 'math-10', title: '数学チャレンジャー', desc: '数学を10セッション学習する', emoji: '🧮', color: '#FF922B', unlocked: false, progress: 4, total: 10 },
  { id: 'xp-2000', title: 'XPレジェンド', desc: '累計2000XPを獲得する', emoji: '🌟', color: '#FFD700', unlocked: false, progress: 1240, total: 2000 },
  { id: 'all-units', title: 'コンプリート！', desc: '全ステージをクリアする', emoji: '🏆', color: '#6C63FF', unlocked: false, progress: 6, total: 33 },
  { id: 'perfect-5', title: 'パーフェクト×5', desc: '全問正解を5回達成する', emoji: '💎', color: '#38BDF8', unlocked: false, progress: 1, total: 5 },
  { id: 'speed-demon', title: 'スピードスター', desc: '30秒以内にクイズを完了する', emoji: '⏱️', color: '#FF6B6B', unlocked: false, progress: 0, total: 1 },
  { id: 'both-subjects', title: '文武両道', desc: '英語と数学を同じ日に学習する', emoji: '🌈', color: '#51CF66', unlocked: false, progress: 0, total: 1 },
]

const MILESTONES = [
  { level: 5, title: 'ビギナー卒業', reward: 'プロフィールフレーム', done: true },
  { level: 10, title: '見習い冒険者', reward: '称号「見習い」', done: false },
  { level: 20, title: '熟練の冒険者', reward: '称号「熟練」', done: false },
  { level: 50, title: '伝説の勇者', reward: '称号「伝説」', done: false },
]

export default function AchievementsPage({ mascotId, onBack }) {
  const [filter, setFilter] = useState('all')
  const mascotSrc = mascotId === 'mona' ? '/mascots/mona/mascot-happy.png' : '/mascots/taylor/mascot-cheering.png'

  const unlockedCount = BADGES.filter(b => b.unlocked).length
  const totalCount = BADGES.length
  const completionPct = Math.round((unlockedCount / totalCount) * 100)

  const filteredBadges = filter === 'all' ? BADGES
    : filter === 'unlocked' ? BADGES.filter(b => b.unlocked)
    : BADGES.filter(b => !b.unlocked)

  return (
    <div style={{ minHeight: '100dvh', background: '#FFFDF7' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #FFD700, #FF922B)', padding: '16px 20px 64px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={onBack}
              style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={18} style={{ color: '#fff' }} />
            </button>
            <h1 className="font-bold" style={{ fontSize: 18, color: '#fff' }}>実績・バッジ</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <motion.img src={mascotSrc} alt="mascot"
              animate={{ y: [0, -4, 0], rotate: [0, 3, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ width: 60, height: 60, objectFit: 'contain' }} />
            <div style={{ flex: 1 }}>
              <div className="font-black" style={{ fontSize: 28, color: '#fff' }}>
                {unlockedCount}/{totalCount}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: 8 }}>
                バッジ獲得 ({completionPct}%)
              </div>
              <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${completionPct}%` }}
                  transition={{ duration: 1 }}
                  style={{ height: '100%', borderRadius: 999, background: '#fff' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '-36px auto 0', padding: '0 16px 40px', position: 'relative', zIndex: 1 }}>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', borderRadius: 14, background: '#fff', padding: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          {[
            { id: 'all', label: `すべて (${totalCount})` },
            { id: 'unlocked', label: `獲得済 (${unlockedCount})` },
            { id: 'locked', label: `未獲得 (${totalCount - unlockedCount})` },
          ].map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: filter === t.id ? 'linear-gradient(135deg, #FFD700, #FF922B)' : 'transparent',
                color: filter === t.id ? '#fff' : '#9ca3af',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {filteredBadges.map((badge, i) => (
            <motion.div key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              style={{
                background: '#fff', borderRadius: 20, padding: '20px 16px', textAlign: 'center',
                border: badge.unlocked ? `2px solid ${badge.color}30` : '2px solid #f1f1f1',
                boxShadow: badge.unlocked ? `0 4px 20px ${badge.color}15` : '0 2px 10px rgba(0,0,0,0.03)',
                position: 'relative', overflow: 'hidden',
                opacity: badge.unlocked ? 1 : 0.7,
              }}
            >
              {/* Shimmer for unlocked */}
              {badge.unlocked && (
                <motion.div
                  animate={{ x: [-100, 200] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
                  style={{
                    position: 'absolute', top: 0, left: 0, width: 60, height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    transform: 'skewX(-20deg)',
                  }}
                />
              )}

              {/* Badge Icon */}
              <div style={{
                width: 64, height: 64, borderRadius: 20, margin: '0 auto 10px',
                background: badge.unlocked ? `${badge.color}15` : '#f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, position: 'relative',
              }}>
                {badge.unlocked ? badge.emoji : <Lock size={24} style={{ color: '#d1d5db' }} />}
              </div>

              <div className="font-bold" style={{ fontSize: 14, color: badge.unlocked ? '#1a1a2e' : '#9ca3af', marginBottom: 4 }}>
                {badge.title}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5, marginBottom: 6 }}>
                {badge.desc}
              </div>

              {badge.unlocked ? (
                <span style={{ fontSize: 10, color: badge.color, fontWeight: 700 }}>
                  {badge.date} に獲得
                </span>
              ) : badge.progress !== undefined ? (
                <div>
                  <div style={{ height: 4, borderRadius: 999, background: '#f3f4f6', marginBottom: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(badge.progress / badge.total) * 100}%`,
                      height: '100%', borderRadius: 999, background: badge.color,
                    }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>
                    {badge.progress}/{badge.total}
                  </span>
                </div>
              ) : null}
            </motion.div>
          ))}
        </div>

        {/* Milestones */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ background: 'linear-gradient(135deg, #EDE9FF, #E7F5FF)', borderRadius: 20, padding: '20px 18px', border: '1px solid #d8d0ff' }}>
          <h3 className="font-bold" style={{ fontSize: 15, color: '#1a1a2e', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trophy size={16} style={{ color: '#FFD700' }} /> マイルストーン
          </h3>
          {MILESTONES.map((m, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 0', borderTop: i > 0 ? '1px solid rgba(108,99,255,0.1)' : 'none',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: m.done ? '#6C63FF' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: m.done ? '0 4px 12px rgba(108,99,255,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
              }}>
                {m.done ? (
                  <Sparkles size={18} style={{ color: '#fff' }} />
                ) : (
                  <span className="font-bold" style={{ fontSize: 13, color: '#9ca3af' }}>Lv.{m.level}</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div className="font-bold" style={{ fontSize: 14, color: m.done ? '#1a1a2e' : '#6b7280' }}>{m.title}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>報酬: {m.reward}</div>
              </div>
              {m.done && (
                <div style={{ width: 24, height: 24, borderRadius: 999, background: '#51CF66', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={14} style={{ color: '#fff' }} />
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
