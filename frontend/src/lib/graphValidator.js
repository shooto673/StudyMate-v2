// Pure validation for AI-generated graphData.
// Kept as plain JS so it can be unit-tested without a bundler or React runtime.

export const SUPPORTED_TYPES = ['coordinate', 'numberline', 'shape']
export const SUPPORTED_SHAPES = ['triangle', 'rectangle', 'rhombus', 'parallelogram', 'circle', 'parallel_lines']

const LABEL_PATTERNS = [
  // 「A」「い」style
  /[「『]([あ-おア-オA-Z])[」』]/g,
  // 三角形ABC, △ABC, 四角形ABCD
  /(?:三角形|△|四角形|□|長方形|平行四辺形|ひし形|菱形|台形)([A-Z]{2,4})/g,
  // 点A, 点P, 頂点A
  /(?:点|頂点)([A-Z])/g,
]

/** Extract vertex labels mentioned in a Japanese question string. */
export function extractMentionedLabels(question) {
  if (!question) return []
  const labels = new Set()
  for (const re of LABEL_PATTERNS) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(question)) !== null) {
      for (const ch of m[1]) labels.add(ch)
    }
  }
  return [...labels]
}

/**
 * Validate graphData against a question.
 * Returns the (possibly-cleaned) graphData on success, or { rejected: true, reason }
 * on failure. Callers can choose to log the rejection reason.
 */
export function validateGraphData(question, graphData) {
  if (!graphData || !graphData.type) {
    return { rejected: true, reason: 'null_or_missing_type' }
  }
  if (!SUPPORTED_TYPES.includes(graphData.type)) {
    return { rejected: true, reason: `unsupported_type:${graphData.type}` }
  }

  // Coordinate requires at least one line, curve, point, or polygon
  if (graphData.type === 'coordinate') {
    const hasLines = Array.isArray(graphData.lines) && graphData.lines.length > 0
    const hasCurves = Array.isArray(graphData.curves) && graphData.curves.length > 0
    const hasPoints = Array.isArray(graphData.points) && graphData.points.length > 0
    const hasPolygons = Array.isArray(graphData.polygons) && graphData.polygons.length > 0
    if (!hasLines && !hasCurves && !hasPoints && !hasPolygons) {
      return { rejected: true, reason: 'coordinate_empty' }
    }
    if (hasLines) {
      for (const line of graphData.lines) {
        if (typeof line.slope !== 'number' || Number.isNaN(line.slope)) {
          return { rejected: true, reason: 'coordinate_bad_slope' }
        }
      }
    }
    if (hasCurves) {
      for (const curve of graphData.curves) {
        if (typeof curve.a !== 'number' || curve.a === 0) {
          return { rejected: true, reason: 'coordinate_bad_curve' }
        }
      }
    }
    if (hasPolygons) {
      for (const poly of graphData.polygons) {
        if (!Array.isArray(poly.vertices) || poly.vertices.length < 3) {
          return { rejected: true, reason: 'coordinate_polygon_too_few_vertices' }
        }
        for (const v of poly.vertices) {
          if (typeof v.x !== 'number' || typeof v.y !== 'number') {
            return { rejected: true, reason: 'coordinate_polygon_bad_vertex' }
          }
        }
      }
    }
  }

  // Numberline requires min/max
  if (graphData.type === 'numberline') {
    if (typeof graphData.min !== 'number' || typeof graphData.max !== 'number') {
      return { rejected: true, reason: 'numberline_missing_range' }
    }
    if (graphData.min >= graphData.max) {
      return { rejected: true, reason: 'numberline_invalid_range' }
    }
  }

  // Shape requires supported shape value
  if (graphData.type === 'shape') {
    if (!SUPPORTED_SHAPES.includes(graphData.shape)) {
      return { rejected: true, reason: `unsupported_shape:${graphData.shape}` }
    }
    // If secondShape exists, it must also be supported. If not, drop it (don't reject whole thing).
    if (graphData.secondShape && !SUPPORTED_SHAPES.includes(graphData.secondShape.shape)) {
      delete graphData.secondShape
    }
  }

  // Label-coverage check: accept if at least half of mentioned labels are present.
  // Circle labels come from `center` + `pointsOnCircle[].label`, not `labels`.
  if (graphData.type === 'shape') {
    const mentioned = extractMentionedLabels(question)
    if (mentioned.length > 0) {
      const graphLabels = graphData.labels || []
      const secondLabels = (graphData.secondShape && graphData.secondShape.labels) || []
      const circleLabels = []
      if (typeof graphData.center === 'string') circleLabels.push(graphData.center)
      if (Array.isArray(graphData.pointsOnCircle)) {
        for (const p of graphData.pointsOnCircle) {
          if (p && typeof p.label === 'string') circleLabels.push(p.label)
        }
      }
      const allLabels = new Set([...graphLabels, ...secondLabels, ...circleLabels])
      const missingCount = mentioned.filter(l => !allLabels.has(l)).length
      if (missingCount > mentioned.length / 2) {
        return { rejected: true, reason: `labels_mismatch:mentioned=${mentioned.join('')},graph=${[...allLabels].join('')}` }
      }
    }
  }

  return graphData
}

/** Heuristic: does this question text appear to need a visual? */
const FIGURE_HINT = /グラフ|図形|三角形|四角形|長方形|平行四辺形|ひし形|菱形|台形|円|直線|数直線|座標|半径|直径|傾き|切片|頂点|一次関数|二次関数|放物線|合同|相似/
export function questionLooksVisual(question) {
  return FIGURE_HINT.test(question || '')
}
