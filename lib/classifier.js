// Classifies a (unitTitle, subUnitTitle) pair into a risk category
// so the generator knows whether to use solver-first or LLM freeform.
//
// Categories:
//   solver_required : must go through deterministic solver (high-risk math)
//   safe_template   : templated LLM generation (currently unused, reserved)
//   lower_risk_batch: ordinary batch LLM generation (default for math/english)
//   non_math        : non-math subjects

// Patterns that MUST route to solver-first. Order matters — first match wins.
const SOLVER_PATTERNS = [
  // 相似 (similarity of figures) — look in both unit and subunit
  { re: /相似/, generators: ['similarity_ratio_length'] },
  // 平行線と比 (parallel lines & ratios)
  { re: /平行線と比|平行線.*比/, generators: ['ratio_length'] },
  // 外角
  { re: /外角/, generators: ['exterior_angle'] },
  // 三角形の内角和・角度
  { re: /内角の和|内角.*計算|三角形.*角度|多角形の角/, generators: ['triangle_angle_sum'] },
  // 比の計算・簡約
  { re: /比の(?:性質|計算|値|利用)|比例式|比の簡単/, generators: ['ratio_simplify', 'ratio_length'] },
]

/**
 * Classify a unit/sub-unit pair.
 * @param {string} unitTitle
 * @param {string} subUnitTitle
 * @param {string} subject  'math' | 'english' | ...
 * @returns {{ category: string, generators: string[] }}
 */
export function classifyUnit(unitTitle, subUnitTitle, subject) {
  if (subject !== 'math') {
    return { category: 'non_math', generators: [] }
  }
  const haystack = `${unitTitle || ''} ${subUnitTitle || ''}`
  for (const { re, generators } of SOLVER_PATTERNS) {
    if (re.test(haystack)) {
      return { category: 'solver_required', generators }
    }
  }
  return { category: 'lower_risk_batch', generators: [] }
}

/**
 * Returns true if the given unit/sub-unit must be solver-backed.
 * When `SOLVER_REQUIRED_UNITS_ONLY=true`, freeform LLM generation for any
 * classifier-matched unit is forbidden and the generator list is authoritative.
 */
export function isSolverRequired(unitTitle, subUnitTitle, subject) {
  return classifyUnit(unitTitle, subUnitTitle, subject).category === 'solver_required'
}
