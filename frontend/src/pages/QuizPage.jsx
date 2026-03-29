import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, CheckCircle2, XCircle, ChevronRight, Lightbulb, Sparkles } from 'lucide-react'
import Confetti from '../components/Confetti'
import MathGraph from '../components/MathGraph'

const MASCOT_STATES = {
  taylor: {
    normal: '/mascots/taylor/mascot-normal.png',
    happy: '/mascots/taylor/mascot-cheering.png',
    sad: '/mascots/taylor/mascot-thinking.png',
  },
  mona: {
    normal: '/mascots/mona/mascot-happy.png',
    happy: '/mascots/mona/mascot-happy.png',
    sad: '/mascots/mona/mascot-happy.png',
  },
}

const CHOICE_COLORS = ['#6C63FF', '#FF6B6B', '#51CF66', '#FF922B']
const CHOICE_LABELS = ['A', 'B', 'C', 'D']

export default function QuizPage({ questions, subUnit, mascotId, loading, onComplete, onQuit }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [results, setResults] = useState([])
  const [xpGained, setXpGained] = useState(0)
  const [combo, setCombo] = useState(0)
  const [mascotState, setMascotState] = useState('normal')
  const [shakeWrong, setShakeWrong] = useState(false)
  const [showXpPopup, setShowXpPopup] = useState(false)
  const [lastXp, setLastXp] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [confettiKey, setConfettiKey] = useState(0)

  const q = questions[currentIdx]
  const progress = ((currentIdx + (isAnswered ? 1 : 0)) / questions.length) * 100
  const mascot = MASCOT_STATES[mascotId] || MASCOT_STATES.taylor

  const handleSelect = useCallback((choiceIdx) => {
    if (isAnswered) return
    setSelectedChoice(choiceIdx)
    setIsAnswered(true)

    const correct = choiceIdx === q.answer
    setIsCorrect(correct)
    setResults(prev => [...prev, { questionId: q.id, correct, selectedChoice: choiceIdx }])

    if (correct) {
      const comboBonus = Math.min(combo, 5) * 2
      const earned = 10 + comboBonus
      setLastXp(earned)
      setXpGained(prev => prev + earned)
      setCombo(prev => prev + 1)
      setMascotState('happy')
      setShowXpPopup(true)
      setShowConfetti(true)
      setConfettiKey(prev => prev + 1)
      setTimeout(() => setShowXpPopup(false), 1200)
      setTimeout(() => setShowConfetti(false), 3000)
    } else {
      setCombo(0)
      setMascotState('sad')
      setShakeWrong(true)
      setTimeout(() => setShakeWrong(false), 500)
    }
  }, [isAnswered, q, combo])

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      onComplete({
        results,
        xpGained,
        totalQuestions: questions.length,
        correctCount: results.filter(r => r.correct).length,
      })
    } else {
      setCurrentIdx(prev => prev + 1)
      setSelectedChoice(null)
      setIsAnswered(false)
      setIsCorrect(false)
      setShowExplanation(false)
      setMascotState('normal')
    }
  }

  useEffect(() => {
    const handler = (e) => {
      if (!isAnswered && ['1', '2', '3', '4'].includes(e.key)) handleSelect(parseInt(e.key) - 1)
      if (isAnswered && (e.key === 'Enter' || e.key === ' ')) handleNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isAnswered, handleSelect])

  const getChoiceStyle = (idx) => {
    const baseColor = CHOICE_COLORS[idx]
    if (!isAnswered) {
      return {
        bg: '#fff',
        border: `2px solid ${baseColor}40`,
        text: '#1a1a2e',
        badge: baseColor,
      }
    }
    if (idx === q.answer) return { bg: '#EBFBEE', border: '2px solid #51CF66', text: '#2b8a3e', badge: '#51CF66' }
    if (idx === selectedChoice && !isCorrect) return { bg: '#FFF0F0', border: '2px solid #FF6B6B', text: '#c92a2a', badge: '#FF6B6B' }
    return { bg: '#f9fafb', border: '2px solid #e5e7eb', text: '#b0b0b0', badge: '#d1d5db' }
  }

  // Loading state while AI generates questions
  if (loading || !questions || questions.length === 0) {
    const mascotSrc = MASCOT_STATES[mascotId]?.normal || MASCOT_STATES.taylor.normal
    return (
      <div style={{
        minHeight: '100dvh', background: 'linear-gradient(180deg, #FFFDF7 0%, #F0EDFF 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24,
      }}>
        <motion.img src={mascotSrc} alt="mascot"
          animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ width: 100, height: 100, objectFit: 'contain' }} />
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ textAlign: 'center' }}>
          <div className="font-black" style={{ fontSize: 20, color: '#1a1a2e', marginBottom: 8 }}>
            問題を準備中...
          </div>
          <div style={{ fontSize: 14, color: '#9ca3af' }}>
            AIがキミにピッタリの問題を作ってるよ！
          </div>
        </motion.div>
        <motion.div
          animate={{ width: ['0%', '70%', '90%', '95%'] }}
          transition={{ duration: 4, ease: 'easeOut' }}
          style={{ height: 6, borderRadius: 999, background: 'linear-gradient(90deg, #6C63FF, #38BDF8)', maxWidth: 200 }}
        />
        <button onClick={onQuit}
          style={{ marginTop: 12, background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}>
          ← 戻る
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(180deg, #FFFDF7 0%, #F0EDFF 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Confetti on correct */}
      {showConfetti && <Confetti key={confettiKey} count={35} />}

      {/* Header */}
      <div style={{ padding: '14px 16px 10px', background: 'transparent' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={onQuit}
            style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} style={{ color: '#6b7280' }} />
          </button>

          {/* Progress bar */}
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ height: 14, borderRadius: 999, background: '#E5E7EB', overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                  height: '100%', borderRadius: 999,
                  background: 'linear-gradient(90deg, #6C63FF, #38BDF8, #51CF66)',
                  position: 'relative',
                }}
              >
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0, width: 20,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4))',
                    borderRadius: 999,
                  }}
                />
              </motion.div>
            </div>
            <div style={{ position: 'absolute', right: 0, top: -2, fontSize: 11, fontWeight: 700, color: '#6b7280' }}>
              {currentIdx + 1}/{questions.length}
            </div>
          </div>

          {/* XP display */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'linear-gradient(135deg, #FFF8E1, #FFECB3)', borderRadius: 999,
            padding: '6px 14px', position: 'relative',
          }}>
            <Zap size={16} style={{ color: '#FFB300' }} fill="#FFB300" />
            <span className="font-black" style={{ fontSize: 15, color: '#FF8F00' }}>{xpGained}</span>

            {/* XP popup */}
            <AnimatePresence>
              {showXpPopup && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.5 }}
                  animate={{ opacity: 1, y: -30, scale: 1 }}
                  exit={{ opacity: 0, y: -50 }}
                  style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 16, fontWeight: 900, color: '#FF8F00', whiteSpace: 'nowrap',
                  }}
                >
                  +{lastXp} XP!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Combo indicator */}
      <AnimatePresence>
        {combo >= 2 && !isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '0 20px 4px' }}
          >
            <motion.span
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'linear-gradient(135deg, #FF6B6B, #FF922B)', borderRadius: 999,
                padding: '5px 16px', fontSize: 13, fontWeight: 800, color: '#fff',
                boxShadow: '0 3px 12px rgba(255,107,107,0.3)',
              }}
            >
              <Sparkles size={14} /> {combo}連続正解！ボーナス +{Math.min(combo, 5) * 2} XP
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div style={{ flex: 1, maxWidth: 600, margin: '0 auto', width: '100%', padding: '12px 20px 32px', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          <motion.div key={currentIdx}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            {/* Question Card */}
            <motion.div
              animate={shakeWrong ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              style={{
                background: '#fff', borderRadius: 24, padding: '32px 24px',
                boxShadow: '0 8px 32px rgba(108,99,255,0.08)',
                border: '1px solid rgba(108,99,255,0.1)',
                marginBottom: 20, minHeight: 120,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Decorative gradient corner */}
              <div style={{
                position: 'absolute', top: -30, right: -30, width: 100, height: 100,
                borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF10, #38BDF810)',
              }} />
              <h2 className="font-bold" style={{
                fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', color: '#1a1a2e',
                textAlign: 'center', lineHeight: 1.8, position: 'relative',
              }}>
                {q.question}
              </h2>
              {q.graphData && (
                <div style={{ marginTop: 12, borderRadius: 12, background: '#f9fafb', padding: '8px 4px', border: '1px solid #f1f1f1' }}>
                  <MathGraph graphData={q.graphData} />
                </div>
              )}
            </motion.div>

            {/* Choices - 2x2 grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {q.choices.map((choice, idx) => {
                const style = getChoiceStyle(idx)
                const isSelected = selectedChoice === idx
                return (
                  <motion.button key={idx}
                    whileHover={!isAnswered ? { scale: 1.03, y: -2 } : {}}
                    whileTap={!isAnswered ? { scale: 0.95 } : {}}
                    animate={isAnswered && idx === q.answer ? { scale: [1, 1.05, 1] } : {}}
                    onClick={() => handleSelect(idx)}
                    style={{
                      padding: '18px 14px', borderRadius: 18, cursor: isAnswered ? 'default' : 'pointer',
                      background: style.bg, border: style.border,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      textAlign: 'center', transition: 'all 0.2s', position: 'relative',
                      boxShadow: isSelected && isAnswered
                        ? (isCorrect ? '0 4px 20px rgba(81,207,102,0.3)' : '0 4px 20px rgba(255,107,107,0.3)')
                        : !isAnswered ? '0 3px 12px rgba(0,0,0,0.04)' : 'none',
                      minHeight: 80,
                    }}
                  >
                    {/* Badge */}
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: isAnswered && idx === q.answer ? '#51CF66'
                        : isAnswered && idx === selectedChoice && !isCorrect ? '#FF6B6B'
                        : `${style.badge}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isAnswered && idx === q.answer ? (
                        <CheckCircle2 size={16} style={{ color: '#fff' }} />
                      ) : isAnswered && idx === selectedChoice && !isCorrect ? (
                        <XCircle size={16} style={{ color: '#fff' }} />
                      ) : (
                        <span className="font-bold" style={{ fontSize: 13, color: style.badge }}>{CHOICE_LABELS[idx]}</span>
                      )}
                    </div>
                    <span className="font-bold" style={{ fontSize: 15, color: style.text, lineHeight: 1.4 }}>
                      {choice}
                    </span>
                  </motion.button>
                )
              })}
            </div>

            {/* Feedback Area */}
            <AnimatePresence>
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Mascot feedback */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                    borderRadius: 18, marginBottom: 12,
                    background: isCorrect
                      ? 'linear-gradient(135deg, #EBFBEE, #E7F5FF)'
                      : 'linear-gradient(135deg, #FFF0F0, #FFF4E6)',
                    border: `1px solid ${isCorrect ? '#51CF6630' : '#FF6B6B30'}`,
                  }}>
                    <motion.img
                      src={mascot[mascotState]} alt="mascot"
                      animate={isCorrect ? { rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] } : { y: [0, -3, 0] }}
                      transition={{ duration: 0.6 }}
                      style={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0 }}
                    />
                    <div>
                      <div className="font-bold" style={{ fontSize: 16, color: isCorrect ? '#2b8a3e' : '#c92a2a', marginBottom: 2 }}>
                        {isCorrect
                          ? ['すごい！正解！🎉', 'やったね！✨', 'さすが！💪', 'カンペキ！🌟'][currentIdx % 4]
                          : ['おしい！😢', 'ドンマイ！次がんばろう！💪', '大丈夫！覚えていこう！'][currentIdx % 3]
                        }
                      </div>
                      {combo >= 3 && isCorrect && (
                        <span style={{ fontSize: 12, color: '#FF922B', fontWeight: 700 }}>
                          🔥 {combo}問連続！絶好調！
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Explanation */}
                  <button onClick={() => setShowExplanation(!showExplanation)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, background: '#fff',
                      border: '1px solid #e5e7eb', borderRadius: 14, padding: '11px 16px',
                      cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#6C63FF',
                      marginBottom: 12, width: '100%', transition: 'all 0.2s',
                    }}>
                    <Lightbulb size={15} />
                    {showExplanation ? '解説を閉じる' : '解説を見る'}
                  </button>

                  <AnimatePresence>
                    {showExplanation && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{
                          background: '#fff', borderRadius: 16, padding: '18px 20px',
                          border: '1px solid #E9ECEF', fontSize: 14, color: '#495057',
                          lineHeight: 1.9, marginBottom: 12,
                        }}>
                          💡 {q.explanation}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Next Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleNext}
                    style={{
                      width: '100%', padding: '18px 0', borderRadius: 18, border: 'none', cursor: 'pointer',
                      background: isCorrect
                        ? 'linear-gradient(135deg, #51CF66, #38BDF8)'
                        : 'linear-gradient(135deg, #6C63FF, #38BDF8)',
                      color: '#fff', fontSize: 17, fontWeight: 800,
                      boxShadow: isCorrect ? '0 6px 20px rgba(81,207,102,0.3)' : '0 6px 20px rgba(108,99,255,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {currentIdx + 1 >= questions.length ? '結果を見る 🎯' : '次の問題へ'}
                    <ChevronRight size={20} />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
