import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, User, Bell, Volume2, Moon, Globe, Shield, Trash2, LogOut, ChevronRight, Check, Crown, Palette } from 'lucide-react'
import { useTheme } from '../lib/theme'

const NOTIFICATION_OPTIONS = [
  { id: 'daily', label: '毎日のリマインダー', desc: '毎日の学習を忘れないように通知' },
  { id: 'weekly', label: '週間レポート通知', desc: '日曜日にレポートをお届け' },
  { id: 'achievement', label: '実績達成通知', desc: 'バッジ獲得時にお知らせ' },
]

export default function SettingsPage({ mascotId, profile, userPlan, onBack, onNavigate, onSignOut }) {
  const { isDark, toggle: toggleTheme, theme } = useTheme()
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sm_notifications')) || { daily: true, weekly: true, achievement: true } } catch { return { daily: true, weekly: true, achievement: true } }
  })
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('sm_sound') !== 'false')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const updateNotifications = (v) => { setNotifications(v); localStorage.setItem('sm_notifications', JSON.stringify(v)) }
  const updateSound = (v) => { setSoundEnabled(v); localStorage.setItem('sm_sound', String(v)) }

  const mascotSrc = mascotId === 'mona' ? '/mascots/mona/mascot-happy.png' : '/mascots/taylor/mascot-normal.png'
  const mascotName = mascotId === 'mona' ? 'モナちゃん' : 'テイラーくん'
  const plan = userPlan || 'free'

  const Toggle = ({ value, onChange }) => (
    <button onClick={() => onChange(!value)}
      style={{
        width: 48, height: 28, borderRadius: 999, border: 'none', cursor: 'pointer',
        background: value ? '#6C63FF' : '#d1d5db', position: 'relative', transition: 'background 0.2s',
        flexShrink: 0,
      }}>
      <motion.div
        animate={{ x: value ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{ width: 22, height: 22, borderRadius: 999, background: '#fff', position: 'absolute', top: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
      />
    </button>
  )

  return (
    <div style={{ minHeight: '100dvh', background: theme.bg }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.cardBorder}` }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack}
            style={{ width: 36, height: 36, borderRadius: 10, background: theme.tabBg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={18} style={{ color: theme.textSecondary }} />
          </button>
          <h1 className="font-bold" style={{ fontSize: 18, color: theme.text }}>設定</h1>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 40px' }}>

        {/* Profile Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: theme.card, borderRadius: 20, padding: '20px 18px', boxShadow: `0 4px 16px ${theme.shadow}`, border: `1px solid ${theme.cardBorder}`, marginBottom: 16 }}>
          <h3 className="font-bold" style={{ fontSize: 15, color: theme.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={16} style={{ color: '#6C63FF' }} /> プロフィール
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: '#EDE9FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              <img src={mascotSrc} alt="mascot" style={{ width: 48, height: 48, objectFit: 'contain' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="font-bold" style={{ fontSize: 16, color: theme.text }}>{profile?.displayName || '冒険者'}</div>
              <div style={{ fontSize: 13, color: theme.textMuted }}>バディ: {mascotName}</div>
            </div>
          </div>

          {[
            { label: 'ニックネーム', value: profile?.displayName || '冒険者' },
            { label: 'メールアドレス', value: 'demo@studymate.app' },
            { label: '学年', value: '中学1年' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 0', borderTop: `1px solid ${theme.divider}`,
            }}>
              <span style={{ fontSize: 14, color: theme.textSecondary }}>{item.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, color: theme.text, fontWeight: 600 }}>{item.value}</span>
                <ChevronRight size={16} style={{ color: '#d1d5db' }} />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Plan */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          onClick={() => onNavigate?.('subscription')}
          style={{
            background: '#fff', borderRadius: 20, padding: '18px 18px', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #f1f1f1', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: plan === 'premium' ? 'linear-gradient(135deg, #FFD700, #FFA500)' : plan === 'standard' ? '#EDE9FF' : '#f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Crown size={20} style={{ color: plan === 'premium' ? '#fff' : plan === 'standard' ? '#6C63FF' : '#9ca3af' }} />
            </div>
            <div>
              <div className="font-bold" style={{ fontSize: 15, color: theme.text }}>利用プラン</div>
              <div style={{ fontSize: 13, color: '#6C63FF', fontWeight: 700 }}>
                {plan === 'premium' ? 'Premium' : plan === 'standard' ? 'Standard' : 'Free'}
              </div>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: '#d1d5db' }} />
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: theme.card, borderRadius: 20, padding: '20px 18px', boxShadow: `0 4px 16px ${theme.shadow}`, border: `1px solid ${theme.cardBorder}`, marginBottom: 16 }}>
          <h3 className="font-bold" style={{ fontSize: 15, color: theme.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={16} style={{ color: '#FF922B' }} /> 通知
          </h3>
          {NOTIFICATION_OPTIONS.map((opt, i) => (
            <div key={opt.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 0', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 14, color: theme.text, fontWeight: 600 }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: theme.textMuted }}>{opt.desc}</div>
              </div>
              <Toggle value={notifications[opt.id]} onChange={(v) => updateNotifications({ ...notifications, [opt.id]: v })} />
            </div>
          ))}
        </motion.div>

        {/* App Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ background: theme.card, borderRadius: 20, padding: '20px 18px', boxShadow: `0 4px 16px ${theme.shadow}`, border: `1px solid ${theme.cardBorder}`, marginBottom: 16 }}>
          <h3 className="font-bold" style={{ fontSize: 15, color: theme.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Palette size={16} style={{ color: '#C084FC' }} /> アプリ設定
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Volume2 size={18} style={{ color: theme.textSecondary }} />
              <div>
                <div style={{ fontSize: 14, color: theme.text, fontWeight: 600 }}>効果音</div>
                <div style={{ fontSize: 12, color: theme.textMuted }}>正解・不正解のサウンド</div>
              </div>
            </div>
            <Toggle value={soundEnabled} onChange={updateSound} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: `1px solid ${theme.divider}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Moon size={18} style={{ color: theme.textSecondary }} />
              <div>
                <div style={{ fontSize: 14, color: theme.text, fontWeight: 600 }}>ダークモード</div>
                <div style={{ fontSize: 12, color: theme.textMuted }}>目に優しい暗いテーマ</div>
              </div>
            </div>
            <Toggle value={isDark} onChange={toggleTheme} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: `1px solid ${theme.divider}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Globe size={18} style={{ color: theme.textSecondary }} />
              <div>
                <div style={{ fontSize: 14, color: theme.text, fontWeight: 600 }}>言語</div>
                <div style={{ fontSize: 12, color: theme.textMuted }}>アプリの表示言語</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, color: theme.text, fontWeight: 600 }}>日本語</span>
              <ChevronRight size={16} style={{ color: '#d1d5db' }} />
            </div>
          </div>
        </motion.div>

        {/* Data & Privacy */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: theme.card, borderRadius: 20, padding: '20px 18px', boxShadow: `0 4px 16px ${theme.shadow}`, border: `1px solid ${theme.cardBorder}`, marginBottom: 16 }}>
          <h3 className="font-bold" style={{ fontSize: 15, color: theme.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} style={{ color: '#51CF66' }} /> データ・プライバシー
          </h3>
          {[
            { label: 'プライバシーポリシー', action: true },
            { label: '利用規約', action: true },
            { label: 'データのエクスポート', action: true },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 0', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none', cursor: 'pointer',
            }}>
              <span style={{ fontSize: 14, color: theme.text }}>{item.label}</span>
              <ChevronRight size={16} style={{ color: '#d1d5db' }} />
            </div>
          ))}
        </motion.div>

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          <button onClick={onSignOut} style={{
            width: '100%', padding: '14px 0', borderRadius: 14, cursor: 'pointer',
            background: '#fff', border: '1px solid #e5e7eb', color: theme.textSecondary,
            fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <LogOut size={16} /> ログアウト
          </button>

          <button onClick={() => setShowDeleteConfirm(true)}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 14, cursor: 'pointer',
              background: '#fff', border: '1px solid #fecaca', color: '#dc2626',
              fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            <Trash2 size={14} /> アカウントを削除
          </button>
        </motion.div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
              }}
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{ background: '#fff', borderRadius: 24, padding: '28px 24px', maxWidth: 340, width: '100%', textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16, background: '#FEF2F2', margin: '0 auto 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Trash2 size={24} style={{ color: '#dc2626' }} />
                </div>
                <h3 className="font-bold" style={{ fontSize: 18, color: theme.text, marginBottom: 8 }}>本当に削除しますか？</h3>
                <p style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.7, marginBottom: 20 }}>
                  アカウントを削除すると、すべての学習データが失われます。この操作は取り消せません。
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      flex: 1, padding: '12px 0', borderRadius: 12, border: '1px solid #e5e7eb',
                      background: '#fff', color: theme.textSecondary, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}>
                    キャンセル
                  </button>
                  <button style={{
                    flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
                    background: '#dc2626', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}>
                    削除する
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* App Version */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#d1d5db' }}>
          StudyMate v2.0.0
        </div>
      </div>
    </div>
  )
}
