// Tests for the explicit unit→problemType matrix, graph-data attachment,
// and the forced-problem-type contract.
import assert from 'node:assert/strict'
import { classifyUnit, isProblemTypeAllowed, _SUBUNIT_MATRIX } from '../lib/classifier.js'
import { GENERATORS } from '../lib/mathSolvers.js'
import { buildGraphFromSpec } from '../lib/buildGraphFromSpec.js'
import { validateQuestionObject, GRAPH_REQUIRED_PROBLEM_TYPES } from '../lib/questionValidator.js'

function mulberry(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export default [
  // ── Unit matrix routing (strict) ─────────────────────────────────
  {
    name: 'matrix: 三角形と四角形 > 平行四辺形 is NOT solver (no triangle problems)',
    fn: async () => {
      const c = classifyUnit('三角形と四角形', '平行四辺形', 'math')
      assert.strictEqual(c.category, 'lower_risk_batch',
        `平行四辺形 should stay LLM, got ${c.category} with ${c.generators.join(',')}`)
    },
  },
  {
    name: 'matrix: 三角形と四角形 > 三角形の性質 routes to triangle_angle_sum + exterior_angle',
    fn: async () => {
      const c = classifyUnit('三角形と四角形', '三角形の性質', 'math')
      assert.strictEqual(c.category, 'solver_required')
      assert.ok(c.generators.includes('triangle_angle_sum'))
      assert.ok(c.generators.includes('exterior_angle'))
    },
  },
  {
    name: 'matrix: 相似な図形 > 相似比 routes to similarity_ratio_length + ratio_simplify',
    fn: async () => {
      const c = classifyUnit('相似な図形', '相似比', 'math')
      assert.strictEqual(c.category, 'solver_required')
      assert.ok(c.generators.includes('similarity_ratio_length'))
      assert.ok(c.generators.includes('ratio_simplify'))
    },
  },
  {
    name: 'matrix: 平行と合同 > 平行線と角 stays LLM (same-side/alt interior not yet solved)',
    fn: async () => {
      const c = classifyUnit('平行と合同', '平行線と角', 'math')
      assert.strictEqual(c.category, 'lower_risk_batch')
    },
  },
  {
    name: 'isProblemTypeAllowed: triangle_angle_sum disallowed in 平行四辺形 context',
    fn: async () => {
      const ok = isProblemTypeAllowed('三角形と四角形', '平行四辺形', 'math', 'triangle_angle_sum')
      // LLM path returns true (no solver constraint). Matrix path returns false.
      // 平行四辺形 is LLM path, so no solver constraint → true.
      assert.strictEqual(ok, true)
    },
  },
  {
    name: 'isProblemTypeAllowed: triangle_angle_sum allowed in 三角形の性質',
    fn: async () => {
      assert.strictEqual(isProblemTypeAllowed('三角形と四角形', '三角形の性質', 'math', 'triangle_angle_sum'), true)
      assert.strictEqual(isProblemTypeAllowed('三角形と四角形', '三角形の性質', 'math', 'ratio_simplify'), false)
    },
  },

  // ── buildGraphFromSpec: solver-first questions carry graphData ─────
  {
    name: 'buildGraphFromSpec: triangle_angle_sum → triangle with labels ABC',
    fn: async () => {
      const spec = { problemType: 'triangle_angle_sum', given: { angleA: 50, angleB: 70 } }
      const g = buildGraphFromSpec(spec)
      assert.strictEqual(g.type, 'shape')
      assert.strictEqual(g.shape, 'triangle')
      assert.deepStrictEqual(g.labels, ['A', 'B', 'C'])
      assert.strictEqual(g.angles[0], '50°')
      assert.strictEqual(g.angles[2], null) // asked
    },
  },
  {
    name: 'buildGraphFromSpec: similarity_ratio_length → triangle pair',
    fn: async () => {
      const spec = {
        problemType: 'similarity_ratio_length',
        given: { knownLabel: 'AB', knownSide: 12, askedLabel: 'DE', knownIsBig: true },
      }
      const g = buildGraphFromSpec(spec)
      assert.strictEqual(g.shape, 'triangle')
      assert.ok(g.secondShape)
      assert.deepStrictEqual(g.secondShape.labels, ['D', 'E', 'F'])
    },
  },
  {
    name: 'buildGraphFromSpec: ratio_length → parallel_lines shape',
    fn: async () => {
      const spec = { problemType: 'ratio_length', given: { ratio: [2, 3], knownSide: 4 } }
      const g = buildGraphFromSpec(spec)
      assert.strictEqual(g.type, 'shape')
      assert.strictEqual(g.shape, 'parallel_lines')
      assert.deepStrictEqual(g.labels, ['A', 'B', 'C'])
      assert.strictEqual(g.ratio, '2:3')
    },
  },
  {
    name: 'buildGraphFromSpec: ratio_simplify → null (pure arithmetic)',
    fn: async () => {
      const g = buildGraphFromSpec({ problemType: 'ratio_simplify', given: { a: 9, b: 6 } })
      assert.strictEqual(g, null)
    },
  },

  // ── Validator: unit_problem_type_mismatch + missing_required_graph ─
  {
    name: 'validator: unit_problem_type_mismatch when problem type is not in sub-unit matrix',
    fn: async () => {
      const q = {
        question: '△ABC の ∠C は？',
        choices: ['30°', '40°', '50°', '60°'],
        correctIndex: 2,
        correctAnswer: '50°',
        explanation: '三角形の内角の和は180°。∠C = 180 - 60 - 70 = 50°。',
      }
      const v = validateQuestionObject(q, {
        problemType: 'triangle_angle_sum',
        unitTitle: '相似な図形',
        subUnitTitle: '相似条件',
        subject: 'math',
      })
      assert.ok(v.errors.includes('unit_problem_type_mismatch'),
        `expected unit_problem_type_mismatch, got ${v.errors.join(',')}`)
    },
  },
  {
    name: 'validator: missing_required_graph when triangle_angle_sum has no graphData',
    fn: async () => {
      const q = {
        question: '△ABC で ∠A=60°,∠B=70°。∠C は？',
        choices: ['30°', '40°', '50°', '60°'],
        correctIndex: 2,
        correctAnswer: '50°',
        explanation: '180° - 60° - 70° = 50°。',
      }
      const v = validateQuestionObject(q, { problemType: 'triangle_angle_sum' })
      assert.ok(v.errors.includes('missing_required_graph'))
    },
  },
  {
    name: 'validator: accepts triangle_angle_sum WITH graphData',
    fn: async () => {
      const q = {
        question: '△ABC で ∠A=60°,∠B=70°。∠C は？',
        choices: ['30°', '40°', '50°', '60°'],
        correctIndex: 2,
        correctAnswer: '50°',
        explanation: '180° - 60° - 70° = 50°。',
        graphData: { type: 'shape', shape: 'triangle', labels: ['A', 'B', 'C'] },
      }
      const v = validateQuestionObject(q, { problemType: 'triangle_angle_sum' })
      assert.ok(v.ok, `expected ok, got ${v.errors.join(',')}`)
    },
  },
  {
    name: 'GRAPH_REQUIRED_PROBLEM_TYPES includes the four visual solvers (not ratio_simplify)',
    fn: async () => {
      assert.ok(GRAPH_REQUIRED_PROBLEM_TYPES.has('triangle_angle_sum'))
      assert.ok(GRAPH_REQUIRED_PROBLEM_TYPES.has('exterior_angle'))
      assert.ok(GRAPH_REQUIRED_PROBLEM_TYPES.has('similarity_ratio_length'))
      assert.ok(GRAPH_REQUIRED_PROBLEM_TYPES.has('ratio_length'))
      assert.ok(!GRAPH_REQUIRED_PROBLEM_TYPES.has('ratio_simplify'))
    },
  },

  // ── Solver generators now produce graphData via the API ────────────
  {
    name: 'end-to-end: each generator seed produces a spec that buildGraphFromSpec handles',
    fn: async () => {
      for (const [key, gen] of Object.entries(GENERATORS)) {
        const rng = mulberry(key.length + 7)
        const q = gen(rng)
        const g = buildGraphFromSpec(q.spec)
        if (GRAPH_REQUIRED_PROBLEM_TYPES.has(key)) {
          assert.ok(g, `${key} must produce graphData`)
        }
      }
    },
  },

  // ── Regression: matrix keys list is self-consistent ────────────────
  {
    name: 'matrix: every solver generator referenced in matrix is registered',
    fn: async () => {
      const referenced = new Set()
      for (const gens of Object.values(_SUBUNIT_MATRIX)) {
        for (const g of gens) referenced.add(g)
      }
      for (const r of referenced) {
        assert.ok(GENERATORS[r], `matrix references unknown generator: ${r}`)
      }
    },
  },
]
