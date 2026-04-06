// MathGraph - SVG-based graph/figure renderer for math quiz questions
// Renders coordinate planes, linear graphs, shapes, and number lines

export default function MathGraph({ graphData }) {
  if (!graphData || !graphData.type) return null

  const W = 280
  const H = 220
  const pad = 40
  const cx = W / 2
  const cy = H / 2

  if (graphData.type === 'coordinate') {
    // Coordinate plane with optional lines
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
        {/* Axis labels */}
        <text x={W - pad + 8} y={cy + 4} fontSize={12} fill="#6b7280" fontWeight={600}>x</text>
        <text x={cx + 6} y={pad - 8} fontSize={12} fill="#6b7280" fontWeight={600}>y</text>
        <text x={cx + 4} y={cy + 14} fontSize={10} fill="#9ca3af">O</text>
        {/* Tick marks */}
        {Array.from({ length: range * 2 + 1 }, (_, i) => i - range).filter(v => v !== 0).map(v => (
          <g key={`tick-${v}`}>
            <line x1={toX(v)} y1={cy - 3} x2={toX(v)} y2={cy + 3} stroke="#1a1a2e" strokeWidth={1} />
            <text x={toX(v)} y={cy + 16} fontSize={9} fill="#9ca3af" textAnchor="middle">{v}</text>
            <line x1={cx - 3} y1={toY(v)} x2={cx + 3} y2={toY(v)} stroke="#1a1a2e" strokeWidth={1} />
            <text x={cx - 12} y={toY(v) + 4} fontSize={9} fill="#9ca3af" textAnchor="middle">{v}</text>
          </g>
        ))}
        {/* Lines */}
        {(graphData.lines || []).map((line, i) => {
          const colors = ['#6C63FF', '#FF6B6B', '#51CF66', '#FF922B']
          const color = colors[i % colors.length]
          // Line: y = slope * x + intercept
          const x1 = -range
          const x2 = range
          const y1 = line.slope * x1 + (line.intercept || 0)
          const y2 = line.slope * x2 + (line.intercept || 0)
          return (
            <g key={`line-${i}`}>
              <line
                x1={toX(x1)} y1={toY(y1)} x2={toX(x2)} y2={toY(y2)}
                stroke={color} strokeWidth={2.5} strokeLinecap="round"
                clipPath="url(#graphClip)"
              />
              {line.label && (
                <text x={toX(x2 - 1)} y={toY(line.slope * (x2 - 1) + (line.intercept || 0)) - 8}
                  fontSize={11} fill={color} fontWeight={700}>{line.label}</text>
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
        {/* Arrow tips */}
        <polygon points={`${lineEnd},${lineY * 0.5} ${lineEnd - 8},${lineY * 0.5 - 4} ${lineEnd - 8},${lineY * 0.5 + 4}`} fill="#1a1a2e" />
        <polygon points={`${lineStart},${lineY * 0.5} ${lineStart + 8},${lineY * 0.5 - 4} ${lineStart + 8},${lineY * 0.5 + 4}`} fill="#1a1a2e" />
        {/* Ticks */}
        {Array.from({ length: range + 1 }, (_, i) => min + i).map(v => (
          <g key={v}>
            <line x1={toX(v)} y1={lineY * 0.5 - 5} x2={toX(v)} y2={lineY * 0.5 + 5} stroke="#1a1a2e" strokeWidth={1} />
            <text x={toX(v)} y={lineY * 0.5 + 18} fontSize={10} fill="#6b7280" textAnchor="middle">{v}</text>
          </g>
        ))}
        {/* Highlighted points */}
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
    // Render basic geometric shapes
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', margin: '0 auto' }}>
        {graphData.shape === 'triangle' && (() => {
          const vertices = [
            { x: cx, y: pad + 10 },        // top (A)
            { x: pad + 20, y: H - pad },    // bottom-left (B)
            { x: W - pad - 20, y: H - pad }, // bottom-right (C)
          ]
          const labelOffsets = [
            { x: cx, y: pad - 2 },
            { x: pad + 2, y: H - pad + 16 },
            { x: W - pad - 2, y: H - pad + 16 },
          ]
          const sideOffsets = [
            { x: cx - 50, y: cy - 20 },
            { x: cx, y: H - pad + 14 },
            { x: cx + 50, y: cy - 20 },
          ]
          // Generate angle arc paths
          const angleArcs = (graphData.angles || []).map((angle, i) => {
            if (!angle) return null
            const v = vertices[i]
            const prev = vertices[(i + 2) % 3]
            const next = vertices[(i + 1) % 3]
            // Vectors from vertex to adjacent vertices
            const dx1 = prev.x - v.x, dy1 = prev.y - v.y
            const dx2 = next.x - v.x, dy2 = next.y - v.y
            const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)
            const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
            const r = 18 // arc radius
            const p1x = v.x + (dx1 / len1) * r, p1y = v.y + (dy1 / len1) * r
            const p2x = v.x + (dx2 / len2) * r, p2y = v.y + (dy2 / len2) * r
            // For right angle (90°), draw a small square
            const isRight = angle === '90°' || angle === '90'
            if (isRight) {
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
              <polygon
                points={vertices.map(v => `${v.x},${v.y}`).join(' ')}
                fill="none" stroke="#6C63FF" strokeWidth={2.5}
              />
              {graphData.labels?.map((lbl, i) => (
                <text key={i} x={labelOffsets[i]?.x} y={labelOffsets[i]?.y}
                  fontSize={12} fill="#1a1a2e" fontWeight={700} textAnchor="middle">{lbl}</text>
              ))}
              {graphData.sides?.map((side, i) => (
                <text key={`s-${i}`} x={sideOffsets[i]?.x} y={sideOffsets[i]?.y}
                  fontSize={11} fill="#FF922B" fontWeight={600} textAnchor="middle">{side}</text>
              ))}
              {angleArcs}
            </g>
          )
        })()}
        {graphData.shape === 'rectangle' && (() => {
          const rx = pad + 20, ry = pad + 20
          const rw = W - pad * 2 - 40, rh = H - pad * 2 - 40
          const corners = [
            { x: rx, y: ry },           // top-left (A)
            { x: rx + rw, y: ry },      // top-right (B)
            { x: rx + rw, y: ry + rh }, // bottom-right (C)
            { x: rx, y: ry + rh },      // bottom-left (D)
          ]
          const labelPos = [
            { x: rx - 10, y: ry - 6 },
            { x: rx + rw + 10, y: ry - 6 },
            { x: rx + rw + 10, y: ry + rh + 16 },
            { x: rx - 10, y: ry + rh + 16 },
          ]
          return (
            <g>
              <rect x={rx} y={ry} width={rw} height={rh}
                fill="none" stroke="#6C63FF" strokeWidth={2.5} />
              {graphData.labels?.map((lbl, i) => (
                <text key={i} x={labelPos[i]?.x} y={labelPos[i]?.y}
                  fontSize={12} fill="#1a1a2e" fontWeight={700} textAnchor="middle">{lbl}</text>
              ))}
              {graphData.width && (
                <text x={cx} y={ry + rh + 16} fontSize={11} fill="#FF922B" fontWeight={600} textAnchor="middle">{graphData.width}</text>
              )}
              {graphData.height && (
                <text x={rx + rw + 14} y={cy} fontSize={11} fill="#FF922B" fontWeight={600} textAnchor="start">{graphData.height}</text>
              )}
            </g>
          )
        })()}
        {graphData.shape === 'rhombus' && (() => {
          // Diamond shape (rotated square)
          const dx = (W - pad * 2) / 2 - 10
          const dy = (H - pad * 2) / 2 - 10
          const vertices = [
            { x: cx, y: cy - dy },  // top
            { x: cx + dx, y: cy },  // right
            { x: cx, y: cy + dy },  // bottom
            { x: cx - dx, y: cy },  // left
          ]
          const labelPos = [
            { x: cx, y: cy - dy - 8 },
            { x: cx + dx + 12, y: cy + 4 },
            { x: cx, y: cy + dy + 16 },
            { x: cx - dx - 12, y: cy + 4 },
          ]
          return (
            <g>
              <polygon
                points={vertices.map(v => `${v.x},${v.y}`).join(' ')}
                fill="none" stroke="#6C63FF" strokeWidth={2.5}
              />
              {graphData.labels?.map((lbl, i) => (
                <text key={i} x={labelPos[i]?.x} y={labelPos[i]?.y}
                  fontSize={12} fill="#1a1a2e" fontWeight={700} textAnchor="middle">{lbl}</text>
              ))}
              {/* Diagonals */}
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
              {graphData.sides?.map((side, i) => {
                const midX = (vertices[i].x + vertices[(i + 1) % 4].x) / 2
                const midY = (vertices[i].y + vertices[(i + 1) % 4].y) / 2
                const offX = i === 0 ? 12 : i === 2 ? -12 : 0
                const offY = i === 1 ? 12 : i === 3 ? -12 : 0
                return side ? (
                  <text key={`s-${i}`} x={midX + offX} y={midY + offY}
                    fontSize={10} fill="#FF922B" fontWeight={600} textAnchor="middle">{side}</text>
                ) : null
              })}
            </g>
          )
        })()}
        {graphData.shape === 'parallelogram' && (() => {
          const skew = 30
          const rx = pad + 20 + skew, ry = pad + 20
          const rw = W - pad * 2 - 40 - skew, rh = H - pad * 2 - 40
          const vertices = [
            { x: rx, y: ry },               // top-left (A)
            { x: rx + rw, y: ry },           // top-right (B)
            { x: rx + rw - skew, y: ry + rh }, // bottom-right (C)
            { x: rx - skew, y: ry + rh },    // bottom-left (D)
          ]
          const labelPos = [
            { x: rx - 4, y: ry - 8 },
            { x: rx + rw + 4, y: ry - 8 },
            { x: rx + rw - skew + 4, y: ry + rh + 16 },
            { x: rx - skew - 4, y: ry + rh + 16 },
          ]
          return (
            <g>
              <polygon
                points={vertices.map(v => `${v.x},${v.y}`).join(' ')}
                fill="none" stroke="#6C63FF" strokeWidth={2.5}
              />
              {graphData.labels?.map((lbl, i) => (
                <text key={i} x={labelPos[i]?.x} y={labelPos[i]?.y}
                  fontSize={12} fill="#1a1a2e" fontWeight={700} textAnchor="middle">{lbl}</text>
              ))}
              {graphData.width && (
                <text x={(vertices[2].x + vertices[3].x) / 2} y={ry + rh + 16}
                  fontSize={11} fill="#FF922B" fontWeight={600} textAnchor="middle">{graphData.width}</text>
              )}
              {graphData.height && (
                <text x={rx + rw + 8} y={cy}
                  fontSize={11} fill="#FF922B" fontWeight={600} textAnchor="start">{graphData.height}</text>
              )}
            </g>
          )
        })()}
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
