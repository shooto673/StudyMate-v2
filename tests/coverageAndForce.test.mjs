// Coverage/routing tests for ratio_simplify & exterior_angle.
// Ensures the real unit titles from units.js route correctly, that solver
// generator lists rotate so every listed problemType actually appears,
// and that the debug_force path returns the requested problemType.
import assert from 'node:assert/strict'
import { classifyUnit } from '../lib/classifier.js'
import { GENERATORS } from '../lib/mathSolvers.js'
import { validateQuestionObject } from '../lib/questionValidator.js'

// Mirrors api/generate.js::generateSolverQuestions (kept in sync for testing).
// Generators now attach graphData internally via withGraph wrapper.
function generateSolverQuestions(generators, count) {
  const out = []
  let guard = 0
  while (out.length < count && guard++ < count * 20) {
    const gen = GENERATORS[generators[out.length % generators.length]]
    if (!gen) continue
    let q
    try { q = gen() } catch { continue }
    const v = validateQuestionObject(q, { problemType: q.spec?.problemType })
    if (!v.ok) {
      // eslint-disable-next-line no-console
      console.warn('[test helper] rejected:', v.errors, q.spec?.problemType)
      continue
    }
    out.push({ ...q })
  }
  return out
}

export default [
  // ── Real unit-title routing ────────────────────────────────────────
  {
    name: 'j2 三角形と四角形 > 三角形の性質 → triangle_angle_sum + exterior_angle',
    fn: async () => {
      const c = classifyUnit('三角形と四角形', '三角形の性質', 'math')
      assert.strictEqual(c.category, 'solver_required')
      assert.ok(c.generators.includes('exterior_angle'),
        `expected exterior_angle in generators, got: ${c.generators.join(',')}`)
      assert.ok(c.generators.includes('triangle_angle_sum'))
    },
  },
  {
    name: 'j3 相似な図形 > 相似比 → similarity_ratio_length + ratio_simplify',
    fn: async () => {
      const c = classifyUnit('相似な図形', '相似比', 'math')
      assert.strictEqual(c.category, 'solver_required')
      assert.ok(c.generators.includes('ratio_simplify'),
        `expected ratio_simplify in generators, got: ${c.generators.join(',')}`)
      assert.ok(c.generators.includes('similarity_ratio_length'))
    },
  },
  {
    name: 'j3 相似な図形 > 相似条件 → similarity_ratio_length (unchanged)',
    fn: async () => {
      const c = classifyUnit('相似な図形', '相似条件', 'math')
      assert.strictEqual(c.category, 'solver_required')
      assert.deepStrictEqual(c.generators, ['similarity_ratio_length'])
    },
  },
  {
    name: 'j2 平行と合同 > 平行線と角 → NOT exterior_angle (solver not implemented)',
    fn: async () => {
      // 平行線と角 is 同位角/錯角, not exterior angle — must stay freeform
      const c = classifyUnit('平行と合同', '平行線と角', 'math')
      assert.notStrictEqual(c.category, 'solver_required',
        'should stay freeform until 同位角/錯角 solver exists')
    },
  },
  {
    name: 'future-proof: 平行線と比 still routes to ratio_length',
    fn: async () => {
      const c = classifyUnit('相似', '平行線と比', 'math')
      assert.deepStrictEqual(c.generators, ['ratio_length'])
    },
  },

  // ── Coverage rotation: both problemTypes actually appear ───────────
  {
    name: 'coverage: 三角形の性質 count=6 yields both triangle_angle_sum and exterior_angle',
    fn: async () => {
      const { generators } = classifyUnit('三角形と四角形', '三角形の性質', 'math')
      const out = generateSolverQuestions(generators, 6)
      const types = out.map(q => q.spec.problemType)
      assert.ok(types.includes('triangle_angle_sum'),
        `missing triangle_angle_sum: ${types.join(',')}`)
      assert.ok(types.includes('exterior_angle'),
        `missing exterior_angle: ${types.join(',')}`)
    },
  },
  {
    name: 'coverage: 相似比 count=6 yields both similarity_ratio_length and ratio_simplify',
    fn: async () => {
      const { generators } = classifyUnit('相似な図形', '相似比', 'math')
      const out = generateSolverQuestions(generators, 6)
      const types = out.map(q => q.spec.problemType)
      assert.ok(types.includes('similarity_ratio_length'),
        `missing similarity_ratio_length: ${types.join(',')}`)
      assert.ok(types.includes('ratio_simplify'),
        `missing ratio_simplify: ${types.join(',')}`)
    },
  },

  // ── Forced problem type contract ───────────────────────────────────
  {
    name: 'force: ratio_simplify produces only ratio_simplify questions',
    fn: async () => {
      const out = generateSolverQuestions(['ratio_simplify'], 3)
      assert.strictEqual(out.length, 3)
      for (const q of out) {
        assert.strictEqual(q.spec.problemType, 'ratio_simplify')
      }
    },
  },
  {
    name: 'force: exterior_angle produces only exterior_angle questions',
    fn: async () => {
      const out = generateSolverQuestions(['exterior_angle'], 3)
      assert.strictEqual(out.length, 3)
      for (const q of out) {
        assert.strictEqual(q.spec.problemType, 'exterior_angle')
      }
    },
  },

  // ── Regression: similarity still works ─────────────────────────────
  {
    name: 'regression: 相似 (generic) still routes to similarity_ratio_length',
    fn: async () => {
      const c = classifyUnit('相似', '', 'math')
      assert.ok(c.generators.includes('similarity_ratio_length'))
    },
  },
]
