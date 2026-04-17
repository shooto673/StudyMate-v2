// Classifies a (unitTitle, subUnitTitle) pair into a risk category
// so the generator knows whether to use solver-first or LLM freeform.
//
// Categories:
//   solver_required : must go through deterministic solver (high-risk math)
//   safe_template   : templated LLM generation (currently unused, reserved)
//   lower_risk_batch: ordinary batch LLM generation (default for math/english)
//   non_math        : non-math subjects

// Patterns that MUST route to solver-first. Order matters — first match wins.
//
// IMPORTANT: these patterns are matched against the actual unit titles in
// frontend/src/lib/units.js. Do not invent titles — verify against that file.
// As of 2026-04, the relevant real titles are:
//   j2  平行と合同 > 平行線と角 / 合同条件 / 証明の基本
//   j2  三角形と四角形 > 三角形の性質 / 平行四辺形 / 特別な四角形 / 性質と証明
//   j3  相似な図形 > 相似条件 / 相似比 / 面積比・体積比
//
const SOLVER_PATTERNS = [
  // 平行線と比（先に判定して exterior_angle の外角パターンと干渉しないように）
  { re: /平行線と比|平行線.*比/, generators: ['ratio_length'] },
  // 三角形の性質 (j2) — 内角和 + 外角定理 を混ぜて出題。
  // 「平行線と角」(同位角・錯角) は現状 solver 未実装なのでマッチさせない。
  { re: /三角形の性質|三角形と四角形|多角形の(?:内角|外角|角)|内角の和|外角(?:の定理|の性質)?/,
    generators: ['triangle_angle_sum', 'exterior_angle'] },
  // 相似比 — 相似比で長さを求める問題 + 比の簡約 をローテーション
  { re: /相似比/, generators: ['similarity_ratio_length', 'ratio_simplify'] },
  // 相似条件 / 相似な図形 全般
  { re: /相似/, generators: ['similarity_ratio_length'] },
  // 比の計算・簡約（独立した比の単元がある学年用の保険）
  { re: /比の(?:性質|計算|値|利用|表し方|簡単|簡約)|比例式/, generators: ['ratio_simplify', 'ratio_length'] },
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
