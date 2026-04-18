// Pure geometry helpers for MathGraph rendering.
// Kept in a separate module so they can be unit-tested without React/JSX.

/** Parse an angle like "35°" or "90" or null. Returns number or null. */
export function parseAngle(a) {
  if (a === null || a === undefined) return null
  const m = String(a).match(/(\d+(?:\.\d+)?)/)
  return m ? parseFloat(m[1]) : null
}

/** Parse a side like "5cm", "7.5 m", "9" → number or null. */
export function parseSide(s) {
  if (s === null || s === undefined) return null
  const m = String(s).match(/([\d.]+)/)
  return m ? parseFloat(m[1]) : null
}

/** Scale and center raw vertices to fit inside the SVG canvas. */
export function fitAndCenter(raw, W, H, pad) {
  const xs = raw.map(v => v.x)
  const ys = raw.map(v => v.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const rawW = maxX - minX || 1
  const rawH = maxY - minY || 1
  const drawW = W - pad * 2 - 20
  const drawH = H - pad * 2 - 20
  const scale = Math.min(drawW / rawW, drawH / rawH)

  return raw.map(v => ({
    x: pad + 10 + (v.x - minX) * scale + (drawW - rawW * scale) / 2,
    y: H - pad - 10 - (v.y - minY) * scale - (drawH - rawH * scale) / 2,
  }))
}

/**
 * Compute triangle vertices from side lengths using law of cosines.
 * sides order: [AB, BC, CA] — edges between vertex pairs.
 * Returns null if sides are missing or fail the triangle inequality.
 */
export function computeTriangleVertices(sides, W, H, pad) {
  if (!sides || sides.length !== 3) return null
  const nums = sides.map(parseSide)
  const [ab, bc, ca] = nums
  if (!ab || !bc || !ca) return null
  if (ab + bc <= ca || ab + ca <= bc || bc + ca <= ab) return null

  // Place B at origin, C at (bc, 0). Use law of cosines to place A.
  const a = bc, b = ca, c = ab
  const cosB = (a * a + c * c - b * b) / (2 * a * c)
  const clampedCosB = Math.max(-1, Math.min(1, cosB))
  const sinB = Math.sqrt(1 - clampedCosB * clampedCosB)

  const raw = [
    { x: c * clampedCosB, y: c * sinB }, // A
    { x: 0, y: 0 },                       // B
    { x: a, y: 0 },                       // C
  ]
  return fitAndCenter(raw, W, H, pad)
}

/**
 * Compute triangle vertices from angle list using law of sines.
 * angles order: [∠A, ∠B, ∠C]. Accepts exactly 2 known angles (third inferred).
 * Returns null if angles are missing or invalid.
 */
export function computeTriangleFromAngles(angles, W, H, pad) {
  if (!angles || angles.length !== 3) return null
  const parsed = angles.map(parseAngle)
  const known = parsed.filter(x => x !== null)
  if (known.length < 2) return null

  let [A, B, C] = parsed
  if (A === null) A = 180 - (B || 0) - (C || 0)
  if (B === null) B = 180 - (A || 0) - (C || 0)
  if (C === null) C = 180 - (A || 0) - (B || 0)
  if (A <= 0 || B <= 0 || C <= 0) return null
  if (A >= 180 || B >= 180 || C >= 180) return null

  const sinA = Math.sin(A * Math.PI / 180)
  const sinB = Math.sin(B * Math.PI / 180)
  const sinC = Math.sin(C * Math.PI / 180)
  const a = 1
  const b = sinB / sinA
  const c = sinC / sinA

  const cosBrad = Math.cos(B * Math.PI / 180)
  const sinBrad = Math.sin(B * Math.PI / 180)
  const raw = [
    { x: c * cosBrad, y: c * sinBrad }, // A
    { x: 0, y: 0 },                      // B
    { x: a, y: 0 },                      // C
  ]
  return fitAndCenter(raw, W, H, pad)
}

/** Push labels away from centroid so they sit just outside the shape. */
export function dynamicLabelOffsets(vertices) {
  const centX = vertices.reduce((s, v) => s + v.x, 0) / vertices.length
  const centY = vertices.reduce((s, v) => s + v.y, 0) / vertices.length
  return vertices.map(v => {
    const dx = v.x - centX
    const dy = v.y - centY
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    return { x: v.x + (dx / dist) * 16, y: v.y + (dy / dist) * 16 }
  })
}

/**
 * Distribute labelled points around a circle.
 *   points: array of { label, angle? } — angle in DEGREES, measured CCW
 *           from +x axis. When angle is null/undefined, the point is
 *           auto-placed at an evenly-spaced slot starting from 90° (top)
 *           and sweeping clockwise so A is always "up".
 *   cx, cy, r: pixel center + radius of the rendered circle.
 *   labelOffset: how far outside the radius the text label sits.
 *
 * Returns array of { label, x, y, labelX, labelY }.
 * Kept in graphGeometry so MathGraph can stay declarative AND so we can
 * unit-test placement without rendering.
 */
export function distributePointsOnCircle(points, cx, cy, r, labelOffset = 14) {
  if (!Array.isArray(points) || points.length === 0) return []
  const n = points.length
  // Auto slots: top (90°) then clockwise at 360/n spacing, but skip any
  // slots that already exceed n placements so labels don't overlap.
  const autoSlots = []
  const step = 360 / n
  for (let i = 0; i < n; i++) autoSlots.push(90 - i * step)

  let autoIdx = 0
  return points.map((p) => {
    const hasAngle = typeof p.angle === 'number' && isFinite(p.angle)
    const angDeg = hasAngle ? p.angle : autoSlots[autoIdx++]
    const angRad = (angDeg * Math.PI) / 180
    // +x axis is to the right in SVG; y grows downward → negate sin.
    const x = cx + r * Math.cos(angRad)
    const y = cy - r * Math.sin(angRad)
    const labelX = cx + (r + labelOffset) * Math.cos(angRad)
    const labelY = cy - (r + labelOffset) * Math.sin(angRad)
    return { label: p.label, x, y, labelX, labelY }
  })
}

/** Side midpoint labels pushed outward from centroid. */
export function dynamicSideOffsets(vertices, count) {
  const centX = vertices.reduce((s, v) => s + v.x, 0) / vertices.length
  const centY = vertices.reduce((s, v) => s + v.y, 0) / vertices.length
  return Array.from({ length: count }, (_, i) => {
    const v1 = vertices[i]
    const v2 = vertices[(i + 1) % vertices.length]
    const midX = (v1.x + v2.x) / 2
    const midY = (v1.y + v2.y) / 2
    const dx = midX - centX
    const dy = midY - centY
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    return { x: midX + (dx / dist) * 16, y: midY + (dy / dist) * 16 }
  })
}
