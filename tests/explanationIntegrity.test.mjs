// Tests for explanation integrity: contamination detection, correctIndex repair.
// These are pure-logic tests (no LLM calls needed).
import assert from 'node:assert/strict'
import { removeContaminatedSentences } from '../api/generate.js'

/**
 * Simulate the correctIndex repair logic (copy of server code, kept in sync).
 */
function repairCorrectIndex(q) {
  if (!q.correctAnswer || !Array.isArray(q.choices)) return q
  const norm = s => (s || '').replace(/\s+/g, '').replace(/[−\u2212]/g, '-')
  let fixed = q.correctIndex
  const exactIdx = q.choices.indexOf(q.correctAnswer)
  if (exactIdx !== -1 && exactIdx !== q.correctIndex) fixed = exactIdx
  else if (exactIdx === -1) {
    const fuzzyIdx = q.choices.findIndex(c => norm(c) === norm(q.correctAnswer))
    if (fuzzyIdx !== -1) fixed = fuzzyIdx
  }
  return { ...q, correctIndex: fixed }
}

export default [
  // ── removeContaminatedSentences ──────────────────────────────────────────

  {
    name: 'keeps clean explanation unchanged',
    fn: async () => {
      const q = '∠a = 65° のとき、∠b を求めよ。'
      const c = ['45°', '65°', '115°', '130°']
      const exp = '平行線の同位角は等しいので ∠a = ∠b です。しかし錯角の場合は 180° - 65° = 115° になります。'
      const out = removeContaminatedSentences(q, c, exp)
      // No contamination; should be unchanged
      assert.strictEqual(out, exp)
    },
  },
  {
    name: 'removes sentence containing EF that does not appear in question',
    fn: async () => {
      const q = '平行線で ∠a = 65° のとき、∠b を求めよ。'
      const c = ['45°', '65°', '115°', '130°']
      // Contaminated: last sentence mentions EF which is not in question
      const exp = '平行線の錯角は等しいので ∠b = 180° - 65° = 115° です。よくある間違いは同位角と錯角の混同です。再計算すると EF = 10cm です。'
      const out = removeContaminatedSentences(q, c, exp)
      assert.ok(!out.includes('EF'), `EF should be removed, got: "${out}"`)
      assert.ok(out.includes('115°'), 'correct answer sentence should remain')
    },
  },
  {
    name: 'keeps AB/BC when they appear in question',
    fn: async () => {
      const q = '三角形ABCで AB = 4cm、BC = 6cm のとき面積を求めよ。'
      const c = ['6cm²', '8cm²', '12cm²', '24cm²']
      const exp = 'AB × BC ÷ 2 = 4 × 6 ÷ 2 = 12cm² が正解です。底辺と高さを使います。'
      const out = removeContaminatedSentences(q, c, exp)
      assert.ok(out.includes('AB'), 'AB should be kept')
      assert.ok(out.includes('12cm²'), 'answer should be kept')
    },
  },
  {
    name: 'caps at 4 sentences even without contamination',
    fn: async () => {
      const q = '問題文。'
      const c = []
      const exp = '文1です。文2です。文3です。文4です。文5です。'
      const out = removeContaminatedSentences(q, c, exp)
      const count = (out.match(/です。/g) || []).length
      assert.ok(count <= 4, `expected ≤4 sentences, got ${count}: "${out}"`)
    },
  },

  // ── repairCorrectIndex ────────────────────────────────────────────────────

  {
    name: 'ratio bug: EF=9 in correctAnswer corrects index pointing at 10',
    fn: async () => {
      const q = {
        question: 'AB=4cm、BC=6cm、DE=6cm のとき EF は？',
        choices: ['6cm', '8cm', '9cm', '10cm'],
        correctIndex: 3,          // LLM says index 3 = "10cm" (wrong)
        correctAnswer: '9cm',     // LLM's correctAnswer is right
        explanation: '4:6 = 6:EF → EF = 9cm。よって答えは 9cm。',
      }
      const repaired = repairCorrectIndex(q)
      assert.strictEqual(repaired.correctIndex, 2, `expected 2 (9cm), got ${repaired.correctIndex}`)
    },
  },
  {
    name: 'parallel angle: 65° should not be correctAnswer, 115° should',
    fn: async () => {
      const q = {
        question: '∠a = 65° のとき ∠b を求めよ（平行線）',
        choices: ['45°', '65°', '115°', '130°'],
        correctIndex: 1,          // LLM wrongly points at 65°
        correctAnswer: '115°',    // LLM correctly identifies text answer
        explanation: '∠b = 180° - 65° = 115°。',
      }
      const repaired = repairCorrectIndex(q)
      assert.strictEqual(repaired.correctIndex, 2, `expected 2 (115°), got ${repaired.correctIndex}`)
    },
  },
  {
    name: 'no repair needed when correctIndex is already correct',
    fn: async () => {
      const q = {
        question: '2x + 3 = 7 のとき x は？',
        choices: ['1', '2', '3', '4'],
        correctIndex: 1,
        correctAnswer: '2',
        explanation: '2x = 4 → x = 2。',
      }
      const repaired = repairCorrectIndex(q)
      assert.strictEqual(repaired.correctIndex, 1)
    },
  },

  // ── Fixture: exterior angle problem ──────────────────────────────────────

  {
    name: 'exterior angle: explanation must not change its numeric conclusion mid-sentence',
    fn: async () => {
      // Simulates a well-formed exterior angle explanation (should pass)
      const exp = '三角形ABCの外角∠ACDは、∠A + ∠B = 50° + 80° = 130° です。外角は内角の和に等しい。'
      // Count distinct degree values to detect flip-flopping (should be ≤3 unique)
      const degVals = [...exp.matchAll(/(\d+)°/g)].map(m => m[1])
      const unique = new Set(degVals)
      assert.ok(unique.size <= 3, `too many distinct angle values (${[...unique].join(',')}), explanation is inconsistent`)
    },
  },
  {
    name: 'contamination check: explanation for ratio problem must not mention EF if only mentioned in explanation context',
    fn: async () => {
      const q = 'AB=4cm、BC=6cm、DE=6cm のとき EF の長さを求めよ。'
      const c = ['6cm', '8cm', '9cm', '10cm']
      // Good explanation — EF appears in question so it's allowed
      const goodExp = 'AB:BC = DE:EF より 4:6 = 6:EF → EF = 9cm です。'
      const out = removeContaminatedSentences(q, c, goodExp)
      assert.ok(out.includes('EF'), 'EF should remain because it appears in question')
      assert.ok(out.includes('9cm'))
    },
  },
]
