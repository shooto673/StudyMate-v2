// Classifies a (unitTitle, subUnitTitle) pair into a risk category
// so the generator knows whether to use solver-first or LLM freeform.
//
// Categories:
//   solver_required : must go through deterministic solver (high-risk math)
//   lower_risk_batch: ordinary batch LLM generation (default for math/english)
//   non_math        : non-math subjects
//
// The mapping is an EXPLICIT matrix keyed by subUnitTitle (from
// frontend/src/lib/units.js). Regex fallbacks cover table-drift; strict
// equality wins first to prevent cross-routing like "平行四辺形" being
// routed to triangle problems because its parent unit is "三角形と四角形".

// Generators allowed per sub-unit. `[]` = non-solver (goes to LLM batch).
const SUBUNIT_MATRIX = {
  // j2 三角形と四角形
  '三角形の性質': ['triangle_angle_sum', 'exterior_angle'],
  '平行四辺形': [],          // shape-based, LLM freeform with graphData
  '特別な四角形': [],
  '性質と証明': [],
  // j2 平行と合同
  '平行線と角': [],          // 同位角/錯角 solver is not implemented yet
  '合同条件': [],
  '証明の基本': [],
  // j3 相似な図形
  '相似条件': ['similarity_ratio_length'],
  '相似比': ['similarity_ratio_length', 'ratio_simplify'],
  '面積比・体積比': [],
  // Generic 平行線と比 (absent from current curriculum file but supported for future)
  '平行線と比': ['ratio_length'],
  // j3 円
  '円周角の定理': ['thales_theorem', 'cyclic_quadrilateral'],
  '接線と弦': [],
  '円と角の性質': ['thales_theorem', 'cyclic_quadrilateral'],
}

// Regex fallback when no exact sub-unit match (keeps future-proof routing).
// Order matters: put the specific patterns BEFORE the broader `/相似/` catch-all.
const REGEX_FALLBACKS = [
  { re: /^平行線と比$/, generators: ['ratio_length'] },
  { re: /相似比/, generators: ['similarity_ratio_length', 'ratio_simplify'] },
  { re: /相似条件/, generators: ['similarity_ratio_length'] },
  { re: /三角形の性質/, generators: ['triangle_angle_sum', 'exterior_angle'] },
  { re: /外角の(?:性質|定理)|多角形の外角/, generators: ['exterior_angle'] },
  { re: /内角の和|多角形の内角/, generators: ['triangle_angle_sum'] },
  { re: /円周角(?:の定理)?|タレス|内接四角形/, generators: ['thales_theorem', 'cyclic_quadrilateral'] },
  { re: /^比の(?:性質|計算|値|利用|表し方|簡単|簡約)$|比例式/, generators: ['ratio_simplify', 'ratio_length'] },
  // Broad catch-all LAST: when sub-unit is unknown but unit contains 相似
  // (e.g. "相似な図形") fall back to similarity length problems.
  { re: /相似/, generators: ['similarity_ratio_length'] },
]

/**
 * @param {string} unitTitle
 * @param {string} subUnitTitle
 * @param {string} subject
 * @returns {{category:'solver_required'|'lower_risk_batch'|'non_math', generators:string[]}}
 */
export function classifyUnit(unitTitle, subUnitTitle, subject) {
  if (subject !== 'math') {
    return { category: 'non_math', generators: [] }
  }

  // 1. Exact sub-unit match (authoritative — wins over parent-unit regex).
  if (subUnitTitle && Object.prototype.hasOwnProperty.call(SUBUNIT_MATRIX, subUnitTitle)) {
    const gens = SUBUNIT_MATRIX[subUnitTitle]
    if (gens.length > 0) return { category: 'solver_required', generators: gens }
    return { category: 'lower_risk_batch', generators: [] }
  }

  // 2. Regex fallback on subUnitTitle first, then on unitTitle.
  for (const { re, generators } of REGEX_FALLBACKS) {
    if (re.test(subUnitTitle || '')) {
      return { category: 'solver_required', generators }
    }
  }
  for (const { re, generators } of REGEX_FALLBACKS) {
    if (re.test(unitTitle || '')) {
      return { category: 'solver_required', generators }
    }
  }
  return { category: 'lower_risk_batch', generators: [] }
}

/**
 * Returns true iff the given solver problemType is allowed for this sub-unit.
 * Used by the validator to reject unit/problemType mismatches (e.g. a
 * triangle_angle_sum question being served in the 平行四辺形 sub-unit).
 */
export function isProblemTypeAllowed(unitTitle, subUnitTitle, subject, problemType) {
  const c = classifyUnit(unitTitle, subUnitTitle, subject)
  if (c.category !== 'solver_required') return true // LLM path: no solver constraints
  return c.generators.includes(problemType)
}

export function isSolverRequired(unitTitle, subUnitTitle, subject) {
  return classifyUnit(unitTitle, subUnitTitle, subject).category === 'solver_required'
}

// Exposed for tests and admin dashboards
export const _SUBUNIT_MATRIX = SUBUNIT_MATRIX
