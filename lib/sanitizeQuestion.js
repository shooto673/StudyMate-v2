// lib/sanitizeQuestion.js
//
// Question sanitization / fix-up layer.
//
// Responsibility split (per CLAUDE.md):
//   • Stage 1 (LLM) produces raw questions.
//   • THIS module mutates & repairs individual fields (text normalisation,
//     contaminated sentences, graphData clamping, correctIndex repair).
//   • lib/questionValidator.js is the single source of truth that decides
//     whether a question may ship. This module never drops questions —
//     only cleans them. Validator alone has CRITICAL drop authority.
//
// Pipeline (as orchestrated by api/generate.js):
//   classify → generate (Stage 1 LLM)
//            → sanitizeQuestions()   ← text + correctIndex repair
//            → validateQuestionObject()  ← drop-if-broken gate
//            → extractGraphData (Stage 2 LLM)
//            → sanitizeGraphData()   ← clamp range, null asked edges
//            → return
//
// None of the helpers here may decide to reject a question. They can only
// normalise, null-out, or rewrite fields so that the Final Gate sees a
// clean candidate.

/**
 * Remove sentences from an explanation that mention variable pairs
 * (e.g. "EF", "BC") that do not appear in the question or choices.
 * This catches cross-question contamination like
 *   "再計算すると... EF = 10cm"
 * leaking from a previous problem in the same batch.
 */
export function removeContaminatedSentences(question, choices, explanation) {
  if (!explanation) return explanation
  const context = (question || '') + ' ' + (choices || []).join(' ')
  // Split on Japanese/ASCII sentence-ending punctuation
  const sentences = explanation.split(/(?<=[。！？\n])\s*/).filter(s => s.trim())
  const clean = sentences.filter(s => {
    // Find all two-letter uppercase pairs in this sentence (side names like EF, AB)
    const pairs = [...s.matchAll(/\b([A-Z]{2})\b/g)].map(m => m[1])
    return pairs.every(p => context.includes(p))
  })
  if (clean.length < sentences.length) {
    console.warn('[Sanitize] Removed contaminated sentence(s) from explanation')
  }
  // Hard cap: never more than 4 sentences
  return clean.slice(0, 4).join('')
}

/**
 * Re-derive side ordering from the question text to fix LLM misordering.
 * Parses "AB = 5cm" patterns and places them in the correct [AB,BC,CA] positions.
 */
export function fixSideOrder(question, labels, sides) {
  if (!labels || !sides || !question) return sides
  const n = labels.length
  if (sides.length !== n) return sides

  const q = question
    .replace(/[−\u2212\u2013\u2014]/g, '-')
    .replace(/＝/g, '=')

  const sideMap = new Map()

  // Pattern 1: Chained equality "AB = AC = 8cm"
  const chainRe = /([A-Z]{2})\s*=\s*([A-Z]{2})\s*=\s*([\d.]+)\s*(cm|m)?/g
  let m
  while ((m = chainRe.exec(q)) !== null) {
    const val = `${m[3]}${m[4] || 'cm'}`
    for (const pair of [m[1], m[2]]) {
      sideMap.set(pair, val)
      sideMap.set(pair[1] + pair[0], val)
    }
  }

  // Pattern 2: Simple "AB = 5cm", "ABの長さは5cm"
  const simpleRe = /([A-Z])([A-Z])\s*(?:の長さ)?(?:\s*[=がは]\s*)([\d.]+)\s*(cm|m)?/g
  while ((m = simpleRe.exec(q)) !== null) {
    const key = m[1] + m[2]
    if (!sideMap.has(key)) {
      const val = `${m[3]}${m[4] || 'cm'}`
      sideMap.set(key, val)
      sideMap.set(m[2] + m[1], val)
    }
  }

  if (sideMap.size === 0) return sides

  const fixed = []
  for (let i = 0; i < n; i++) {
    const a = labels[i]
    const b = labels[(i + 1) % n]
    const key = a + b
    fixed.push(sideMap.has(key) ? sideMap.get(key) : null)
  }

  return fixed.some(s => s !== null) ? fixed : sides
}

/**
 * Normalise full-width punctuation / minus signs that LLMs occasionally
 * emit (e.g. `y = −3x + 6` with U+2212 instead of ASCII '-').  Downstream
 * regex extraction and the Stage-2 LLM both prefer pure ASCII, so we do
 * this once at the gate.  Keeps math symbols like `²` untouched.
 */
export function normalizeMathText(text) {
  if (text === null || text === undefined) return text
  return String(text)
    // U+2212 MINUS, U+2013 EN DASH, U+2014 EM DASH, U+30FC KATAKANA DASH, U+2010 HYPHEN
    .replace(/[\u2212\u2013\u2014\u30FC\u2010]/g, '-')
    .replace(/＝/g, '=')
    .replace(/＋/g, '+')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/，/g, ',')
}

/**
 * Detect whether `label` (e.g. "CD", "∠A", "AB") is the quantity being
 * asked about in the question text.  Used so we don't print the answer
 * as a label on the figure.
 *
 * Heuristic (kept tight on purpose to avoid over-matching):
 *   A label is "asked" iff it appears immediately adjacent to an ask-word
 *   (before or after, with at most one short linker like "の長さを").
 *   We reject broad "label appears anywhere near 求め" patterns because
 *   `AB=8cm、辺CDの長さを求め` must report CD asked, AB not asked.
 */
export function isBeingAsked(question, label) {
  if (!question || !label) return false
  const q = normalizeMathText(question)
  const esc = String(label).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const askTail = '(?:何\\s*cm|何\\s*度|何\\s*mm|何\\s*m|いくつ|いくら|求め|どれ)'
  // label → optional linker ("の長さを" / "は" / "＝") → ask-word
  const p1 = new RegExp(
    `(?:辺|角|∠)?${esc}\\s*(?:の(?:長さ|大きさ|値))?\\s*[がはをに＝=]?\\s*${askTail}`
  )
  // ask-verb → short gap (≤6 chars, no sentence break) → label
  const p2 = new RegExp(
    `${askTail}[^。\\.？\\?\\n]{0,6}(?:辺|角|∠)?${esc}`
  )
  return p1.test(q) || p2.test(q)
}

/**
 * Defensive post-Stage-2 sanitisation:
 *   • clamps coordinate range to ≤8 (one-variable graphs look tiny above that)
 *   • null-outs side / angle entries that match isBeingAsked
 *   • re-extracts sides for quadrilaterals when Stage-2 forgot to populate them
 * Mutates and returns the same graphData object for convenience.
 */
export function sanitizeGraphData(question, gd) {
  if (!gd) return gd
  const q = normalizeMathText(question || '')

  // Coordinate range clamp.
  if (gd.type === 'coordinate') {
    if (typeof gd.range !== 'number' || !isFinite(gd.range) || gd.range <= 0) {
      gd.range = 5
    } else if (gd.range > 8) {
      gd.range = 8
    }
    // If polygons are present, ensure the range actually fits them.
    // LLM sometimes leaves range=5 even with a vertex at (7, -3); without
    // this expand step the labels would render off-axis-area.
    if (Array.isArray(gd.polygons) && gd.polygons.length > 0) {
      let maxAbs = 0
      for (const poly of gd.polygons) {
        if (!poly || !Array.isArray(poly.vertices)) continue
        for (const v of poly.vertices) {
          if (typeof v.x === 'number') maxAbs = Math.max(maxAbs, Math.abs(v.x))
          if (typeof v.y === 'number') maxAbs = Math.max(maxAbs, Math.abs(v.y))
        }
      }
      if (maxAbs > 0) {
        const needed = Math.min(8, Math.max(gd.range, Math.ceil(maxAbs) + 1))
        gd.range = needed
      }
    }
  }

  if (gd.type === 'shape' && Array.isArray(gd.labels)) {
    // Null asked sides / angles on main shape
    _nullAskedEdges(q, gd)
    // Cross-check each non-null side against the question text.
    // Prevents angle values (角ABC=50°) from leaking into the sides slot
    // as "BC=50cm" when Stage-2 misreads the token.
    if (Array.isArray(gd.sides) && gd.sides.length === gd.labels.length) {
      gd.sides = _verifySidesAgainstText(q, gd.labels, gd.sides)
    }
    // Re-extract numeric sides for quads when Stage-2 left them empty
    if ((gd.shape === 'parallelogram' || gd.shape === 'rectangle' || gd.shape === 'rhombus')
        && (!gd.sides || gd.sides.every(s => s === null || s === undefined))) {
      const extracted = _extractSidesFromText(q, gd.labels)
      if (extracted.some(Boolean)) gd.sides = extracted
    }
    // Same treatment on secondShape (similarity/congruence pairs)
    if (gd.secondShape && Array.isArray(gd.secondShape.labels)) {
      _nullAskedEdges(q, gd.secondShape)
      if (Array.isArray(gd.secondShape.sides)
          && gd.secondShape.sides.length === gd.secondShape.labels.length) {
        gd.secondShape.sides = _verifySidesAgainstText(
          q, gd.secondShape.labels, gd.secondShape.sides
        )
      }
    }
  }

  return gd
}

/**
 * Verify each non-null entry in `sides` is actually backed by a length
 * attribution in the question text (e.g. "AB = 8cm"). Nulls out entries
 * that can only be justified by an angle ("角ABC = 50°") or not at all.
 *
 * For quadrilaterals we also accept the parallel-pair fallback: if the
 * opposite side is declared with the same value+unit, we keep it, since
 * parallelograms/rectangles/rhombuses have equal opposite sides by
 * definition.
 */
function _verifySidesAgainstText(q, labels, sides) {
  const n = labels.length
  if (!Array.isArray(sides) || sides.length !== n) return sides
  const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const out = [...sides]

  const pairHasLength = (a, b, num) => {
    // Accept: "AB=8cm", "辺ABの長さは8cm", "AB は 8 cm" etc. Either ordering.
    // Disallow: "角ABC=50°" (angle marker 角/∠ precedes the pair).
    const re = new RegExp(
      `(?<![角∠])(?:辺)?(?:${esc(a)}${esc(b)}|${esc(b)}${esc(a)})` +
      `[^\\d\\n。]{0,10}${esc(num)}\\s*(?:cm|mm|m|km)`
    )
    return re.test(q)
  }

  for (let i = 0; i < n; i++) {
    const val = out[i]
    if (val === null || val === undefined) continue
    const numMatch = /(\d+(?:\.\d+)?)/.exec(String(val))
    if (!numMatch) continue
    const num = numMatch[1]
    const a = labels[i], b = labels[(i + 1) % n]
    if (pairHasLength(a, b, num)) continue
    // Parallel-pair fallback for quads (opposite sides are equal)
    if (n === 4) {
      const a2 = labels[(i + 2) % n], b2 = labels[(i + 3) % n]
      if (pairHasLength(a2, b2, num)) continue
    }
    // No length attribution in the text → likely an angle that leaked.
    out[i] = null
  }
  return out
}

function _nullAskedEdges(q, shape) {
  const labels = shape.labels || []
  const n = labels.length
  if (Array.isArray(shape.sides) && shape.sides.length === n) {
    shape.sides = shape.sides.map((s, i) => {
      if (s === null || s === undefined) return s
      const a = labels[i], b = labels[(i + 1) % n]
      if (isBeingAsked(q, `${a}${b}`) || isBeingAsked(q, `${b}${a}`)) return null
      return s
    })
  }
  if (Array.isArray(shape.angles) && shape.angles.length === n) {
    shape.angles = shape.angles.map((a, i) => {
      if (a === null || a === undefined) return a
      const v = labels[i]
      if (isBeingAsked(q, `∠${v}`) || isBeingAsked(q, v)) return null
      return a
    })
  }
}

function _extractSidesFromText(q, labels) {
  const n = labels.length
  const out = []
  for (let i = 0; i < n; i++) {
    const a = labels[i], b = labels[(i + 1) % n]
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Accept "AB = 5cm", "辺ABの長さは5cm", "ABは 5 cm" etc. Also BA ordering.
    //
    // CRITICAL guards (prevent angle values leaking in as sides):
    //   • lookbehind (?<![角∠]) — reject "角ABC=50°" matching at "BC=50"
    //   • unit is REQUIRED (cm|mm|m|km) — reject "50°" (degree)
    // The original version made the unit optional and defaulted to cm,
    // which pulled angle values into the sides slot.
    const re = new RegExp(
      `(?<![角∠])(?:辺)?(?:${esc(a)}${esc(b)}|${esc(b)}${esc(a)})` +
      `\\s*(?:の(?:長さ|値))?\\s*(?:[=＝がは]|\\bis\\b)\\s*` +
      `(\\d+(?:\\.\\d+)?)\\s*(cm|mm|m|km)\\b`
    )
    const m = q.match(re)
    if (m) {
      const pair = `${a}${b}`
      if (isBeingAsked(q, pair) || isBeingAsked(q, `${b}${a}`)) {
        out.push(null)
      } else {
        out.push(`${m[1]}${m[2]}`)
      }
    } else {
      out.push(null)
    }
  }
  return out
}

/**
 * Repair `correctIndex` so it points at the current `correctAnswer` entry
 * in `choices`. Catches two common LLM failure modes:
 *   • "correctIndex": 2 but the correct answer actually sits at index 0
 *   • whitespace / full-width drift between choice text and correctAnswer
 * Leaves the question alone when it is already consistent.
 * Does NOT drop the question — the validator is the sole gate for that.
 */
export function repairCorrectIndex(q) {
  if (!q || !q.correctAnswer || !Array.isArray(q.choices)) return
  const exactIdx = q.choices.indexOf(q.correctAnswer)
  if (exactIdx !== -1 && exactIdx !== q.correctIndex) {
    console.warn(`[Sanitize] correctIndex fix: ${q.correctIndex} → ${exactIdx} for "${q.correctAnswer}"`)
    q.correctIndex = exactIdx
  } else if (exactIdx === -1) {
    // Fuzzy match: trim whitespace, normalize fullwidth/halfwidth
    const norm = s => (s || '').replace(/\s+/g, '').replace(/[−\u2212]/g, '-').replace(/＝/g, '=')
    const fuzzyIdx = q.choices.findIndex(c => norm(c) === norm(q.correctAnswer))
    if (fuzzyIdx !== -1 && fuzzyIdx !== q.correctIndex) {
      console.warn(`[Sanitize] correctIndex fix (fuzzy): ${q.correctIndex} → ${fuzzyIdx}`)
      q.correctIndex = fuzzyIdx
    }
  }
}

/**
 * Batch sanitiser used by the orchestrator (api/generate.js) immediately
 * after Stage-1 returns and BEFORE the validator runs. Mutates the given
 * array in-place and returns it.
 *
 * Order matters:
 *   1. normalise text fields (so every later regex sees ASCII)
 *   2. strip contaminated sentences from explanations
 *   3. repair correctIndex drift
 *
 * This function is intentionally pure-ish: no network, no throwing,
 * no question dropping. Keeps api/generate.js an orchestrator.
 */
export function sanitizeQuestions(questions) {
  if (!Array.isArray(questions)) return questions
  for (const q of questions) {
    if (!q || typeof q !== 'object') continue
    // 1. Text normalisation — fixes `y = −3x + 6` et al before downstream
    //    regex / Stage-2 LLM sees the field.
    if (typeof q.question === 'string') q.question = normalizeMathText(q.question)
    if (Array.isArray(q.choices)) q.choices = q.choices.map(normalizeMathText)
    if (typeof q.correctAnswer === 'string') q.correctAnswer = normalizeMathText(q.correctAnswer)
    if (typeof q.explanation === 'string') q.explanation = normalizeMathText(q.explanation)
    // 2. Cross-question contamination guard
    if (q.explanation) {
      q.explanation = removeContaminatedSentences(q.question, q.choices, q.explanation)
    }
    // 3. correctIndex repair (LLM sometimes off-by-N)
    repairCorrectIndex(q)
  }
  return questions
}
