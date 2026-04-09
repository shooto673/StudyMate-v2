// MathGraph - SVG-based graph/figure renderer for math quiz questions
// Renders coordinate planes, linear graphs, shapes, and number lines

// Parse angle string like "35°" or "90" to number
function parseAngle(a) {
  if (a === null || a === undefined) return null
  const m = String(a).match(/(\d+(?:\.\d+)?)/)
  return m ? parseFloat(m[1]) : null
}

// Compute triangle vertices proportional to actual side lengths using law of cosines
function computeTriangleVertices(sides, W, H, pad) {
  if (!sides) return null
  const nums = sides.map(s => {
    if (!s) return null
    const m = String(s).match(/([\d.]+)/)
    return m ? parseFloat(m[1]) : null
  })
  // sides[0]=AB (vertex0→1), sides[1]=BC (vertex1→2), sides[2]=CA (vertex2→0)
  const [ab, bc, ca] = nums
  if (!ab || !bc || !ca) return null
  // Validate triangle inequality
  if (ab + bc <= ca || ab + ca <= bc || bc + ca <= ab) return null

  // Place B at origin, C at (bc, 0)
  // Use law of cosines to find A
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

// Compute triangle vertices from angles using law of sines (for angle-only problems)
function computeTriangleFromAngles(angles, W, H, pad) {
  if (!angles || angles.length !== 3) return null
  const parsed = angles.map(parseAngle)
  const known = parsed.filter(x => x !== null)
  if (known.length < 2) return null
  // Fill in the missing angle if exactly 2 known (sum = 180)
  let [A, B, C] = parsed
  if (A === null) A = 180 - (B || 0) - (C || 0)
  if (B === null) B = 180 - (A || 0) - (C || 0)
  if (C === null) C = 180 - (A || 0) - (B || 0)
  if (A <= 0 || B <= 0 || C <= 0 || A >= 180 || B >= 180 || C >= 180) return null

  // Law of sines: a/sin(A) = b/sin(B) = c/sin(C)
  // Assign side BC=a, CA=b, AB=c with a=1 for reference
  const sinA = Math.sin(A * Math.PI / 180)
  const sinB = Math.sin(B * Math.PI / 180)
  const sinC = Math.sin(C * Math.PI / 180)
  const a = 1
  const b = sinB / sinA
  const c = sinC / sinA

  // Place B at origin, C at (a, 0), compute A using angle B
  const cosB = Math.cos(B * Math.PI / 180)
  const sinBrad = Math.sin(B * Math.PI / 180)
  const raw = [
    { x: c * cosB, y: c * sinBrad }, // A
    { x: 0, y: 0 },                   // B
    { x: a, y: 0 },                   // C
  ]

  return fitAndCenter(raw, W, H, pad)
}

// Scale and center raw vertices to fit inside the SVG canvas
function fitAndCenter(raw, W, H, pad) {
  const xs = raw.map(v => v.x), ys = raw.map(v => v.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const rawW = maxX - minX || 1, rawH = maxY - minY || 1
  const drawW = W - pad * 2 - 20, drawH = H - pad * 2 - 20
  const scale = Math.min(drawW / rawW, drawH / rawH)

  return raw.map(v => ({
    x: pad + 10 + (v.x - minX) * scale + (drawW - rawW * scale) / 2,
    y: H - pad - 10 - (v.y - minY) * scale - (drawH - rawH * scale) / 2,
  }))
}

// Compute dynamic label positions pushed away from centroid
function dynamicLabelOffsets(vertices) {
  const centX = vertices.reduce((s, v) => s + v.x, 0) / vertices.length
  const centY = vertices.reduce((s, v) => s + v.y, 0) / vertices.length
  return vertices.map(v => {
    const dx = v.x - centX, dy = v.y - centY
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    return { x: v.x + (dx / dist) * 16, y: v.y + (dy / dist) * 16 }
  })
}

// Compute side label positions at midpoints, pushed outward
function dynamicSideOffsets(vertices, count) {
  const centX = vertices.reduce((s, v) => s + v.x, 0) / vertices.length
  const centY = vertices.reduce((s, v) => s + v.y, 0) / vertices.length
  return Array.from({ length: count }, (_, i) => {
    const v1 = vertices[i], v2 = vertices[(i + 1) % vertices.length]
    const midX = (v1.x + v2.x) / 2, midY = (v1.y + v2.y) / 2
    const dx = midX - centX, dy = midY - centY
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    return { x: midX + (dx / dist) * 16, y: midY + (dy / dist) * 16 }
  })
}

export default function MathGraph({ graphData }) {
  if (!graphData || !graphData.type) return null

  // Handle triangle pairs (congruence/similarity): render two shapes side by side
  if (graphData.secondShape && graphData.secondShape.shape) {
    const { secondShape, ...firstData } = graphData
    const secondData = { type: 'shape', ...secondShape }
    const isCongruent = graphData.type === 'shape' && graphData.shape === secondShape.shape
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        <MathGraph graphData={firstData} />
        <div style={{ fontSize: 28, color: '#6C63FF', fontWeight: 700, padding: '0 2px' }}>
          {isCongruent ? '≅' : '∽'}
        </div>
        <MathGraph graphData={secondData} />
      </div>
    )
  }

  const W = 280
  const H = 220
  const pad = 40
  const cx = W / 2
  const cy = H / 2

  if (graphData.type === 'coordinate') {
    const range = graphData.range || 5
    const scale = (Math.min(W, H) - pad * 2) / (range * 2)
    const toX = (x) => cx + x * scale
    const toY = (y) => cy - y * scale

    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', margin: '0 auto' }}>
        {/* Grid */}
        {Array.from({ length: range * 2 + 1 }, (_, i) => i - range).map(v => (
          <g key={v}>
            <line x1={toX(v)} y1={pad} x2={toX(v)} y2={H - pad} stroke="#e5e7eb" strokeWidth={0.5} />
            <line x1={pad} y1={toY(v)} x2={W - pad} y2={toY(v)} stroke="#e5e7eb" strokeWidth={0.5} />
          </g>
        ))}
        {/* Axes */}
        <line x1={pad} y1={cy} x2={W - pad} y2={cy} stroke="#1a1a2e" strokeWidth={1.5} />
        <line x1={cx} y1={pad} x2={cx} y2={H - pad} stroke="#1a1a2e" strokeWidth={1.5} />
        <text x={W - pad + 8} y={cy + 4} fontSize={12} fill="#6b7280" fontWeight={600}>x</text>
        <text x={cx + 6} y={pad - 8} fontSize={12} fill="#6b7280" fontWeight={600}>y</text>
        <text x={cx + 4} y={cy + 14} fontSize={10} fill="#9ca3af">O</text>
        {/* Tick marks - only show every other tick if range > 6 */}
        {Array.from({ length: range * 2 + 1 }, (_, i) => i - range).filter(v => v !== 0).filter(v => range <= 6 || v % 2 === 0).map(v => (
          <g key={`tick-${v}`}>
            <line x1={toX(v)} y1={cy - 3} x2={toX(v)} y2={cy + 3} stroke="#1a1a2e" strokeWidth={1} />
            <text x={toX(v)} y={cy + 16} fontSize={range <= 6 ? 10 : 8} fill="#9ca3af" textAnchor="middle">{v}</text>
            <line x1={cx - 3} y1={toY(v)} x2={cx + 3} y2={toY(v)} stroke="#1a1a2e" strokeWidth={1} />
            <text x={cx - 14} y={toY(v) + 4} fontSize={range <= 6 ? 10 : 8} fill="#9ca3af" textAnchor="middle">{v}</text>
          </g>
        ))}
        {/* Lines */}
        {(graphData.lines || []).map((line, i) => {
          const colors = ['#6C63FF', '#FF6B6B', '#51CF66', '#FF922B']
          const color = colors[i % colors.length]
          const x1 = -range, x2 = range
          const y1 = line.slope * x1 + (line.intercept || 0)
          const y2 = line.slope * x2 + (line.intercept || 0)
          // Position label at a visible point on the line
          const labelX = Math.min(range - 1, 2)
          const labelY = line.slope * labelX + (line.intercept || 0)
          return (
            <g key={`line-${i}`}>
              <line
                x1={toX(x1)} y1={toY(y1)} x2={toX(x2)} y2={toY(y2)}
                stroke={color} strokeWidth={2.5} strokeLinecap="round"
                clipPath="url(#graphClip)"
              />
              {line.label && (
                <text x={toX(labelX) + 4} y={toY(labelY) - 10}
                  fontSize={10} fill={color} fontWeight={700}>{line.label}</text>
              )}
            </g>
          )
        })}
        {/* Points */}
        {(graphData.points || []).map((pt, i) => (
          <g key={`pt-${i}`}>
            <circle cx={toX(pt.x)} cy={toY(pt.y)} r={4} fill="#FF6B6B" stroke="#fff" strokeWidth={1.5} />
            {pt.label && (
              <text x={toX(pt.x) + 8} y={toY(pt.y) - 8} fontSize={10} fill="#1a1a2e" fontWeight={600}>
                {pt.label}
              </text>
            )}
          </g>
        ))}
        <defs>
          <clipPath id="graphClip">
            <rect x={pad} y={pad} width={W - pad * 2} height={H - pad * 2} />
          </clipPath>
        </defs>
      </svg>
    )
  }

  if (graphData.type === 'numberline') {
    const min = graphData.min ?? -5
    const max = graphData.max ?? 5
    const range = max - min
    const lineY = H / 2
    const lineStart = pad
    const lineEnd = W - pad
    const lineLen = lineEnd - lineStart
    const toX = (v) => lineStart + ((v - min) / range) * lineLen

    return (
      <svg width={W} height={H * 0.5} viewBox={`0 0 ${W} ${H * 0.5}`} style={{ display: 'block', margin: '0 auto' }}>
        <line x1={lineStart} y1={lineY * 0.5} x2={lineEnd} y2={lineY * 0.5} stroke="#1a1a2e" strokeWidth={2} />
        <polygon points={`${lineEnd},${lineY * 0.5} ${lineEnd - 8},${lineY * 0.5 - 4} ${lineEnd - 8},${lineY * 0.5 + 4}`} fill="#1a1a2e" />
        <polygon points={`${lineStart},${lineY * 0.5} ${lineStart + 8},${lineY * 0.5 - 4} ${lineStart + 8},${lineY * 0.5 + 4}`} fill="#1a1a2e" />
        {Array.from({ length: range + 1 }, (_, i) => min + i).map(v => (
          <g key={v}>
            <line x1={toX(v)} y1={lineY * 0.5 - 5} x2={toX(v)} y2={lineY * 0.5 + 5} stroke="#1a1a2e" strokeWidth={1} />
            <text x={toX(v)} y={lineY * 0.5 + 18} fontSize={10} fill="#6b7280" textAnchor="middle">{v}</text>
          </g>
        ))}
        {(graphData.points || []).map((pt, i) => (
          <g key={`pt-${i}`}>
            <circle cx={toX(pt.value)} cy={lineY * 0.5} r={5} fill="#6C63FF" stroke="#fff" strokeWidth={1.5} />
            {pt.label && (
              <text x={toX(pt.value)} y={lineY * 0.5 - 12} fontSize={10} fill="#6C63FF" fontWeight={700} textAnchor="middle">{pt.label}</text>
            )}
          </g>
        ))}
      </svg>
    )
  }

  if (graphData.type === 'shape') {
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', margin: '0 auto' }}>
        {/* Triangle - proportional to side lengths (or angles as fallback) */}
        {graphData.shape === 'triangle' && (() => {
          const computed = computeTriangleVertices(graphData.sides, W, H, pad)
                        || computeTriangleFromAngles(graphData.angles, W, H, pad)
          const vertices = computed || [
            { x: cx, y: pad + 10 },
            { x: pad + 20, y: H - pad },
            { x: W - pad - 20, y: H - pad },
          ]
          const labelOffsets = dynamicLabelOffsets(vertices)
          const sideOffsets = dynamicSideOffsets(vertices, 3)

          // Angle arcs
          const angleArcs = (graphData.angles || []).map((angle, i) => {
            if (!angle) return null
            const v = vertices[i]
            const prev = vertices[(i + 2) % 3], next = vertices[(i + 1) % 3]
            const dx1 = prev.x - v.x, dy1 = prev.y - v.y
            const dx2 = next.x - v.x, dy2 = next.y - v.y
            const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)
            const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
            if (angle === '90°' || angle === '90') {
              const sq = 12
              const ux1 = dx1 / len1, uy1 = dy1 / len1
              const ux2 = dx2 / len2, uy2 = dy2 / len2
              return (
                <g key={`angle-${i}`}>
                  <path
                    d={`M ${v.x + ux1 * sq},${v.y + uy1 * sq} L ${v.x + ux1 * sq + ux2 * sq},${v.y + uy1 * sq + uy2 * sq} L ${v.x + ux2 * sq},${v.y + uy2 * sq}`}
                    fill="none" stroke="#FF922B" strokeWidth={1.5}
                  />
                </g>
              )
            }
            const r = 18
            const p1x = v.x + (dx1 / len1) * r, p1y = v.y + (dy1 / len1) * r
            const p2x = v.x + (dx2 / len2) * r, p2y = v.y + (dy2 / len2) * r
            return (
              <g key={`angle-${i}`}>
                <path d={`M ${p1x},${p1y} A ${r} ${r} 0 0 1 ${p2x},${p2y}`}
                  fill="none" stroke="#FF922B" strokeWidth={1.5} />
                <text x={v.x + ((dx1 / len1 + dx2 / len2) * 0.5) * 24}
                  y={v.y + ((dy1 / len1 + dy2 / len2) * 0.5) * 24}
                  fontSize={9} fill="#FF922B" fontWeight={600} textAnchor="middle">{angle}</text>
              </g>
            )
          })

          return (
            <g>
              <polygon points={vertices.map(v => `${v.x},${v.y}`).join(' ')}
                fill="none" stroke="#6C63FF" strokeWidth={2.5} />
              {graphData.labels?.map((lbl, i) => (
                <text key={i} x={labelOffsets[i]?.x} y={labelOffsets[i]?.y}
                  fontSize={12} fill="#1a1a2e" fontWeight={700} textAnchor="middle">{lbl}</text>
              ))}
              {graphData.sides?.map((side, i) => side ? (
                <text key={`s-${i}`} x={sideOffsets[i]?.x} y={sideOffsets[i]?.y}
                  fontSize={11} fill="#FF922B" fontWeight={600} textAnchor="middle">{side}</text>
              ) : null)}
              {angleArcs}
            </g>
          )
        })()}

        {/* Rectangle - with vertex labels and sides */}
        {graphData.shape === 'rectangle' && (() => {
          const rx = pad + 20, ry = pad + 20
          const rw = W - pad * 2 - 40, rh = H - pad * 2 - 40
          const vertices = [
            { x: rx, y: ry }, { x: rx + rw, y: ry },
            { x: rx + rw, y: ry + rh }, { x: rx, y: ry + rh },
          ]
          const labelOffsets = dynamicLabelOffsets(vertices)
          const sideOffsets = dynamicSideOffsets(vertices, 4)
          return (
            <g>
              <rect x={rx} y={ry} width={rw} height={rh} fill="none" stroke="#6C63FF" strokeWidth={2.5} />
              {graphData.labels?.map((lbl, i) => (
                <text key={i} x={labelOffsets[i]?.x} y={labelOffsets[i]?.y}
                  fontSize={12} fill="#1a1a2e" fontWeight={700} textAnchor="middle">{lbl}</text>
              ))}
              {graphData.sides?.map((side, i) => side ? (
                <text key={`s-${i}`} x={sideOffsets[i]?.x} y={sideOffsets[i]?.y}
                  fontSize={11} fill="#FF922B" fontWeight={600} textAnchor="middle">{side}</text>
              ) : null)}
              {/* Legacy width/height support */}
              {!graphData.sides && graphData.width && (
                <text x={cx} y={ry + rh + 18} fontSize={11} fill="#FF922B" fontWeight={600} textAnchor="middle">{graphData.width}</text>
              )}
              {!graphData.sides && graphData.height && (
                <text x={rx + rw + 16} y={cy} fontSize={11} fill="#FF922B" fontWeight={600} textAnchor="start">{graphData.height}</text>
              )}
            </g>
          )
        })()}

        {/* Rhombus */}
        {graphData.shape === 'rhombus' && (() => {
          const dx = (W - pad * 2) / 2 - 10
          const dy = (H - pad * 2) / 2 - 10
          const vertices = [
            { x: cx, y: cy - dy }, { x: cx + dx, y: cy },
            { x: cx, y: cy + dy }, { x: cx - dx, y: cy },
          ]
          const labelOffsets = dynamicLabelOffsets(vertices)
          return (
            <g>
              <polygon points={vertices.map(v => `${v.x},${v.y}`).join(' ')}
                fill="none" stroke="#6C63FF" strokeWidth={2.5} />
              {graphData.labels?.map((lbl, i) => (
                <text key={i} x={labelOffsets[i]?.x} y={labelOffsets[i]?.y}
                  fontSize={12} fill="#1a1a2e" fontWeight={700} textAnchor="middle">{lbl}</text>
              ))}
              {graphData.diagonals && (
                <>
                  <line x1={vertices[0].x} y1={vertices[0].y} x2={vertices[2].x} y2={vertices[2].y}
                    stroke="#FF922B" strokeWidth={1.2} strokeDasharray="4,3" />
                  <line x1={vertices[1].x} y1={vertices[1].y} x2={vertices[3].x} y2={vertices[3].y}
                    stroke="#FF922B" strokeWidth={1.2} strokeDasharray="4,3" />
                  {graphData.diagonals[0] && (
                    <text x={cx + 8} y={cy - dy / 2} fontSize={10} fill="#FF922B" fontWeight={600}>{graphData.diagonals[0]}</text>
                  )}
                  {graphData.diagonals[1] && (
                    <text x={cx + dx / 2 + 4} y={cy - 8} fontSize={10} fill="#FF922B" fontWeight={600}>{graphData.diagonals[1]}</text>
                  )}
                </>
              )}
            </g>
          )
        })()}

        {/* Parallelogram - with sides array */}
        {graphData.shape === 'parallelogram' && (() => {
          const skew = 30
          const rx = pad + 20 + skew, ry = pad + 20
          const rw = W - pad * 2 - 40 - skew, rh = H - pad * 2 - 40
          const vertices = [
            { x: rx, y: ry }, { x: rx + rw, y: ry },
            { x: rx + rw - skew, y: ry + rh }, { x: rx - skew, y: ry + rh },
          ]
          const labelOffsets = dynamicLabelOffsets(vertices)
          const sideOffsets = dynamicSideOffsets(vertices, 4)
          return (
            <g>
              <polygon points={vertices.map(v => `${v.x},${v.y}`).join(' ')}
                fill="none" stroke="#6C63FF" strokeWidth={2.5} />
              {graphData.labels?.map((lbl, i) => (
                <text key={i} x={labelOffsets[i]?.x} y={labelOffsets[i]?.y}
                  fontSize={12} fill="#1a1a2e" fontWeight={700} textAnchor="middle">{lbl}</text>
              ))}
              {graphData.sides?.map((side, i) => side ? (
                <text key={`s-${i}`} x={sideOffsets[i]?.x} y={sideOffsets[i]?.y}
                  fontSize={11} fill="#FF922B" fontWeight={600} textAnchor="middle">{side}</text>
              ) : null)}
              {/* Legacy width/height support */}
              {!graphData.sides && graphData.width && (
                <text x={(vertices[2].x + vertices[3].x) / 2} y={ry + rh + 18}
                  fontSize={11} fill="#FF922B" fontWeight={600} textAnchor="middle">{graphData.width}</text>
              )}
              {!graphData.sides && graphData.height && (
                <text x={rx + rw + 8} y={cy}
                  fontSize={11} fill="#FF922B" fontWeight={600} textAnchor="start">{graphData.height}</text>
              )}
            </g>
          )
        })()}

        {/* Circle */}
        {graphData.shape === 'circle' && (
          <g>
            <circle cx={cx} cy={cy} r={70} fill="none" stroke="#6C63FF" strokeWidth={2.5} />
            {graphData.radius && (
              <>
                <line x1={cx} y1={cy} x2={cx + 70} y2={cy} stroke="#FF922B" strokeWidth={1.5} strokeDasharray="4,3" />
                <text x={cx + 35} y={cy - 8} fontSize={11} fill="#FF922B" fontWeight={600} textAnchor="middle">{graphData.radius}</text>
              </>
            )}
          </g>
        )}
      </svg>
    )
  }

  return null
}
