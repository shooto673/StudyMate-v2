import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Flame, Zap, Star, Trophy, Shield, BookOpen, Brain,
  ChevronRight, Sparkles, Target, Clock, Users,
  Crown, Gem, Lock, Check, ArrowRight, Play,
  Swords, Map, Heart
} from 'lucide-react'

/* ───── container helper ───── */
const cx = (...cls) => cls.filter(Boolean).join(' ')
const Container = ({ children, size = 'lg' }) => {
  const maxW = { sm: 640, md: 768, lg: 1024, xl: 1200 }
  return (
    <div style={{ width: '100%', maxWidth: maxW[size], marginLeft: 'auto', marginRight: 'auto', paddingLeft: 24, paddingRight: 24, boxSizing: 'border-box' }}>
      {children}
    </div>
  )
}

/* ───── floating particles ───── */
function FloatingParticles() {
  const [particles] = useState(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      icon: ['⭐', '✨', '💎', '🔥', '⚡', '🎯', '📚', '🏆'][i % 8],
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 90,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      size: 14 + Math.random() * 14,
    }))
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute"
          style={{ left: `${p.x}%`, top: `${p.y}%`, fontSize: p.size, opacity: 0.15 }}
          animate={{ y: [-10, 10, -10], rotate: [0, 10, -10, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        >
          {p.icon}
        </motion.span>
      ))}
    </div>
  )
}

/* ───── stat counter ───── */
function AnimatedCounter({ end, suffix = '', duration = 2 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = end / (duration * 60)
    const id = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(id) }
      else setCount(Math.floor(start))
    }, 1000 / 60)
    return () => clearInterval(id)
  }, [inView, end, duration])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

/* ───── feature card ───── */
function FeatureCard({ icon: Icon, color, title, desc, badge, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6 }}
      className="relative rounded-2xl bg-white p-6 border border-gray-100"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
    >
      {badge && (
        <span className="absolute top-3 right-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-2.5 py-0.5 text-[11px] font-bold text-white">
          {badge}
        </span>
      )}
      <div
        className="mb-4 inline-flex items-center justify-center rounded-xl"
        style={{ background: `${color}20`, padding: '12px' }}
      >
        <Icon size={28} style={{ color }} strokeWidth={2.5} />
      </div>
      <h3 className="mb-2 text-lg font-bold" style={{ color: '#1a1a2e' }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{desc}</p>
    </motion.div>
  )
}

/* ───── quest / step card ───── */
function QuestStep({ number, title, desc, icon: Icon, color, delay, isLast }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="flex gap-5"
    >
      <div className="flex flex-col items-center">
        <div
          className="flex items-center justify-center rounded-full text-white font-bold text-lg"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)`, width: 48, height: 48, boxShadow: `0 4px 12px ${color}40`, flexShrink: 0 }}
        >
          {number}
        </div>
        {!isLast && <div style={{ width: 2, flexGrow: 1, marginTop: 8, background: 'linear-gradient(to bottom, #e5e7eb, transparent)' }} />}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 32 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
          <Icon size={18} style={{ color }} />
          <h3 className="font-bold" style={{ color: '#1a1a2e' }}>{title}</h3>
        </div>
        <p className="text-sm" style={{ color: '#6b7280', lineHeight: 1.7 }}>{desc}</p>
      </div>
    </motion.div>
  )
}

/* ───── pricing card ───── */
function PricingCard({ plan, price, period, features, cta, popular, color, icon: Icon, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -6 }}
      style={{
        position: 'relative',
        borderRadius: 20,
        background: '#fff',
        padding: 28,
        boxShadow: popular ? '0 8px 40px rgba(108,99,255,0.18)' : '0 4px 24px rgba(0,0,0,0.06)',
        border: popular ? '2px solid #6C63FF' : '1px solid #f1f1f1',
        transform: popular ? 'scale(1.03)' : 'none',
      }}
    >
      {popular && (
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)' }}>
          <span style={{
            borderRadius: 999, background: 'linear-gradient(135deg, #6C63FF, #38BDF8)',
            padding: '5px 16px', fontSize: 12, fontWeight: 700, color: '#fff',
            boxShadow: '0 4px 12px rgba(108,99,255,0.3)', whiteSpace: 'nowrap'
          }}>
            🔥 一番人気
          </span>
        </div>
      )}
      <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
        <div style={{ borderRadius: 10, padding: 8, background: `${color}15` }}>
          <Icon size={22} style={{ color }} />
        </div>
        <span className="text-lg font-bold">{plan}</span>
      </div>
      <div style={{ marginBottom: 20 }}>
        <span className="font-black" style={{ fontSize: 40 }}>{price}</span>
        {period && <span className="text-sm" style={{ color: '#9ca3af', marginLeft: 4 }}>{period}</span>}
      </div>
      <ul style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            {f.locked
              ? <Lock size={16} style={{ marginTop: 2, flexShrink: 0, color: '#d1d5db' }} />
              : <Check size={16} style={{ marginTop: 2, flexShrink: 0, color }} />}
            <span style={{ color: f.locked ? '#d1d5db' : '#4b5563' }}>{f.text}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onAction}
        style={{
          width: '100%', borderRadius: 14, padding: '14px 0', fontSize: 14, fontWeight: 700,
          border: 'none', cursor: 'pointer', transition: 'all 0.2s',
          background: popular ? 'linear-gradient(135deg, #6C63FF, #38BDF8)' : '#f3f4f6',
          color: popular ? '#fff' : '#374151',
          boxShadow: popular ? '0 4px 16px rgba(108,99,255,0.3)' : 'none',
        }}
      >
        {cta}
      </button>
    </motion.div>
  )
}

/* ───── Mascot Image with Motion ───── */
const TAYLOR_MOODS = [
  { key: 'normal', src: '/mascots/taylor/mascot-normal.png', label: 'よろしくね！', motion: { y: [0, -8, 0] } },
  { key: 'happy', src: '/mascots/taylor/mascot-happy.png', label: 'やったー！', motion: { y: [0, -12, 0], rotate: [0, 5, -5, 0] } },
  { key: 'thinking', src: '/mascots/taylor/mascot-thinking.png', label: 'う〜ん…', motion: { y: [0, -4, 0], x: [-2, 2, -2] } },
  { key: 'cheering', src: '/mascots/taylor/mascot-cheering.png', label: 'がんばれ！', motion: { y: [0, -14, 0], scale: [1, 1.05, 1] } },
  { key: 'surprised', src: '/mascots/taylor/mascot-surprised.png', label: 'おぉ！', motion: { scale: [1, 1.1, 1] } },
]

const MONA_MOODS = [
  { key: 'normal', src: '/mascots/mona/mascot-happy.png', label: 'にゃ〜！', motion: { y: [0, -8, 0] } },
  { key: 'happy', src: '/mascots/mona/mascot-cheering.png', label: 'すごーい！', motion: { y: [0, -10, 0], rotate: [0, -5, 5, 0] } },
  { key: 'thinking', src: '/mascots/mona/mascot-thinking.png', label: 'にゃんだろ…', motion: { y: [0, -4, 0], x: [2, -2, 2] } },
  { key: 'studying', src: '/mascots/mona/mascot-studying.png', label: '勉強中にゃ！', motion: { y: [0, -6, 0] } },
]

function MascotShowcase() {
  const [activeChar, setActiveChar] = useState('taylor')
  const [moodIdx, setMoodIdx] = useState(0)
  const moods = activeChar === 'taylor' ? TAYLOR_MOODS : MONA_MOODS

  useEffect(() => {
    setMoodIdx(0)
  }, [activeChar])

  useEffect(() => {
    const t = setInterval(() => setMoodIdx(m => (m + 1) % moods.length), 2800)
    return () => clearInterval(t)
  }, [moods.length])

  const current = moods[moodIdx]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Character image with motion */}
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeChar}-${current.key}`}
            initial={{ scale: 0.6, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.6, opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{ width: '100%', height: '100%', position: 'relative' }}
          >
            {/* Glow behind character */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: -10, borderRadius: '50%',
                background: activeChar === 'taylor'
                  ? 'radial-gradient(circle, rgba(108,99,255,0.25), transparent 70%)'
                  : 'radial-gradient(circle, rgba(244,114,182,0.25), transparent 70%)',
              }}
            />
            {/* Floating character image */}
            <motion.img
              src={current.src}
              alt={activeChar === 'taylor' ? 'テイラーくん' : 'モナちゃん'}
              animate={current.motion}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: '100%', height: '100%', objectFit: 'contain',
                position: 'relative', zIndex: 1,
                filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.15))',
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Sparkle effects */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.7, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: [10, 30, 60][i] + '%',
              left: [80, 5, 85][i] + '%',
              width: 12, height: 12, zIndex: 2,
            }}
          >
            <Sparkles size={12} style={{ color: activeChar === 'taylor' ? '#6C63FF' : '#f472b6' }} />
          </motion.div>
        ))}
      </div>

      {/* Speech bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bubble-${activeChar}-${moodIdx}`}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          style={{
            borderRadius: 16, background: '#fff', padding: '10px 24px',
            fontSize: 15, fontWeight: 700, color: '#1a1a2e',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            border: `2px solid ${activeChar === 'taylor' ? '#EDE9FF' : '#fce7f3'}`,
          }}
        >
          {current.label}
        </motion.div>
      </AnimatePresence>

      {/* Character toggle */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {[
          { id: 'taylor', label: 'テイラーくん', color: '#6C63FF' },
          { id: 'mona', label: 'モナちゃん', color: '#f472b6' },
        ].map(c => (
          <button
            key={c.id}
            onClick={() => setActiveChar(c.id)}
            style={{
              borderRadius: 999, padding: '8px 20px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: activeChar === c.id ? `2px solid ${c.color}` : '2px solid #e5e7eb',
              background: activeChar === c.id ? `${c.color}10` : '#fff',
              color: activeChar === c.id ? c.color : '#9ca3af',
              transition: 'all 0.2s',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ═══════ MAIN LP ═══════ */
export default function LandingPage({ onNavigate }) {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden', background: '#FFFDF7' }}>

      {/* ─── HERO ─── */}
      <section ref={heroRef} style={{ position: 'relative', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #6C63FF 0%, #7B73FF 40%, #38BDF8 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'40\' height=\'40\' fill=\'none\' stroke=\'white\' stroke-width=\'.5\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat' }} />
        <FloatingParticles />

        <motion.div style={{ y: heroY, opacity: heroOpacity, position: 'relative', zIndex: 10, width: '100%', maxWidth: 800, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', padding: '10px 24px', fontSize: 14, fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,0.2)', marginBottom: 28 }}>
            <Sparkles size={16} /> 中学生向け AI 学習 RPG <Sparkles size={16} />
          </motion.div>

          {/* Main Title */}
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 900, lineHeight: 1.2, color: '#fff', textShadow: '0 4px 30px rgba(0,0,0,0.15)', marginBottom: 20, whiteSpace: 'nowrap' }}>
            勉強を
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{ position: 'relative', zIndex: 1 }}>冒険</span>
              <motion.span
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 0.6 }}
                style={{ position: 'absolute', bottom: 2, left: 0, height: 14, width: '100%', borderRadius: 999, background: 'rgba(253,224,71,0.45)', transformOrigin: 'left' }}
              />
            </span>
            に変えよう。
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            style={{ maxWidth: 520, margin: '0 auto 36px', fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', color: 'rgba(255,255,255,0.8)', lineHeight: 1.8 }}>
            1日10分、クエストをクリアするだけ。<br />AIがキミの苦手を分析して、ちょうどいい問題を出題するよ。
          </motion.p>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <button onClick={() => onNavigate('login')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, borderRadius: 18, background: '#fff', padding: '16px 36px', fontSize: 18, fontWeight: 700, color: '#6C63FF', border: 'none', cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', transition: 'transform 0.2s' }}>
              <Play size={20} fill="currentColor" />
              無料で冒険をはじめる
              <ChevronRight size={20} />
            </button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 18, background: 'transparent', padding: '14px 28px', fontSize: 14, fontWeight: 700, color: '#fff', border: '2px solid rgba(255,255,255,0.3)', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
              <Map size={18} />
              どんなアプリ？
            </button>
          </motion.div>

          {/* Hero Mascot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, type: 'spring', stiffness: 200, damping: 15 }}
            style={{ marginTop: 32, marginBottom: -8 }}
          >
            <motion.img
              src="/mascots/taylor/mascot-happy.png"
              alt="テイラーくん"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 120, height: 120, objectFit: 'contain', margin: '0 auto',
                filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.2))',
              }}
            />
          </motion.div>

          {/* Social Proof */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 44, fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
            <span className="flex items-center gap-1.5"><Star size={14} style={{ color: '#fde047' }} fill="currentColor" /> 4.8 評価</span>
            <span className="flex items-center gap-1.5"><Users size={14} /> 500+ 冒険者</span>
            <span className="flex items-center gap-1.5"><Shield size={14} /> 安心の無料プラン</span>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)' }}
          animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <div style={{ height: 40, width: 24, borderRadius: 999, border: '2px solid rgba(255,255,255,0.3)', padding: 4 }}>
            <div style={{ margin: '0 auto', height: 8, width: 6, borderRadius: 999, background: 'rgba(255,255,255,0.6)' }} />
          </div>
        </motion.div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section style={{ position: 'relative', zIndex: 20, marginTop: -28 }}>
        <Container size="md">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, borderRadius: 20, background: '#fff', padding: '24px 16px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #f1f1f1' }}>
            {[
              { icon: Zap, label: '問題数', value: 5000, suffix: '+', color: '#6C63FF' },
              { icon: Flame, label: '平均正答率', value: 78, suffix: '%', color: '#FF6B6B' },
              { icon: Trophy, label: 'クエスト', value: 120, suffix: '+', color: '#FFD700' },
            ].map(({ icon: Icon, label, value, suffix, color }, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Icon size={22} style={{ color, marginBottom: 4 }} />
                <span className="font-black" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color }}>
                  <AnimatedCounter end={value} suffix={suffix} />
                </span>
                <span style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{label}</span>
              </div>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* ─── FEATURES ─── */}
      <section style={{ padding: '80px 0' }}>
        <Container size="lg">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, background: '#EDE9FF', padding: '7px 16px', fontSize: 12, fontWeight: 700, color: '#6C63FF', marginBottom: 14 }}>
              <Gem size={14} /> FEATURES
            </span>
            <h2 className="font-black" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
              StudyMateの
              <span style={{ background: 'linear-gradient(135deg, #6C63FF, #38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>スゴいところ</span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <FeatureCard icon={Brain} color="#6C63FF" title="AIが苦手を見抜く" desc="キミの回答パターンをAIが分析。苦手な単元を集中的に出題して、効率よくレベルアップ！" delay={0} badge="AI搭載" />
            <FeatureCard icon={Swords} color="#FF6B6B" title="クエスト形式で攻略" desc="問題を解くたびにXPを獲得！レベルアップして新しいステージをアンロックしよう。" delay={0.1} />
            <FeatureCard icon={Clock} color="#FF922B" title="1日10分でOK" desc="1セッション10問だけ。短いから毎日続けられる。継続は力なり！" delay={0.2} />
            <FeatureCard icon={Target} color="#51CF66" title="実績バッジ" desc="学習を続けるとバッジを獲得！コンプリートを目指してモチベーションアップ！" delay={0.3} />
            <FeatureCard icon={Map} color="#4DABF7" title="ステージマップ" desc="RPGのワールドマップみたいに進捗が見える。全ステージクリアを目指そう！" delay={0.4} />
            <FeatureCard icon={Users} color="#C084FC" title="保護者レポート" desc="お子さまの学習進捗を保護者にシェア。安心して見守れます。" delay={0.5} badge="Premium" />
          </div>
        </Container>
      </section>

      {/* ─── MASCOT SECTION ─── */}
      <section style={{ background: 'linear-gradient(135deg, #EDE9FF, #E7F5FF)', padding: '80px 0', overflow: 'hidden' }}>
        <Container size="lg">
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 64, flexWrap: 'wrap', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              style={{ flexShrink: 0 }}>
              <MascotShowcase />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              style={{ flex: '1 1 300px', maxWidth: 500 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, background: '#fff', padding: '7px 16px', fontSize: 12, fontWeight: 700, color: '#6C63FF', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                <Heart size={14} /> BUDDY SYSTEM
              </span>
              <h2 className="font-black" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', marginBottom: 16, lineHeight: 1.3 }}>
                キミだけの<br />勉強バディ
              </h2>
              <p style={{ color: '#6b7280', lineHeight: 1.8, marginBottom: 16, fontSize: 15 }}>
                テイラーくん（フクロウ）やモナちゃん（ネコ）が一緒に冒険してくれるよ。正解するとバディも喜ぶ！間違えても「次がんばろ！」って応援してくれる。
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['😊 応援', '🎉 正解で大喜び', '💡 ヒント', '😢 一緒に悔しがる'].map((tag) => (
                  <span key={tag} style={{ borderRadius: 999, background: '#fff', padding: '6px 14px', fontSize: 13, fontWeight: 500, color: '#4b5563', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" style={{ padding: '80px 0' }}>
        <Container size="sm">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, background: '#ecfdf5', padding: '7px 16px', fontSize: 12, fontWeight: 700, color: '#059669', marginBottom: 14 }}>
              <Sparkles size={14} /> QUEST GUIDE
            </span>
            <h2 className="font-black" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
              <span style={{ background: 'linear-gradient(135deg, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>冒険の始め方</span>
            </h2>
          </motion.div>

          <div>
            <QuestStep number={1} icon={BookOpen} color="#6C63FF" title="アカウント作成" desc="メールアドレスで30秒で登録完了。すぐに冒険を始められるよ！" delay={0} />
            <QuestStep number={2} icon={Star} color="#FF922B" title="学年とバディを選ぶ" desc="中1〜中3から自分の学年を選んで、一緒に冒険するバディを選ぼう。" delay={0.1} />
            <QuestStep number={3} icon={Swords} color="#FF6B6B" title="クエストに挑戦！" desc="英語・数学から好きなステージを選んで10問のクイズに挑戦。正解してXPをゲット！" delay={0.2} />
            <QuestStep number={4} icon={Trophy} color="#FFD700" title="レベルアップ！" desc="問題を解くたびにレベルアップ。全ステージクリアを目指して冒険を続けよう！" delay={0.3} isLast />
          </div>
        </Container>
      </section>

      {/* ─── PRICING ─── */}
      <section style={{ background: 'linear-gradient(180deg, #f9fafb, #fff)', padding: '80px 0' }}>
        <Container size="lg">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, background: '#fefce8', padding: '7px 16px', fontSize: 12, fontWeight: 700, color: '#ca8a04', marginBottom: 14 }}>
              <Crown size={14} /> PLANS
            </span>
            <h2 className="font-black" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
              冒険の
              <span style={{ background: 'linear-gradient(135deg, #eab308, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>プラン</span>
              を選ぼう
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, maxWidth: 900, margin: '0 auto' }}>
            <PricingCard plan="Free" price="¥0" period="" icon={Shield} color="#6B7280"
              features={[{ text: '1日10問まで' }, { text: '基本フィードバック' }, { text: '広告あり' }, { text: '週間レポート', locked: true }, { text: 'AI弱点分析', locked: true }, { text: '保護者レポート', locked: true }]}
              cta="無料ではじめる" onAction={() => onNavigate('login')} />
            <PricingCard plan="Standard" price="¥699" period="/月" icon={Gem} color="#6C63FF" popular
              features={[{ text: '1日50問まで' }, { text: '週間レポート' }, { text: '実績バッジ' }, { text: '広告なし' }, { text: 'AI弱点分析', locked: true }, { text: '保護者レポート共有', locked: true }]}
              cta="冒険をアップグレード" onAction={() => onNavigate('login')} />
            <PricingCard plan="Premium" price="¥999" period="/月" icon={Crown} color="#FFD700"
              features={[{ text: '問題数 無制限 🔥' }, { text: '週間レポート' }, { text: 'AI弱点分析' }, { text: '保護者レポート共有' }, { text: '実績バッジ' }, { text: '広告なし' }, { text: '優先サポート' }]}
              cta="最強プランではじめる" onAction={() => onNavigate('login')} />
          </div>
        </Container>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '80px 0' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #6C63FF 0%, #7B73FF 40%, #38BDF8 100%)' }} />
        <FloatingParticles />
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ position: 'relative', zIndex: 10, maxWidth: 600, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', fontSize: 64, marginBottom: 16 }}>🏰</span>
          <h2 className="font-black" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: '#fff', marginBottom: 16 }}>
            さぁ、冒険を始めよう！
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 32, lineHeight: 1.8 }}>
            無料プランでいつでもスタートできるよ。<br />キミの学力レベルアップの旅が今始まる！
          </p>
          <button onClick={() => onNavigate('login')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, borderRadius: 18, background: '#fff', padding: '16px 44px', fontSize: 18, fontWeight: 700, color: '#6C63FF', border: 'none', cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', transition: 'transform 0.2s' }}>
            <Zap size={22} style={{ color: '#eab308' }} fill="currentColor" />
            無料で冒険をはじめる
            <ArrowRight size={20} />
          </button>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: '1px solid #f1f1f1', background: '#fff', padding: '32px 0' }}>
        <Container size="lg">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div className="font-black" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18 }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: '#6C63FF', color: '#fff', fontSize: 14, fontWeight: 700 }}>S</span>
              StudyMate
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#9ca3af' }}>
              <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>利用規約</a>
              <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>プライバシーポリシー</a>
              <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>お問い合わせ</a>
            </div>
            <p style={{ fontSize: 12, color: '#d1d5db' }}>&copy; 2025 StudyMate</p>
          </div>
        </Container>
      </footer>
    </div>
  )
}
