import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

const characters = [
  {
    id: 'taylor',
    name: 'テイラーくん',
    desc: '知識豊富なフクロウの男の子。\nぼくと一緒にがんばろう！',
    img: '/mascots/taylor/mascot-normal.png',
    color: '#6C63FF',
    bgLight: '#EDE9FF',
  },
  {
    id: 'mona',
    name: 'モナちゃん',
    desc: '好奇心いっぱいのネコの女の子。\nわたしと楽しく勉強しよ！',
    img: '/mascots/mona/mascot-happy.png',
    color: '#f472b6',
    bgLight: '#fce7f3',
  },
]

export default function CharacterSelectPage({ onSelect }) {
  const [selected, setSelected] = useState(null)

  const handleSelect = (id) => {
    setSelected(id)
    setTimeout(() => onSelect(id), 600)
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#FFFDF7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: 40 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, background: '#EDE9FF', padding: '7px 16px', fontSize: 12, fontWeight: 700, color: '#6C63FF', marginBottom: 12 }}>
          <Sparkles size={14} /> BUDDY SELECT
        </span>
        <h1 className="font-black" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', color: '#1a1a2e', marginBottom: 8 }}>
          冒険のバディを選ぼう！
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14 }}>一緒に勉強してくれるパートナーだよ</p>
      </motion.div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 700, width: '100%' }}>
        {characters.map((c, i) => {
          const isSelected = selected === c.id
          return (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.15, type: 'spring', stiffness: 200 }}
              whileHover={!selected ? { y: -8, scale: 1.02 } : {}}
              whileTap={!selected ? { scale: 0.97 } : {}}
              onClick={() => !selected && handleSelect(c.id)}
              style={{
                flex: '1 1 280px', maxWidth: 320, borderRadius: 24, padding: 32,
                background: isSelected ? c.bgLight : '#fff',
                border: `3px solid ${isSelected ? c.color : '#f1f1f1'}`,
                boxShadow: isSelected ? `0 8px 32px ${c.color}30` : '0 4px 20px rgba(0,0,0,0.06)',
                cursor: selected ? 'default' : 'pointer',
                textAlign: 'center', transition: 'all 0.3s',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}
            >
              <motion.div
                animate={isSelected ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : { y: [0, -6, 0] }}
                transition={{ duration: isSelected ? 0.6 : 3, repeat: isSelected ? 0 : Infinity, ease: 'easeInOut' }}
                style={{ position: 'relative', width: 160, height: 160, marginBottom: 16 }}
              >
                <img src={c.img} alt={c.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.1))' }} />
                {isSelected && [0, 1, 2, 3].map(j => (
                  <motion.div key={j}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0] }}
                    transition={{ delay: j * 0.15, duration: 0.8 }}
                    style={{ position: 'absolute', top: ['-5%', '10%', '70%', '80%'][j], left: ['80%', '-5%', '90%', '0%'][j] }}>
                    <Sparkles size={16} style={{ color: c.color }} />
                  </motion.div>
                ))}
              </motion.div>
              <h2 className="font-black" style={{ fontSize: 22, color: c.color, marginBottom: 8 }}>{c.name}</h2>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{c.desc}</p>
              {isSelected && (
                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ marginTop: 16, borderRadius: 999, background: c.color, color: '#fff', padding: '8px 24px', fontSize: 14, fontWeight: 700 }}>
                  選択中！
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
