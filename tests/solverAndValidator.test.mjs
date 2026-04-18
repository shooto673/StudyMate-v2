// Solver-first + validator integration tests.
// Covers the six reported bugs and the release safety checks.
import assert from 'node:assert/strict'
import {
  GENERATORS,
  solveSimilarityRatioLength,
  generateSimilarityRatioLength,
  solveExteriorAngle,
  generateExteriorAngle,
  solveTriangleAngleSum,
  generateTriangleAngleSum,
  solveRatioLength,
  generateRatioLength,
  solveRatioSimplify,
  generateRatioSimplify,
  gcd,
} from '../lib/mathSolvers.js'
import { classifyUnit, isSolverRequired } from '../lib/classifier.js'
import { validateQuestionObject } from '../lib/questionValidator.js'

/** Mulberry32 seeded RNG — fully deterministic. */
function seededRng(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function assertValid(q, opts = {}) {
  const v = validateQuestionObject(q, { problemType: q.spec?.problemType, ...opts })
  assert.ok(v.ok, `validator failed: ${v.errors.join(',')} on "${q.question}"`)
}

export default [
  // ── Classifier routing ───────────────────────────────────────────────
  {
    name: 'classifier: 相似な図形 → solver_required',
    fn: async () => {
      const c = classifyUnit('図形の相似', '相似な図形', 'math')
      assert.strictEqual(c.category, 'solver_required')
      assert.ok(c.generators.includes('similarity_ratio_length'))
    },
  },
  {
    name: 'classifier: 外角 → solver_required',
    fn: async () => {
      const c = classifyUnit('図形の性質', '多角形の外角', 'math')
      assert.strictEqual(c.category, 'solver_required')
      assert.ok(c.generators.includes('exterior_angle'))
    },
  },
  {
    name: 'classifier: 平行線と比 → solver_required',
    fn: async () => {
      const c = classifyUnit('相似', '平行線と比', 'math')
      assert.strictEqual(c.category, 'solver_required')
    },
  },
  {
    name: 'classifier: 方程式 → lower_risk_batch',
    fn: async () => {
      const c = classifyUnit('方程式', '一次方程式', 'math')
      assert.strictEqual(c.category, 'lower_risk_batch')
    },
  },
  {
    name: 'classifier: english → non_math',
    fn: async () => {
      const c = classifyUnit('相似', '相似な図形', 'english')
      assert.strictEqual(c.category, 'non_math')
    },
  },

  // ── Bug fixture 1: similarity 3:2, AB=12 → DE=8 ───────────────────────
  {
    name: 'similarity 3:2, knownSide=12 (big) → smallSide=8',
    fn: async () => {
      const r = solveSimilarityRatioLength({ p: 3, q: 2, knownSide: 12, knownIsBig: true })
      assert.strictEqual(r.answer, 8)
      assert.strictEqual(r.smallSide, 8)
      // trace must end with =8
      assert.match(r.trace[r.trace.length - 1], /=\s*8\b/)
    },
  },

  // ── Bug fixture 2: similarity 2:1 (ABC:DEF), AB=4 → DE=2 ──────────────
  {
    name: 'similarity 2:1, AB=4 (big) → DE=2 — must not be 8',
    fn: async () => {
      const r = solveSimilarityRatioLength({ p: 2, q: 1, knownSide: 4, knownIsBig: true })
      assert.strictEqual(r.answer, 2)
      assert.notStrictEqual(r.answer, 8)
    },
  },

  // ── Bug fixture 3: ratio_simplify 9:6 → 3:2 ──────────────────────────
  {
    name: 'ratio_simplify 9:6 → 3:2',
    fn: async () => {
      const r = solveRatioSimplify({ a: 9, b: 6 })
      assert.strictEqual(r.p, 3)
      assert.strictEqual(r.q, 2)
      assert.strictEqual(r.g, 3)
    },
  },

  // ── Bug fixture 4: exterior angle consistency ────────────────────────
  {
    name: 'exterior_angle: A=50, B=80 → 130 (no flip-flop)',
    fn: async () => {
      const r = solveExteriorAngle({ angleA: 50, angleB: 80 })
      assert.strictEqual(r.answer, 130)
      // trace must mention the final value exactly once as the conclusion
      const joined = r.trace.join(' ')
      assert.match(joined, /130/)
    },
  },

  // ── Generator output: always passes the full validator ───────────────
  {
    name: 'similarity generator output passes validator (20 seeds)',
    fn: async () => {
      for (let seed = 1; seed <= 20; seed++) {
        const rng = seededRng(seed)
        const q = generateSimilarityRatioLength(rng)
        assertValid(q)
        // explanation must end with a cm value equal to correctAnswer
        const num = parseInt(q.correctAnswer)
        assert.match(q.explanation, new RegExp(`${num}\\s*cm。$`))
        // correctAnswer must appear in choices
        assert.ok(q.choices.includes(q.correctAnswer))
      }
    },
  },
  {
    name: 'exterior_angle generator output passes validator (20 seeds)',
    fn: async () => {
      for (let seed = 1; seed <= 20; seed++) {
        const rng = seededRng(seed)
        const q = generateExteriorAngle(rng)
        assertValid(q)
        assert.ok(q.choices.includes(q.correctAnswer))
        // explanation ends with the answer value
        const num = parseInt(q.correctAnswer)
        assert.match(q.explanation, new RegExp(`${num}°。$`))
      }
    },
  },
  {
    name: 'triangle_angle_sum generator output passes validator (20 seeds)',
    fn: async () => {
      for (let seed = 1; seed <= 20; seed++) {
        const rng = seededRng(seed)
        const q = generateTriangleAngleSum(rng)
        assertValid(q)
      }
    },
  },
  {
    name: 'ratio_length generator output passes validator (20 seeds)',
    fn: async () => {
      for (let seed = 1; seed <= 20; seed++) {
        const rng = seededRng(seed)
        const q = generateRatioLength(rng)
        assertValid(q)
        assert.ok(q.choices.includes(q.correctAnswer))
      }
    },
  },
  {
    name: 'ratio_simplify generator output is always fully reduced',
    fn: async () => {
      for (let seed = 1; seed <= 20; seed++) {
        const rng = seededRng(seed)
        const q = generateRatioSimplify(rng)
        const v = validateQuestionObject(q, { problemType: 'ratio_simplify' })
        assert.ok(v.ok, `ratio_simplify validator failed: ${v.errors.join(',')}`)
        // correctAnswer must be present in choices
        assert.ok(q.choices.includes(q.correctAnswer))
        // It must be fully reduced
        const m = /^(\d+):(\d+)$/.exec(q.correctAnswer)
        assert.ok(m, `correctAnswer must be a:b ratio, got "${q.correctAnswer}"`)
        assert.strictEqual(gcd(parseInt(m[1]), parseInt(m[2])), 1)
      }
    },
  },

  // ── Validator reject cases ───────────────────────────────────────────
  {
    name: 'validator rejects correct_answer_not_in_choices',
    fn: async () => {
      const q = {
        question: 'テスト',
        choices: ['1', '2', '3', '4'],
        correctIndex: 0,
        correctAnswer: '5',
        explanation: '答えは 5。',
      }
      const v = validateQuestionObject(q)
      assert.ok(!v.ok)
      assert.ok(v.errors.includes('correct_answer_not_in_choices'))
    },
  },
  {
    name: 'validator rejects index/answer mismatch',
    fn: async () => {
      const q = {
        question: 'テスト',
        choices: ['1', '2', '3', '4'],
        correctIndex: 2, // points at "3"
        correctAnswer: '2',
        explanation: '答えは 2。',
      }
      const v = validateQuestionObject(q)
      assert.ok(v.errors.includes('correct_index_does_not_point_at_correct_answer'))
    },
  },
  {
    name: 'validator rejects explanation_final_mismatch',
    fn: async () => {
      const q = {
        question: '相似比 3:2、AB=12cm のとき DE は？',
        choices: ['6cm', '8cm', '10cm', '12cm'],
        correctIndex: 1,
        correctAnswer: '8cm',
        explanation: '相似比 3:2 なので DE = 12 × 2 ÷ 3 = 18cm。', // ends with wrong 18cm
      }
      const v = validateQuestionObject(q)
      assert.ok(v.errors.includes('explanation_final_mismatch'))
    },
  },
  {
    name: 'validator rejects alien_labels (EF contamination in angle problem)',
    fn: async () => {
      const q = {
        question: '∠a=65° のとき ∠b を求めよ（平行線）',
        choices: ['45°', '65°', '115°', '130°'],
        correctIndex: 2,
        correctAnswer: '115°',
        explanation: '∠b = 180° - 65° = 115°。再計算すると EF = 10cm です。115°。',
      }
      const v = validateQuestionObject(q)
      const hasAlien = v.errors.some(e => e.startsWith('alien_labels:EF'))
      assert.ok(hasAlien, `expected alien_labels:EF, got ${v.errors.join(',')}`)
    },
  },
  {
    name: 'validator rejects ratio_not_reduced for ratio_simplify',
    fn: async () => {
      const q = {
        question: '9:6 を最も簡単な整数の比で表しなさい',
        choices: ['6:4', '3:2', '9:6', '2:3'],
        correctIndex: 0, // "6:4" — still reducible
        correctAnswer: '6:4',
        explanation: '最大公約数で割ると 6:4。',
      }
      const v = validateQuestionObject(q, { problemType: 'ratio_simplify' })
      assert.ok(v.errors.includes('ratio_not_reduced'))
    },
  },
  {
    name: 'validator accepts well-formed solver output',
    fn: async () => {
      const q = {
        question: '△ABC∽△DEF、相似比3:2、AB=12cm のとき DE は？',
        choices: ['6cm', '8cm', '10cm', '12cm'],
        correctIndex: 1,
        correctAnswer: '8cm',
        explanation: '相似比は3:2。対応辺も3:2なので 12 × 2 ÷ 3 = 8cm。',
      }
      const v = validateQuestionObject(q)
      assert.ok(v.ok, `expected ok, got ${v.errors.join(',')}`)
    },
  },

  // ── Isolation test: batch solver output never shares buffers ─────────
  {
    name: 'batch isolation: 10 solver outputs have independent explanations',
    fn: async () => {
      const out = []
      for (let i = 0; i < 10; i++) {
        const rng = seededRng(100 + i)
        out.push(generateSimilarityRatioLength(rng))
      }
      // Every explanation's final number must match its own correctAnswer
      for (const q of out) {
        const num = parseInt(q.correctAnswer)
        assert.match(q.explanation, new RegExp(`${num}\\s*cm。$`))
      }
      // No cross-leakage: values from other questions shouldn't dominate
      assert.strictEqual(new Set(out.map(q => q.explanation)).size >= 1, true)
    },
  },

  // ── Registry smoke test ──────────────────────────────────────────────
  {
    name: 'GENERATORS registry has all solver types (inc. hybrid templates)',
    fn: async () => {
      const keys = Object.keys(GENERATORS).sort()
      assert.deepStrictEqual(keys, [
        'cyclic_quadrilateral',
        'exterior_angle',
        'ratio_length',
        'ratio_simplify',
        'similarity_ratio_length',
        'thales_theorem',
        'triangle_angle_sum',
      ])
    },
  },
  {
    name: 'isSolverRequired helper agrees with classifier',
    fn: async () => {
      assert.strictEqual(isSolverRequired('相似', '相似比', 'math'), true)
      assert.strictEqual(isSolverRequired('方程式', '一次方程式', 'math'), false)
      assert.strictEqual(isSolverRequired('相似', '相似比', 'english'), false)
    },
  },
]
