import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, UserPlus, Copy, Check, X, Crown, Users, Globe, Trophy, Search, Wifi } from 'lucide-react'

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']

function RankBadge({ rank }) {
  if (rank > 3) return <span className="font-black" style={{ fontSize: 16, color: '#9ca3af', width: 32, textAlign: 'center' }}>{rank}</span>
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `${RANK_COLORS[rank - 1]}20`, position: 'relative',
    }}>
      {rank === 1 && <Crown size={18} style={{ color: RANK_COLORS[0] }} />}
      {rank === 2 && <span className="font-black" style={{ fontSize: 15, color: RANK_COLORS[1] }}>2</span>}
      {rank === 3 && <span className="font-black" style={{ fontSize: 15, color: RANK_COLORS[2] }}>3</span>}
    </div>
  )
}

function AvatarCircle({ name, size = 40, online }) {
  const colors = ['#6C63FF', '#FF6B6B', '#51CF66', '#FFD700', '#38BDF8', '#FF922B', '#C084FC', '#F472B6']
  const initial = (name || '?')[0]
  const colorIndex = initial.charCodeAt(0) % colors.length
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: 999, background: colors[colorIndex],
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="font-bold" style={{ fontSize: size * 0.4, color: '#fff' }}>{initial}</span>
      </div>
      {online !== undefined && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 999,
          background: online ? '#51CF66' : '#d1d5db', border: '2px solid #fff',
        }} />
      )}
    </div>
  )
}

export default function FriendsPage({ onBack, profile, mascotId, friends = [], ranking = [], onAddFriend, onRemoveFriend, friendCode = 'SM-XXXX' }) {
  const [tab, setTab] = useState('friends')
  const [rankingFilter, setRankingFilter] = useState('friends')
  const [codeInput, setCodeInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [adding, setAdding] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(friendCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  const handleAddFriend = () => {
    if (!codeInput.trim()) return
    setAdding(true)
    onAddFriend?.(codeInput.trim())
    setTimeout(() => {
      setCodeInput('')
      setAdding(false)
    }, 600)
  }

  const filteredRanking = rankingFilter === 'friends'
    ? ranking.filter(r => r.isFriend || r.isMe)
    : ranking

  return (
    <div style={{ minHeight: '100dvh', background: '#FFFDF7' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #6C63FF, #38BDF8)', padding: '16px 20px 72px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <button onClick={onBack}
              style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={18} style={{ color: '#fff' }} />
            </button>
            <h1 className="font-bold" style={{ fontSize: 18, color: '#fff' }}>フレンド</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={18} style={{ color: 'rgba(255,255,255,0.8)' }} />
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
              {friends.length}人のフレンド
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 600, margin: '-48px auto 0', padding: '0 16px 40px', position: 'relative', zIndex: 1 }}>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderRadius: 14, background: '#fff', padding: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          {[
            { id: 'friends', label: 'フレンド' },
            { id: 'ranking', label: 'ランキング' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: tab === t.id ? 'linear-gradient(135deg, #6C63FF, #38BDF8)' : 'transparent',
                color: tab === t.id ? '#fff' : '#9ca3af',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Friends Tab */}
          {tab === 'friends' && (
            <motion.div key="friends" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>

              {/* Friend Code Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                style={{ background: '#fff', borderRadius: 18, padding: 18, border: '1px solid #f1f1f1', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600, marginBottom: 8 }}>あなたのフレンドコード</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    flex: 1, background: '#f3f4f6', borderRadius: 12, padding: '12px 16px',
                    fontSize: 20, fontWeight: 800, color: '#6C63FF', letterSpacing: 2, textAlign: 'center',
                    fontFamily: 'monospace',
                  }}>
                    {friendCode}
                  </div>
                  <button onClick={handleCopy}
                    style={{
                      width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: copied ? '#51CF66' : '#6C63FF', transition: 'background 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    {copied ? <Check size={18} style={{ color: '#fff' }} /> : <Copy size={18} style={{ color: '#fff' }} />}
                  </button>
                </div>
                {copied && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ fontSize: 12, color: '#51CF66', fontWeight: 600, marginTop: 6, textAlign: 'center' }}>
                    コピーしました！
                  </motion.div>
                )}
              </motion.div>

              {/* Add Friend Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ background: '#fff', borderRadius: 18, padding: 18, border: '1px solid #f1f1f1', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600, marginBottom: 8 }}>フレンドを追加</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                      value={codeInput}
                      onChange={e => setCodeInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
                      placeholder="フレンドコードを入力..."
                      style={{
                        width: '100%', padding: '12px 12px 12px 36px', borderRadius: 12, border: '1px solid #e5e7eb',
                        fontSize: 14, outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box',
                        background: '#fafafa',
                      }}
                    />
                  </div>
                  <button onClick={handleAddFriend} disabled={!codeInput.trim() || adding}
                    style={{
                      padding: '0 18px', borderRadius: 12, border: 'none', cursor: codeInput.trim() ? 'pointer' : 'default',
                      background: codeInput.trim() ? '#6C63FF' : '#e5e7eb', color: '#fff', fontWeight: 700, fontSize: 14,
                      display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', whiteSpace: 'nowrap',
                      opacity: adding ? 0.7 : 1,
                    }}>
                    <UserPlus size={16} />
                    追加
                  </button>
                </div>
              </motion.div>

              {/* Friend List */}
              {friends.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  style={{
                    background: '#fff', borderRadius: 18, padding: '40px 20px', border: '1px solid #f1f1f1',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.04)', textAlign: 'center',
                  }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
                  <div className="font-bold" style={{ fontSize: 15, color: '#1a1a2e', marginBottom: 6 }}>まだフレンドがいません</div>
                  <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>
                    フレンドを追加して一緒に冒険しよう！
                  </div>
                </motion.div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {friends.map((f, i) => (
                    <motion.div key={f.id || i}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                      style={{
                        background: '#fff', borderRadius: 18, padding: '14px 16px', border: '1px solid #f1f1f1',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 12,
                      }}>
                      <AvatarCircle name={f.displayName || f.name} online={f.online} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="font-bold" style={{ fontSize: 14, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {f.displayName || f.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                          <span style={{ fontSize: 12, color: '#6C63FF', fontWeight: 700, background: '#6C63FF15', borderRadius: 999, padding: '1px 8px' }}>
                            Lv.{f.level || 1}
                          </span>
                          <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>
                            {f.xp || 0} XP
                          </span>
                        </div>
                      </div>
                      <button onClick={() => onRemoveFriend?.(f.id)}
                        style={{
                          width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                        <X size={14} style={{ color: '#EF4444' }} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Ranking Tab */}
          {tab === 'ranking' && (
            <motion.div key="ranking" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>

              {/* Ranking Sub-filters */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[
                  { id: 'friends', label: 'フレンド', icon: Users },
                  { id: 'global', label: '全体', icon: Globe },
                ].map(f => (
                  <button key={f.id} onClick={() => setRankingFilter(f.id)}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 700,
                      border: rankingFilter === f.id ? '2px solid #6C63FF' : '1px solid #e5e7eb',
                      cursor: 'pointer', transition: 'all 0.2s',
                      background: rankingFilter === f.id ? '#6C63FF10' : '#fff',
                      color: rankingFilter === f.id ? '#6C63FF' : '#9ca3af',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                    <f.icon size={15} />
                    {f.label}
                  </button>
                ))}
              </motion.div>

              {/* Leaderboard */}
              {filteredRanking.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{
                    background: '#fff', borderRadius: 18, padding: '40px 20px', border: '1px solid #f1f1f1',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.04)', textAlign: 'center',
                  }}>
                  <Trophy size={40} style={{ color: '#e5e7eb', marginBottom: 12 }} />
                  <div className="font-bold" style={{ fontSize: 15, color: '#1a1a2e', marginBottom: 6 }}>ランキングデータがありません</div>
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>フレンドを追加するとランキングが表示されます</div>
                </motion.div>
              ) : (
                <div style={{
                  background: '#fff', borderRadius: 18, border: '1px solid #f1f1f1',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden',
                }}>
                  {filteredRanking.map((r, i) => (
                    <motion.div key={r.id || i}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                        borderBottom: i < filteredRanking.length - 1 ? '1px solid #f5f5f5' : 'none',
                        background: r.isMe ? '#6C63FF08' : 'transparent',
                      }}>
                      <RankBadge rank={r.rank || i + 1} />
                      <AvatarCircle name={r.displayName || r.name} size={38} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="font-bold" style={{
                            fontSize: 14, color: r.isMe ? '#6C63FF' : '#1a1a2e',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {r.displayName || r.name}
                          </span>
                          {r.isMe && (
                            <span style={{ fontSize: 10, color: '#6C63FF', fontWeight: 700, background: '#6C63FF15', borderRadius: 999, padding: '1px 6px' }}>
                              あなた
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>
                          Lv.{r.level || 1}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div className="font-black" style={{ fontSize: 15, color: '#1a1a2e' }}>{r.xp || 0}</div>
                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>XP</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
