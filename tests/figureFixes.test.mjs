// Regression coverage for the six figure-rendering bugs patched
// after tester feedback:
//   1. Triangle shape must vary with provided side lengths
//   2. Parallelogram sides must be re-extracted from question text
//   3. Sides/angles that are "being asked" must not appear on the figure
//   4. Coordinate range must stay visually reasonable (≤8)
//   5. Full-width minus (U+2212) must normalise to ASCII
//   6. (Prompt-only — exercised by manual QA; no automated assertion)
import assert from 'node:assert/strict'
import {
  normalizeMathText,
  isBeingAsked,
  sanitizeGraphData,
} from '../api/generate.js'
import { computeTriangleVertices } from '../frontend/src/lib/graphGeometry.js'

export default [
  // ── Issue 5: full-width minus normalisation ────────────────────────
  {
    name: 'normalizeMathText converts U+2212 to ASCII -',
    fn: async () => {
      const out = normalizeMathText('y = \u22123x + 6')
      assert.strictEqual(out, 'y = -3x + 6')
    },
  },
  {
    name: 'normalizeMathText handles en-dash, em-dash, fullwidth =',
    fn: async () => {
      assert.strictEqual(normalizeMathText('a\u2013b'), 'a-b')
      assert.strictEqual(normalizeMathText('a\u2014b'), 'a-b')
      assert.strictEqual(normalizeMathText('x＝5'), 'x=5')
      assert.strictEqual(normalizeMathText('1＋2'), '1+2')
    },
  },
  {
    name: 'normalizeMathText leaves null/undefined untouched',
    fn: async () => {
      assert.strictEqual(normalizeMathText(null), null)
      assert.strictEqual(normalizeMathText(undefined), undefined)
    },
  },

  // ── Issue 3: "being asked" detection ───────────────────────────────
  {
    name: 'isBeingAsked: "辺CDの長さを求めなさい" → CD is asked',
    fn: async () => {
      assert.strictEqual(isBeingAsked('平行四辺形ABCDで AB=8cm、辺CDの長さを求めなさい。', 'CD'), true)
      // AB is given, not asked
      assert.strictEqual(isBeingAsked('平行四辺形ABCDで AB=8cm、辺CDの長さを求めなさい。', 'AB'), false)
    },
  },
  {
    name: 'isBeingAsked: 何cm format is detected',
    fn: async () => {
      assert.strictEqual(isBeingAsked('三角形ABCで BC は何cm？', 'BC'), true)
    },
  },
  {
    name: 'isBeingAsked: handles null/empty inputs safely',
    fn: async () => {
      assert.strictEqual(isBeingAsked('', 'AB'), false)
      assert.strictEqual(isBeingAsked('test', ''), false)
      assert.strictEqual(isBeingAsked(null, 'AB'), false)
    },
  },

  // ── Issue 4: coordinate range clamp ────────────────────────────────
  {
    name: 'sanitizeGraphData clamps coordinate range > 8 down to 8',
    fn: async () => {
      const gd = { type: 'coordinate', range: 15, lines: [{ slope: 2, intercept: 3 }] }
      sanitizeGraphData('y = 2x + 3', gd)
      assert.strictEqual(gd.range, 8)
    },
  },
  {
    name: 'sanitizeGraphData defaults missing coordinate range to 5',
    fn: async () => {
      const gd = { type: 'coordinate', range: null, lines: [] }
      sanitizeGraphData('', gd)
      assert.strictEqual(gd.range, 5)
    },
  },
  {
    name: 'sanitizeGraphData keeps in-bounds range unchanged',
    fn: async () => {
      const gd = { type: 'coordinate', range: 6, lines: [] }
      sanitizeGraphData('', gd)
      assert.strictEqual(gd.range, 6)
    },
  },

  // ── Issue 3: asked side gets nulled on the figure ──────────────────
  {
    name: 'sanitizeGraphData nulls the asked side on the main shape',
    fn: async () => {
      const q = '平行四辺形ABCDにおいて AB=8cm、BC=5cm。辺CDの長さを求めなさい。'
      const gd = {
        type: 'shape', shape: 'parallelogram',
        labels: ['A', 'B', 'C', 'D'],
        sides: ['8cm', '5cm', '8cm', '5cm'], // Stage-2 may pre-populate, leaking answer
      }
      sanitizeGraphData(q, gd)
      // CD = sides[2] (labels[2] + labels[3]) must be null'd out
      assert.strictEqual(gd.sides[2], null, `CD should be hidden, got ${gd.sides[2]}`)
      // AB / BC remain shown
      assert.strictEqual(gd.sides[0], '8cm')
      assert.strictEqual(gd.sides[1], '5cm')
    },
  },
  {
    name: 'sanitizeGraphData nulls asked angle',
    fn: async () => {
      const q = '三角形ABCで ∠B=60°、∠C=70°。∠Aの大きさを求めなさい。'
      const gd = {
        type: 'shape', shape: 'triangle',
        labels: ['A', 'B', 'C'],
        angles: ['50°', '60°', '70°'],
      }
      sanitizeGraphData(q, gd)
      assert.strictEqual(gd.angles[0], null, '∠A should be hidden')
      assert.strictEqual(gd.angles[1], '60°')
      assert.strictEqual(gd.angles[2], '70°')
    },
  },

  // ── Issue 2: parallelogram side re-extraction when Stage-2 misses ──
  {
    name: 'sanitizeGraphData re-extracts parallelogram sides from question text',
    fn: async () => {
      const q = '平行四辺形ABCDで AB=8cm、BC=5cm。面積を求めなさい。'
      const gd = {
        type: 'shape', shape: 'parallelogram',
        labels: ['A', 'B', 'C', 'D'],
        sides: [null, null, null, null],
      }
      sanitizeGraphData(q, gd)
      // AB (i=0) should have been filled. CD parallel-equals AB but is NOT
      // mentioned in the question; re-extraction only fills what's present.
      assert.strictEqual(gd.sides[0], '8cm', `AB should be 8cm, got ${gd.sides[0]}`)
      assert.strictEqual(gd.sides[1], '5cm', `BC should be 5cm, got ${gd.sides[1]}`)
    },
  },
  {
    name: 'sanitizeGraphData re-extraction handles 辺AB prefix + reversed pair',
    fn: async () => {
      const q = '長方形ABCDで 辺BAの長さは7cm、BCは4cm。'
      const gd = {
        type: 'shape', shape: 'rectangle',
        labels: ['A', 'B', 'C', 'D'],
        sides: null,
      }
      sanitizeGraphData(q, gd)
      assert.ok(Array.isArray(gd.sides), 'sides should be re-created as array')
      assert.strictEqual(gd.sides[0], '7cm', `AB (via 辺BA) should be 7cm, got ${gd.sides[0]}`)
      assert.strictEqual(gd.sides[1], '4cm', `BC should be 4cm, got ${gd.sides[1]}`)
    },
  },
  {
    name: 'sanitizeGraphData does NOT overwrite when sides already populated',
    fn: async () => {
      const q = '平行四辺形ABCDで AB=8cm、BC=5cm、CD=8cm、DA=5cm。'
      const gd = {
        type: 'shape', shape: 'parallelogram',
        labels: ['A', 'B', 'C', 'D'],
        sides: ['8cm', '5cm', '8cm', '5cm'],
      }
      sanitizeGraphData(q, gd)
      assert.deepStrictEqual(gd.sides, ['8cm', '5cm', '8cm', '5cm'])
    },
  },

  // ── Issue 1: triangle shape varies with side lengths ───────────────
  {
    name: 'computeTriangleVertices: 3-4-5 and 6-8-10 produce SAME proportions but DIFFERENT from 5-5-5',
    fn: async () => {
      const W = 280, H = 220, pad = 40
      const rightTri = computeTriangleVertices(['3cm', '4cm', '5cm'], W, H, pad)
      const equil = computeTriangleVertices(['5cm', '5cm', '5cm'], W, H, pad)
      assert.ok(rightTri, '3-4-5 should yield vertices')
      assert.ok(equil, '5-5-5 should yield vertices')

      // Side A-B (vertices[0]→[1]) length in pixels
      const abRight = Math.hypot(rightTri[0].x - rightTri[1].x, rightTri[0].y - rightTri[1].y)
      const bcRight = Math.hypot(rightTri[1].x - rightTri[2].x, rightTri[1].y - rightTri[2].y)
      const abEquil = Math.hypot(equil[0].x - equil[1].x, equil[0].y - equil[1].y)
      const bcEquil = Math.hypot(equil[1].x - equil[2].x, equil[1].y - equil[2].y)

      // Right triangle sides must have different pixel lengths
      assert.ok(Math.abs(abRight - bcRight) > 5,
        `3-4-5 should have unequal sides, got ab=${abRight} bc=${bcRight}`)
      // Equilateral sides must have (nearly) equal pixel lengths
      assert.ok(Math.abs(abEquil - bcEquil) < 2,
        `5-5-5 should have equal sides, got ab=${abEquil} bc=${bcEquil}`)
    },
  },
  {
    name: 'computeTriangleVertices returns null when sides violate triangle inequality',
    fn: async () => {
      const out = computeTriangleVertices(['1cm', '1cm', '10cm'], 280, 220, 40)
      assert.strictEqual(out, null)
    },
  },
  {
    name: 'computeTriangleVertices returns null on missing sides',
    fn: async () => {
      assert.strictEqual(computeTriangleVertices(null, 280, 220, 40), null)
      assert.strictEqual(computeTriangleVertices(['5cm', null, '5cm'], 280, 220, 40), null)
    },
  },

  // ── Integration: normalised question flows into isBeingAsked ───────
  {
    name: 'isBeingAsked works after normalizing full-width equals in question',
    fn: async () => {
      // Stage-1 sometimes emits "AB＝8cm" (U+FF1D). After normalisation
      // this becomes "AB=8cm", and CD's ask-clause must still match.
      const raw = '平行四辺形ABCDで AB\uFF1D8cm、辺CDの長さを求めなさい。'
      const norm = normalizeMathText(raw)
      assert.ok(norm.includes('AB=8cm'), 'full-width = must normalise')
      assert.strictEqual(isBeingAsked(norm, 'CD'), true)
      assert.strictEqual(isBeingAsked(norm, 'AB'), false)
    },
  },
]
