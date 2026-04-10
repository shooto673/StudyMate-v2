// Unit tests for the pure geometry helpers used by MathGraph.
import assert from 'assert'
import {
  parseAngle,
  parseSide,
  fitAndCenter,
  computeTriangleVertices,
  computeTriangleFromAngles,
  dynamicLabelOffsets,
  dynamicSideOffsets,
} from '../frontend/src/lib/graphGeometry.js'

const W = 280, H = 220, pad = 40

function approx(a, b, eps = 1e-6) {
  assert.ok(Math.abs(a - b) < eps, `expected ${a} ≈ ${b}`)
}

function insideCanvas(vs) {
  for (const v of vs) {
    assert.ok(v.x >= 0 && v.x <= W, `x=${v.x} out of canvas`)
    assert.ok(v.y >= 0 && v.y <= H, `y=${v.y} out of canvas`)
  }
}

export default [
  {
    name: 'parseAngle handles "35°", "90", null',
    fn: async () => {
      assert.strictEqual(parseAngle('35°'), 35)
      assert.strictEqual(parseAngle('90'), 90)
      assert.strictEqual(parseAngle(null), null)
      assert.strictEqual(parseAngle(undefined), null)
      assert.strictEqual(parseAngle(''), null)
    },
  },
  {
    name: 'parseSide handles "5cm", "7.5 m", null',
    fn: async () => {
      assert.strictEqual(parseSide('5cm'), 5)
      assert.strictEqual(parseSide('7.5 m'), 7.5)
      assert.strictEqual(parseSide(null), null)
      assert.strictEqual(parseSide(undefined), null)
    },
  },
  {
    name: 'computeTriangleVertices returns 3 vertices inside the canvas',
    fn: async () => {
      const vs = computeTriangleVertices(['3cm', '4cm', '5cm'], W, H, pad)
      assert.ok(vs, 'expected vertices')
      assert.strictEqual(vs.length, 3)
      insideCanvas(vs)
    },
  },
  {
    name: 'computeTriangleVertices respects side proportions (3-4-5 is a right triangle)',
    fn: async () => {
      // For a 3-4-5 triangle, the longest side (CA=5) should be the longest edge
      const vs = computeTriangleVertices(['3', '4', '5'], W, H, pad)
      const d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y)
      // Edges: AB=vs[0]-vs[1], BC=vs[1]-vs[2], CA=vs[2]-vs[0]
      const ab = d(vs[0], vs[1])
      const bc = d(vs[1], vs[2])
      const ca = d(vs[2], vs[0])
      // Check proportions (scaled but the ratios must match 3:4:5)
      const ratio = bc / ab
      approx(ratio, 4 / 3, 0.01)
      approx(ca / ab, 5 / 3, 0.01)
    },
  },
  {
    name: 'computeTriangleVertices returns null for invalid triangles',
    fn: async () => {
      assert.strictEqual(computeTriangleVertices(null, W, H, pad), null)
      assert.strictEqual(computeTriangleVertices(['1', '1', '10'], W, H, pad), null,
        'triangle inequality must reject 1-1-10')
      assert.strictEqual(computeTriangleVertices([null, null, null], W, H, pad), null)
      assert.strictEqual(computeTriangleVertices(['5cm', null, '5cm'], W, H, pad), null)
    },
  },
  {
    name: 'computeTriangleFromAngles handles "∠C=90°, ∠A=35°" right triangle',
    fn: async () => {
      const vs = computeTriangleFromAngles(['35°', null, '90°'], W, H, pad)
      assert.ok(vs, 'expected vertices for right triangle with 2 known angles')
      assert.strictEqual(vs.length, 3)
      insideCanvas(vs)
      // Sanity: the angle at vertex C (index 2) should be approximately 90°.
      // Vectors from C to A and C to B
      const ca = { x: vs[0].x - vs[2].x, y: vs[0].y - vs[2].y }
      const cb = { x: vs[1].x - vs[2].x, y: vs[1].y - vs[2].y }
      const dot = ca.x * cb.x + ca.y * cb.y
      const mag = Math.hypot(ca.x, ca.y) * Math.hypot(cb.x, cb.y)
      const cosAngle = dot / mag
      approx(cosAngle, 0, 0.02) // ~90° → cos ≈ 0
    },
  },
  {
    name: 'computeTriangleFromAngles requires at least 2 known angles',
    fn: async () => {
      assert.strictEqual(computeTriangleFromAngles(['60°', null, null], W, H, pad), null)
      assert.strictEqual(computeTriangleFromAngles(null, W, H, pad), null)
      assert.strictEqual(computeTriangleFromAngles(['60°', '60°'], W, H, pad), null)
    },
  },
  {
    name: 'computeTriangleFromAngles rejects degenerate angle sums',
    fn: async () => {
      assert.strictEqual(computeTriangleFromAngles(['100°', '100°', null], W, H, pad), null)
      assert.strictEqual(computeTriangleFromAngles(['0°', '90°', '90°'], W, H, pad), null)
    },
  },
  {
    name: 'fitAndCenter keeps vertices inside the canvas with the expected pad',
    fn: async () => {
      const raw = [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 0, y: 4 },
      ]
      const vs = fitAndCenter(raw, W, H, pad)
      insideCanvas(vs)
    },
  },
  {
    name: 'dynamicLabelOffsets pushes each label outward from the centroid',
    fn: async () => {
      const vs = [{ x: 100, y: 50 }, { x: 50, y: 150 }, { x: 150, y: 150 }]
      const offs = dynamicLabelOffsets(vs)
      const centX = (100 + 50 + 150) / 3
      const centY = (50 + 150 + 150) / 3
      for (let i = 0; i < 3; i++) {
        const origDist = Math.hypot(vs[i].x - centX, vs[i].y - centY)
        const newDist = Math.hypot(offs[i].x - centX, offs[i].y - centY)
        assert.ok(newDist > origDist, `label ${i} should move outward`)
      }
    },
  },
  {
    name: 'dynamicSideOffsets produces count positions',
    fn: async () => {
      const vs = [
        { x: 50, y: 50 }, { x: 200, y: 50 },
        { x: 200, y: 150 }, { x: 50, y: 150 },
      ]
      const offs = dynamicSideOffsets(vs, 4)
      assert.strictEqual(offs.length, 4)
    },
  },
]
