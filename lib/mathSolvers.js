// Deterministic solver-first generators for high-risk math problems.
// Each generator returns a full question object derived from a canonical spec,
// so correctAnswer / choices / explanation cannot drift from the solver result.
//
// Shape returned:
// {
//   spec: { problemType, given, computed, solverTrace },
//   question, choices, correctIndex, correctAnswer, explanation, hint,
// }

export function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b)
  return b === 0 ? a : gcd(b, a % b)
}

function pickRng(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}

function shuffleArray(arr, rng) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Build a 4-choice list that always contains the correct value. */
function buildChoices(correctValue, candidateDistractors, formatter, rng) {
  const seen = new Set()
  seen.add(String(correctValue))
  const pool = []
  for (const d of candidateDistractors) {
    if (d === undefined || d === null) continue
    const key = String(d)
    if (seen.has(key)) continue
    if (typeof d === 'number' && (!Number.isFinite(d) || d <= 0)) continue
    seen.add(key)
    pool.push(d)
  }
  // Pad with simple offsets if we don't have 3 distractors
  let pad = 1
  while (pool.length < 3) {
    const candidate = typeof correctValue === 'number' ? correctValue + pad : `pad${pad}`
    if (!seen.has(String(candidate))) {
      seen.add(String(candidate))
      pool.push(candidate)
    }
    pad++
    if (pad > 100) break
  }
  const values = [correctValue, ...pool.slice(0, 3)]
  const shuffled = shuffleArray(values, rng)
  const choices = shuffled.map(formatter)
  const correctAnswer = formatter(correctValue)
  const correctIndex = choices.indexOf(correctAnswer)
  return { choices, correctIndex, correctAnswer }
}

// ─────────────────────────────────────────────────────────────
// 1. similarity_ratio_length
//    △ABC∽△DEF, ratio p:q, known side → asked side
// ─────────────────────────────────────────────────────────────
export function solveSimilarityRatioLength({ p, q, knownSide, knownIsBig }) {
  if (!Number.isInteger(p) || !Number.isInteger(q) || p <= 0 || q <= 0) {
    throw new Error('similarity_ratio_length: invalid ratio')
  }
  if (!Number.isInteger(knownSide) || knownSide <= 0) {
    throw new Error('similarity_ratio_length: invalid knownSide')
  }
  // p:q is bigSide:smallSide
  let bigSide, smallSide
  if (knownIsBig) {
    bigSide = knownSide
    // Require clean division for integer answer
    if ((bigSide * q) % p !== 0) throw new Error('similarity_ratio_length: non-integer result')
    smallSide = (bigSide * q) / p
  } else {
    smallSide = knownSide
    if ((smallSide * p) % q !== 0) throw new Error('similarity_ratio_length: non-integer result')
    bigSide = (smallSide * p) / q
  }
  const answer = knownIsBig ? smallSide : bigSide
  const trace = knownIsBig
    ? [
        `△ABCと△DEFの相似比は${p}:${q}`,
        `対応する辺の比も${p}:${q}なので、${p}:${q} = ${knownSide}:DE`,
        `DE = ${knownSide} × ${q} ÷ ${p} = ${answer}`,
      ]
    : [
        `△ABCと△DEFの相似比は${p}:${q}`,
        `対応する辺の比も${p}:${q}なので、${p}:${q} = AB:${knownSide}`,
        `AB = ${knownSide} × ${p} ÷ ${q} = ${answer}`,
      ]
  return { answer, bigSide, smallSide, trace }
}

export function generateSimilarityRatioLength(rng = Math.random) {
  const ratios = [[3, 2], [2, 1], [5, 3], [4, 3], [3, 1], [5, 2], [4, 1]]
  let attempt = 0
  while (attempt++ < 50) {
    const [p, q] = pickRng(rng, ratios)
    const k = 2 + Math.floor(rng() * 5) // 2..6
    const bigSide = p * k
    const smallSide = q * k
    const knownIsBig = rng() < 0.5
    const knownSide = knownIsBig ? bigSide : smallSide
    let result
    try {
      result = solveSimilarityRatioLength({ p, q, knownSide, knownIsBig })
    } catch { continue }
    const { answer, trace } = result
    const knownLabel = knownIsBig ? 'AB' : 'DE'
    const askedLabel = knownIsBig ? 'DE' : 'AB'
    const questionText = `△ABCと△DEFは相似で、相似比は${p}:${q}である。${knownLabel}=${knownSide}cmのとき、${askedLabel}の長さを求めなさい。`
    const explanation = trace.join('。') + 'cm。'
    // Distractors = common student mistakes
    const distractors = [
      knownSide, // confused: copy given side
      Math.abs(knownSide - answer), // subtract
      knownSide + answer, // sum
      knownIsBig ? bigSide + p : smallSide + q,
      Number.isInteger((knownSide * p) / q) ? (knownSide * p) / q : null, // inverse ratio
    ].filter(v => Number.isInteger(v) && v > 0 && v !== answer && v < 200)
    const { choices, correctIndex, correctAnswer } =
      buildChoices(answer, distractors, v => `${v}cm`, rng)
    return {
      spec: {
        problemType: 'similarity_ratio_length',
        given: { ratio: [p, q], knownLabel, knownSide, askedLabel, knownIsBig },
        computed: { answer, bigSide, smallSide },
        solverTrace: trace,
      },
      question: questionText,
      choices,
      correctIndex,
      correctAnswer,
      explanation,
      hint: '相似比は対応する辺の比と同じだよ！',
    }
  }
  throw new Error('similarity_ratio_length: failed to generate after 50 attempts')
}

// ─────────────────────────────────────────────────────────────
// 2. exterior_angle
//    三角形の外角 = 隣り合わない2つの内角の和
// ─────────────────────────────────────────────────────────────
export function solveExteriorAngle({ angleA, angleB }) {
  if (!Number.isFinite(angleA) || !Number.isFinite(angleB)) {
    throw new Error('exterior_angle: invalid angles')
  }
  if (angleA <= 0 || angleB <= 0 || angleA + angleB >= 180) {
    throw new Error('exterior_angle: angle sum invalid')
  }
  const answer = angleA + angleB
  const trace = [
    `三角形の外角はそれと隣り合わない2つの内角の和に等しい`,
    `外角∠ACD = ∠A + ∠B = ${angleA}° + ${angleB}° = ${answer}`,
  ]
  return { answer, trace }
}

export function generateExteriorAngle(rng = Math.random) {
  let attempt = 0
  while (attempt++ < 100) {
    const angleA = 20 + Math.floor(rng() * 81) // 20..100
    const angleB = 20 + Math.floor(rng() * 81)
    if (angleA + angleB >= 170 || angleA + angleB < 50) continue
    if (angleA === angleB) continue
    const { answer, trace } = solveExteriorAngle({ angleA, angleB })
    const questionText = `三角形ABCで、∠A=${angleA}°、∠B=${angleB}°である。辺BCをCの方向に延長した点をDとするとき、外角∠ACDの大きさを求めなさい。`
    const explanation = trace.join('。') + '°。'
    const distractors = [
      180 - angleA - angleB, // interior ∠C
      180 - answer, // supplement
      Math.abs(angleA - angleB),
      Math.max(angleA, angleB),
      Math.min(angleA, angleB),
    ].filter(v => Number.isInteger(v) && v > 0 && v < 180 && v !== answer)
    const { choices, correctIndex, correctAnswer } =
      buildChoices(answer, distractors, v => `${v}°`, rng)
    return {
      spec: {
        problemType: 'exterior_angle',
        given: { angleA, angleB },
        computed: { answer },
        solverTrace: trace,
      },
      question: questionText,
      choices,
      correctIndex,
      correctAnswer,
      explanation,
      hint: '三角形の外角の性質を思い出そう！',
    }
  }
  throw new Error('exterior_angle: failed to generate')
}

// ─────────────────────────────────────────────────────────────
// 3. triangle_angle_sum: ∠C = 180 - ∠A - ∠B
// ─────────────────────────────────────────────────────────────
export function solveTriangleAngleSum({ angleA, angleB }) {
  const answer = 180 - angleA - angleB
  if (answer <= 0 || answer >= 180) throw new Error('triangle_angle_sum: invalid')
  const trace = [
    `三角形の内角の和は180°`,
    `∠C = 180° - ${angleA}° - ${angleB}° = ${answer}`,
  ]
  return { answer, trace }
}

export function generateTriangleAngleSum(rng = Math.random) {
  let attempt = 0
  while (attempt++ < 100) {
    const angleA = 20 + Math.floor(rng() * 101)
    const angleB = 20 + Math.floor(rng() * 101)
    const sum = angleA + angleB
    if (sum >= 160 || sum < 30) continue
    const { answer, trace } = solveTriangleAngleSum({ angleA, angleB })
    if (answer <= 10 || answer >= 160) continue
    if (angleA === answer || angleB === answer) continue
    const questionText = `三角形ABCで、∠A=${angleA}°、∠B=${angleB}°である。∠Cの大きさを求めなさい。`
    const explanation = trace.join('。') + '°。'
    const distractors = [
      180 - angleA,
      180 - angleB,
      angleA + angleB,
      Math.abs(angleA - angleB),
    ].filter(v => Number.isInteger(v) && v > 0 && v < 180 && v !== answer)
    const { choices, correctIndex, correctAnswer } =
      buildChoices(answer, distractors, v => `${v}°`, rng)
    return {
      spec: {
        problemType: 'triangle_angle_sum',
        given: { angleA, angleB },
        computed: { answer },
        solverTrace: trace,
      },
      question: questionText,
      choices,
      correctIndex,
      correctAnswer,
      explanation,
      hint: '三角形の内角の和は180°だよ！',
    }
  }
  throw new Error('triangle_angle_sum: failed to generate')
}

// ─────────────────────────────────────────────────────────────
// 4. ratio_length: 平行線と比 AB:BC = a:b
// ─────────────────────────────────────────────────────────────
export function solveRatioLength({ a, b, knownSide }) {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a <= 0 || b <= 0) {
    throw new Error('ratio_length: invalid ratio')
  }
  if (knownSide % a !== 0) throw new Error('ratio_length: non-integer result')
  const unit = knownSide / a
  const answer = unit * b
  const trace = [
    `AB:BC = ${a}:${b}`,
    `AB = ${knownSide}cm なので 1単位 = ${knownSide} ÷ ${a} = ${unit}`,
    `BC = ${unit} × ${b} = ${answer}`,
  ]
  return { answer, unit, trace }
}

export function generateRatioLength(rng = Math.random) {
  const ratios = [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [1, 2], [3, 2], [4, 3]]
  let attempt = 0
  while (attempt++ < 50) {
    const [a, b] = pickRng(rng, ratios)
    const k = 2 + Math.floor(rng() * 5) // 2..6
    const knownSide = a * k
    let result
    try {
      result = solveRatioLength({ a, b, knownSide })
    } catch { continue }
    const { answer, trace } = result
    const questionText = `平行線 l, m, n に辺が区切られており、AB:BC = ${a}:${b} の関係がある。AB=${knownSide}cmのとき、BCの長さを求めなさい。`
    const explanation = trace.join('。') + 'cm。'
    const distractors = [
      knownSide,
      knownSide + a,
      knownSide + b,
      Math.abs(knownSide - answer),
      Number.isInteger((knownSide * a) / b) ? (knownSide * a) / b : null, // inverse
    ].filter(v => Number.isInteger(v) && v > 0 && v !== answer && v < 200)
    const { choices, correctIndex, correctAnswer } =
      buildChoices(answer, distractors, v => `${v}cm`, rng)
    return {
      spec: {
        problemType: 'ratio_length',
        given: { ratio: [a, b], knownSide },
        computed: { answer },
        solverTrace: trace,
      },
      question: questionText,
      choices,
      correctIndex,
      correctAnswer,
      explanation,
      hint: '平行線と比の関係を式にしよう！',
    }
  }
  throw new Error('ratio_length: failed to generate')
}

// ─────────────────────────────────────────────────────────────
// 5. ratio_simplify: 9:6 → 3:2
// ─────────────────────────────────────────────────────────────
export function solveRatioSimplify({ a, b }) {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a <= 0 || b <= 0) {
    throw new Error('ratio_simplify: invalid')
  }
  const g = gcd(a, b)
  const p = a / g
  const q = b / g
  const trace = [
    `${a}と${b}の最大公約数は${g}`,
    `両方を${g}で割ると ${p}:${q}`,
  ]
  return { p, q, g, trace }
}

export function generateRatioSimplify(rng = Math.random) {
  const bases = [[3, 2], [2, 1], [5, 3], [4, 3], [3, 1], [5, 2], [4, 1], [5, 4], [7, 3], [7, 2]]
  let attempt = 0
  while (attempt++ < 50) {
    const [p, q] = pickRng(rng, bases)
    if (gcd(p, q) !== 1) continue // must be already reduced
    const k = 2 + Math.floor(rng() * 4) // 2..5
    const a = p * k
    const b = q * k
    const { trace } = solveRatioSimplify({ a, b })
    const correctAnswer = `${p}:${q}`
    const questionText = `${a}:${b} を最も簡単な整数の比で表しなさい。`
    const explanation = trace.join('。') + '。'
    // Distractors (note: 3:2 vs 2:3 have different reduced forms)
    const distractorStrs = [
      `${a}:${b}`, // unsimplified
      `${q}:${p}`, // swapped
      `${p + 1}:${q}`,
      `${p}:${q + 1}`,
      `${Math.max(1, p - 1)}:${q}`,
      `${p * 2}:${q * 2}`, // different unreduced
    ]
    const seen = new Set([correctAnswer])
    const pool = []
    for (const s of distractorStrs) {
      if (seen.has(s)) continue
      seen.add(s)
      pool.push(s)
      if (pool.length >= 3) break
    }
    while (pool.length < 3) {
      const candidate = `${p + pool.length + 2}:${q}`
      if (!seen.has(candidate)) { seen.add(candidate); pool.push(candidate) }
    }
    const values = [correctAnswer, ...pool.slice(0, 3)]
    const shuffled = shuffleArray(values, rng)
    const correctIndex = shuffled.indexOf(correctAnswer)
    return {
      spec: {
        problemType: 'ratio_simplify',
        given: { a, b },
        computed: { reduced: [p, q] },
        solverTrace: trace,
      },
      question: questionText,
      choices: shuffled,
      correctIndex,
      correctAnswer,
      explanation,
      hint: '最大公約数で両方を割ってみよう！',
    }
  }
  throw new Error('ratio_simplify: failed to generate')
}

// ─────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────
export const GENERATORS = {
  similarity_ratio_length: generateSimilarityRatioLength,
  exterior_angle: generateExteriorAngle,
  triangle_angle_sum: generateTriangleAngleSum,
  ratio_length: generateRatioLength,
  ratio_simplify: generateRatioSimplify,
}
