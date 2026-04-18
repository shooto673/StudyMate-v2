// Universal question validator.
//
// Runs five integrity checks on a question object and returns {ok, errors}.
// Questions that fail any CRITICAL check must not be shipped.
//
// Rules:
//   1. option_presence          — correctAnswer must appear in choices
//   2. index_consistency        — choices[correctIndex] must equal correctAnswer
//   3. explanation_final_match  — last unit-bearing number in explanation
//                                 must equal correctAnswer's numeric value
//   4. explanation_purity       — explanation must not mention uppercase
//                                 label pairs (AB, EF, ...) that are absent
//                                 from question + choices
//   5. ratio_normalization      — for ratio_simplify problems, correctAnswer
//                                 must be fully reduced (gcd == 1)

import { gcd } from './mathSolvers.js'
import { isProblemTypeAllowed } from './classifier.js'

// problemTypes that REQUIRE a non-null graphData in order to be shippable.
// ratio_simplify is pure arithmetic → excluded.
export const GRAPH_REQUIRED_PROBLEM_TYPES = new Set([
  'triangle_angle_sum',
  'exterior_angle',
  'similarity_ratio_length',
  'ratio_length',
])

// problemTypes that the deterministic solver owns. If the validator sees a
// problemType here on an LLM-generated question (i.e. `opts.problemType`
// unset or mismatched), it means the LLM spuriously produced a question in
// this space and the figure WILL be wrong — reject.
const SOLVER_OWNED_PROBLEM_TYPES = new Set([
  'thales_theorem',
  'cyclic_quadrilateral',
])

// Patterns whose presence in the question text implies a circle-specific
// figure is needed. If the question text contains any of these but the
// graphData is NOT a `circle` shape, the figure will be visually wrong
// (as in the tester screenshot showing a rectangle for 内接四角形). Reject.
const CIRCLE_FIGURE_REQUIRED_RE =
  /(円に?内接|内接(?:する)?四角形|円周角|タレス|直径(?:を)?[A-Z]{2}|直径.{0,6}円(?:周)?|中心角)/

// Matches "8cm", "115°", "3.5m" — captures the numeric part and unit.
const UNIT_RE = /(-?\d+(?:\.\d+)?)\s*(cm|mm|m|km|°)/g

function normalize(s) {
  return String(s || '').replace(/\s+/g, '').replace(/[−\u2212]/g, '-').replace(/＝/g, '=')
}

function extractLastUnitNumber(text) {
  if (!text) return null
  const matches = [...text.matchAll(UNIT_RE)]
  if (matches.length === 0) return null
  const last = matches[matches.length - 1]
  return { value: parseFloat(last[1]), unit: last[2] }
}

function extractCorrectNumeric(correctAnswer) {
  if (!correctAnswer) return null
  const m = /(-?\d+(?:\.\d+)?)\s*(cm|mm|m|km|°)/.exec(String(correctAnswer))
  if (!m) return null
  return { value: parseFloat(m[1]), unit: m[2] }
}

/**
 * Validate a single question object.
 * @param {object} q — must have { question, choices, correctIndex, correctAnswer, explanation }
 * @param {object} opts — { problemType: string } for ratio checks
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateQuestionObject(q, opts = {}) {
  const errors = []
  if (!q) return { ok: false, errors: ['missing_question'] }

  const { question, choices, correctIndex, correctAnswer, explanation } = q

  // ── 1. option_presence ─────────────────────────────────────
  if (!Array.isArray(choices) || choices.length === 0) {
    errors.push('missing_choices')
  } else if (correctAnswer && !choices.includes(correctAnswer)) {
    // Try fuzzy normalized match before failing
    const normCorrect = normalize(correctAnswer)
    const has = choices.some(c => normalize(c) === normCorrect)
    if (!has) errors.push('correct_answer_not_in_choices')
  }

  // ── 2. index_consistency ───────────────────────────────────
  if (Array.isArray(choices)) {
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= choices.length) {
      errors.push('correct_index_out_of_range')
    } else if (correctAnswer && normalize(choices[correctIndex]) !== normalize(correctAnswer)) {
      errors.push('correct_index_does_not_point_at_correct_answer')
    }
  }

  // ── 3. explanation_final_match ─────────────────────────────
  if (explanation && correctAnswer) {
    const correctNum = extractCorrectNumeric(correctAnswer)
    const expLast = extractLastUnitNumber(explanation)
    if (correctNum && expLast) {
      const sameUnit = correctNum.unit === expLast.unit
      const sameVal = Math.abs(correctNum.value - expLast.value) < 1e-6
      if (!sameUnit || !sameVal) {
        errors.push('explanation_final_mismatch')
      }
    }
  }

  // ── 4. explanation_purity ──────────────────────────────────
  if (explanation && question) {
    const context = question + ' ' + (choices || []).join(' ')
    const pairs = [...String(explanation).matchAll(/\b([A-Z]{2,3})\b/g)].map(m => m[1])
    const alien = pairs.filter(p => !context.includes(p))
    if (alien.length > 0) {
      errors.push(`alien_labels:${[...new Set(alien)].join(',')}`)
    }
  }

  // ── 5. ratio_normalization ─────────────────────────────────
  if (opts.problemType === 'ratio_simplify' && correctAnswer) {
    const m = /^(\d+):(\d+)$/.exec(String(correctAnswer).trim())
    if (!m) {
      errors.push('ratio_format_invalid')
    } else {
      const a = parseInt(m[1], 10)
      const b = parseInt(m[2], 10)
      if (gcd(a, b) !== 1) errors.push('ratio_not_reduced')
    }
  }

  // ── 6. unit_problem_type_mismatch (optional — needs opts.unitTitle) ──
  if (opts.unitTitle !== undefined && opts.subUnitTitle !== undefined && opts.problemType) {
    const allowed = isProblemTypeAllowed(opts.unitTitle, opts.subUnitTitle, opts.subject || 'math', opts.problemType)
    if (!allowed) errors.push('unit_problem_type_mismatch')
  }

  // ── 7. missing_required_graph ─────────────────────────────────────
  if (opts.problemType && GRAPH_REQUIRED_PROBLEM_TYPES.has(opts.problemType)) {
    if (!q.graphData) errors.push('missing_required_graph')
  }

  // ── 8. multiple_valid_choices (parallelogram-opposite-angle) ──────
  // Catches LLM-generated 平行四辺形 "対角" questions where both opposite-
  // angle pairs appear in choices. Example failure:
  //   Q: 「平行四辺形ABCD。正しい対角の関係は？」
  //   choices: ['∠A=∠C', '∠B=∠D', ...]  ← both are true in ANY parallelogram,
  //                                         so the student can get it wrong
  //                                         for a textbook-correct answer.
  if (question && Array.isArray(choices)) {
    const q2 = normalize(question)
    const isParallelogramOpposite = /平行四辺形/.test(q2) && /対角/.test(q2)
    if (isParallelogramOpposite) {
      // Pull every "∠X = ∠Y" style choice and record the unordered vertex pair.
      const pairRe = /(?:∠|角)\s*([A-Z])\s*=\s*(?:∠|角)\s*([A-Z])/
      const pairs = (choices || []).map(c => {
        const m = pairRe.exec(normalize(c))
        if (!m) return null
        return [m[1], m[2]].sort().join('-')
      }).filter(Boolean)
      // {A,C} and {B,D} are BOTH opposite-angle pairs → question is ambiguous.
      if (pairs.includes('A-C') && pairs.includes('B-D')) {
        errors.push('multiple_valid_opposite_angles')
      }
    }
  }

  // ── 9. circle_figure_required_but_missing ─────────────────────────
  // Closes the tester-reported loophole where the LLM invents a 円周角 /
  // 内接四角形 / 直径AB question but the Stage-2 figure builder draws a
  // rectangle (because it has no dedicated circle-with-polygon shape).
  // Solver-first questions (opts.problemType ∈ SOLVER_OWNED_PROBLEM_TYPES)
  // carry a trusted circle figure and are exempt.
  if (question && CIRCLE_FIGURE_REQUIRED_RE.test(question)) {
    const isSolverOwned = opts.problemType && SOLVER_OWNED_PROBLEM_TYPES.has(opts.problemType)
    if (!isSolverOwned) {
      const shape = q.graphData && q.graphData.shape
      const hasCirclePoints = Array.isArray(q.graphData && q.graphData.pointsOnCircle)
        && q.graphData.pointsOnCircle.length > 0
      if (shape !== 'circle' || !hasCirclePoints) {
        errors.push('circle_figure_required_but_missing')
      }
    }
  }

  return { ok: errors.length === 0, errors }
}

/** Convenience: returns true iff a ratio string is already reduced. */
export function isReducedRatio(s) {
  const m = /^(\d+):(\d+)$/.exec(String(s || '').trim())
  if (!m) return false
  return gcd(parseInt(m[1], 10), parseInt(m[2], 10)) === 1
}
