import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, X, Crown, Gem, Shield, Sparkles, Zap, Star } from 'lucide-react'

const PLANS = [
  {
    id: 'free', label: 'Free', icon: Shield, price: '¥0', period: '',
    color: '#6B7280', light: '#f3f4f6',
    features: [
      { text: '1日10問まで', included: true },
      { text: '基本フィードバック', included: true },
      { text: '週間レポート', included: false },
      { text: 'AI弱点分析', included: false },
      { text: '保護者レポート共有', included: false },
      { text: '広告なし', included: false },
    ],
  },
  {
    id: 'standard', label: 'Standard', icon: Gem, price: '¥699', period: '/月',
    color: '#6C63FF', light: '#EDE9FF', popular: true,
    features: [
      { text: '1日50問まで', included: true },
      { text: '基本フィードバック', included: true },
      { text: '週間レポート', included: true },
      { text: '実績バッジ', included: true },
      { text: 'AI弱点分析', included: false },
      { text: '保護者レポート共有', included: false },
      { text: '広告なし', included: true },
    ],
  },
  {
    id: 'premium', label: 'Premium', icon: Crown, price: '¥999', period: '/月',
    color: '#FFD700', light: '#FFF8E1', badge: '最強',
    features: [
      { text: '問題数 無制限', included: true, highlight: true },
      { text: '基本フィードバック', included: true },
      { text: '週間レポート', included: true },
      { text: 'AI弱点分析', included: true, highlight: true },
      { text: '保護者レポート共有', included: true, highlight: true },
      { text: '実績バッジ', included: true },
      { text: '広告なし', included: true },
      { text: '優先サポート', included: true },
    ],
  },
]

export default function SubscriptionPage({ currentPlan, mascotId, onBack, onSelectPlan }) {
  const [selected, setSelected] = useState(currentPlan || 'free')
  const mascotSrc = mascotId === 'mona' ? '/mascots/mona/mascot-happy.png' : '/mascots/taylor/mascot-cheering.png'

  return (
    <div style={{ minHeight: '100dvh', background: '#FFFDF7' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f1f1' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack}
            style={{ width: 36, height: 36, borderRadius: 10, background: '#f3f4f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={18} style={{ color: '#6b7280' }} />
          </button>
          <h1 className="font-bold" style={{ fontSize: 18, color: '#1a1a2e' }}>プラン管理</h1>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px 40px' }}>
        {/* Mascot */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <motion.img src={mascotSrc} alt="mascot"
            animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}
            style={{ width: 80, height: 80, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }} />
          <h2 className="font-black" style={{ fontSize: 22, color: '#1a1a2e', marginTop: 8 }}>
            冒険をパワーアップ！
          </h2>
          <p style={{ fontSize: 13, color: '#9ca3af' }}>プランを選んでもっと楽しく学ぼう</p>
        </div>

        {/* Plan Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {PLANS.map((plan, idx) => {
            const isCurrentPlan = currentPlan === plan.id
            const isSelected = selected === plan.id
            return (
              <motion.div key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelected(plan.id)}
                style={{
                  borderRadius: 22, padding: '24px 20px', cursor: 'pointer',
                  background: '#fff',
                  border: isSelected ? `3px solid ${plan.color}` : '3px solid #f1f1f1',
                  boxShadow: isSelected ? `0 8px 32px ${plan.color}20` : '0 4px 16px rgba(0,0,0,0.04)',
                  position: 'relative', overflow: 'hidden', transition: 'all 0.2s',
                }}
              >
                {/* Popular / Badge */}
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: plan.color, borderRadius: 999, padding: '4px 12px',
                    fontSize: 11, fontWeight: 800, color: '#fff',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Star size={11} fill="#fff" /> 一番人気
                  </div>
                )}
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)', borderRadius: 999, padding: '4px 12px',
                    fontSize: 11, fontWeight: 800, color: '#fff',
                  }}>
                    {plan.badge}
                  </div>
                )}

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: plan.light, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <plan.icon size={22} style={{ color: plan.color }} />
                  </div>
                  <div>
                    <div className="font-black" style={{ fontSize: 18, color: '#1a1a2e' }}>{plan.label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                      <span className="font-black" style={{ fontSize: 26, color: plan.color }}>{plan.price}</span>
                      <span style={{ fontSize: 13, color: '#9ca3af' }}>{plan.period}</span>
                    </div>
                  </div>
                  {isCurrentPlan && (
                    <span style={{
                      marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                      background: '#EBFBEE', color: '#2b8a3e', borderRadius: 999, padding: '4px 12px',
                    }}>
                      現在のプラン
                    </span>
                  )}
                </div>

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                        background: f.included ? (f.highlight ? plan.color : '#51CF66') : '#e5e7eb',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {f.included ? <Check size={12} style={{ color: '#fff' }} /> : <X size={12} style={{ color: '#9ca3af' }} />}
                      </div>
                      <span style={{
                        fontSize: 13,
                        color: f.included ? '#1a1a2e' : '#b0b0b0',
                        fontWeight: f.highlight ? 700 : 400,
                        textDecoration: f.included ? 'none' : 'line-through',
                      }}>
                        {f.text}
                        {f.highlight && ' 🔥'}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* CTA */}
        {selected !== currentPlan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ position: 'sticky', bottom: 20, marginTop: 24 }}>
            <button
              onClick={() => onSelectPlan?.(selected)}
              style={{
                width: '100%', padding: '18px 0', borderRadius: 18, border: 'none', cursor: 'pointer',
                background: selected === 'premium'
                  ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                  : 'linear-gradient(135deg, #6C63FF, #38BDF8)',
                color: '#fff', fontSize: 17, fontWeight: 800,
                boxShadow: selected === 'premium'
                  ? '0 6px 24px rgba(255,165,0,0.35)'
                  : '0 6px 24px rgba(108,99,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              <Sparkles size={18} />
              {selected === 'free' ? 'Freeプランに変更' : `${PLANS.find(p => p.id === selected)?.label}にアップグレード`}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
