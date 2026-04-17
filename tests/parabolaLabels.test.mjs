// Verifies that the parabola-label placement logic produces distinct
// coordinates for multiple curves sharing the same vertex (y=-3x² & y=-x²).
// Mirrors the algorithm in frontend/src/components/MathGraph.jsx.
import assert from 'node:assert/strict'

function computeLabelAnchors(curves, range) {
  const n = curves.length
  return curves.map((curve, i) => {
    const { a, b = 0, c = 0 } = curve
    if (!a) return null
    const span = range * 0.7
    const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1
    const sampleX = t * span
    const sampleY = a * sampleX * sampleX + b * sampleX + c
    return { x: sampleX, y: sampleY, labelY: -6 - i * 12 }
  })
}

export default [
  {
    name: 'parabolas y=-3x² and y=-x² get distinct label anchors',
    fn: async () => {
      const curves = [
        { a: -3, b: 0, c: 0, label: 'y=-3x²' },
        { a: -1, b: 0, c: 0, label: 'y=-x²' },
      ]
      const anchors = computeLabelAnchors(curves, 5)
      assert.strictEqual(anchors.length, 2)
      // x anchors must differ (-span vs +span)
      assert.notStrictEqual(anchors[0].x, anchors[1].x)
      const dx = Math.abs(anchors[0].x - anchors[1].x)
      assert.ok(dx >= 5, `labels should be spaced, got dx=${dx}`)
    },
  },
  {
    name: 'single parabola label anchor falls at x=0 (vertex)',
    fn: async () => {
      const anchors = computeLabelAnchors([{ a: 2, b: 0, c: 0 }], 5)
      assert.strictEqual(anchors[0].x, 0)
    },
  },
  {
    name: 'three parabolas produce three distinct x anchors',
    fn: async () => {
      const anchors = computeLabelAnchors(
        [{ a: 1 }, { a: 2 }, { a: -1 }], 5
      )
      const xs = anchors.map(a => a.x)
      assert.strictEqual(new Set(xs).size, 3)
    },
  },
]
