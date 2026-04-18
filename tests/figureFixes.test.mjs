// Regression coverage for the figure-rendering bugs patched after
// tester feedback. Items 1-6 came from the first round (triangles,
// parallelograms, coord ranges, full-width minus). Items 7-9 came
// from the follow-up round (answer integrity / figure integrity):
//   7. Angle values (角ABC=50°) must not leak into sides as "50cm"
//   8. Parallelogram "対角" questions must not have both ∠A=∠C AND
//      ∠B=∠D in choices (both are true → multiple correct answers)
//   9. exterior_angle figures must include a labelled D extension point
import assert from 'node:assert/strict'
import {
  normalizeMathText,
  isBeingAsked,
  sanitizeGraphData,
} from '../api/generate.js'
import { validateQuestionObject } from '../lib/questionValidator.js'
import { buildGraphFromSpec } from '../lib/buildGraphFromSpec.js'
import {
  computeTriangleVertices,
  distributePointsOnCircle,
} from '../frontend/src/lib/graphGeometry.js'
import { validateGraphData } from '../frontend/src/lib/graphValidator.js'

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

  // ── Issue 7: angle values must not leak into sides slot ────────────
  {
    name: 'sanitizeGraphData: 角ABC=50° does NOT leak as sides[i]="50cm"',
    fn: async () => {
      // Realistic Stage-2 misread: question talks about an angle,
      // Stage-2 put the 50 into sides[1] as "50cm".
      const q = '平行四辺形ABCDにおいて、角ABC=50°のとき、角ADCの大きさを求めなさい。'
      const gd = {
        type: 'shape', shape: 'parallelogram',
        labels: ['A', 'B', 'C', 'D'],
        sides: [null, '50cm', null, null],
      }
      sanitizeGraphData(q, gd)
      assert.strictEqual(gd.sides[1], null,
        'BC=50cm must be nulled because 50 only appears as an angle')
    },
  },
  {
    name: 'sanitizeGraphData: ∠ABC=50° variant also nulls sides leak',
    fn: async () => {
      const q = '平行四辺形ABCDで ∠ABC=50°。∠ADCの大きさを求めなさい。'
      const gd = {
        type: 'shape', shape: 'parallelogram',
        labels: ['A', 'B', 'C', 'D'],
        sides: [null, '50cm', null, null],
      }
      sanitizeGraphData(q, gd)
      assert.strictEqual(gd.sides[1], null)
    },
  },
  {
    name: 'sanitizeGraphData: legitimate AB=8cm is kept (not nulled by verifier)',
    fn: async () => {
      const q = '平行四辺形ABCDで AB=8cm、BC=5cm。'
      const gd = {
        type: 'shape', shape: 'parallelogram',
        labels: ['A', 'B', 'C', 'D'],
        sides: ['8cm', '5cm', '8cm', '5cm'], // CD/DA inferred via parallel-pair
      }
      sanitizeGraphData(q, gd)
      // All four must be preserved: AB/BC direct, CD/DA via parallel pair.
      assert.deepStrictEqual(gd.sides, ['8cm', '5cm', '8cm', '5cm'])
    },
  },

  // ── Issue 8: multiple-valid parallelogram opposite-angle choices ───
  {
    name: 'validator flags multiple_valid_opposite_angles when both A=C and B=D appear',
    fn: async () => {
      const q = {
        question: '平行四辺形ABCDにおいて、対角に関して正しいものはどれか。',
        choices: ['∠A=∠C', '∠A=∠B', '∠B=∠D', '∠A=∠D'],
        correctIndex: 0,
        correctAnswer: '∠A=∠C',
        explanation: '平行四辺形の対角は等しいので∠A=∠C。',
      }
      const v = validateQuestionObject(q)
      assert.ok(v.errors.includes('multiple_valid_opposite_angles'),
        `expected multiple_valid_opposite_angles, got ${v.errors.join(',')}`)
    },
  },
  {
    name: 'validator passes when only ONE opposite-angle choice is present',
    fn: async () => {
      const q = {
        question: '平行四辺形ABCDにおいて、対角に関して正しいものはどれか。',
        choices: ['∠A=∠C', '∠A=∠B', '∠A+∠B=180°', '∠A=∠D'],
        correctIndex: 0,
        correctAnswer: '∠A=∠C',
        explanation: '平行四辺形の対角は等しいので∠A=∠C。',
      }
      const v = validateQuestionObject(q)
      assert.ok(!v.errors.includes('multiple_valid_opposite_angles'),
        `no ambiguity expected, got ${v.errors.join(',')}`)
    },
  },
  {
    name: 'validator does NOT flag when question is not about parallelogram 対角',
    fn: async () => {
      // Question mentions 平行四辺形 but NOT 対角 — rule must not fire
      const q = {
        question: '平行四辺形ABCDで、正しいものはどれか。',
        choices: ['∠A=∠C', '∠B=∠D', 'AB=CD', 'BC=DA'],
        correctIndex: 2,
        correctAnswer: 'AB=CD',
        explanation: '',
      }
      const v = validateQuestionObject(q)
      assert.ok(!v.errors.includes('multiple_valid_opposite_angles'))
    },
  },

  // ── Issue 9: exterior_angle figure includes D extension point ──────
  {
    name: 'buildGraphFromSpec exterior_angle attaches extensions with D',
    fn: async () => {
      const spec = { problemType: 'exterior_angle', given: { angleA: 40, angleB: 70 } }
      const gd = buildGraphFromSpec(spec)
      assert.ok(gd, 'graphData should be built')
      assert.strictEqual(gd.shape, 'triangle')
      assert.ok(Array.isArray(gd.extensions), 'extensions array must exist')
      assert.strictEqual(gd.extensions.length, 1)
      const e = gd.extensions[0]
      assert.strictEqual(e.through, 'BC', 'line must go through BC')
      assert.strictEqual(e.beyond, 'C', 'D is beyond C')
      assert.strictEqual(e.label, 'D')
    },
  },
  {
    name: 'buildGraphFromSpec triangle_angle_sum does NOT include extensions',
    fn: async () => {
      const spec = { problemType: 'triangle_angle_sum', given: { angleA: 40, angleB: 70 } }
      const gd = buildGraphFromSpec(spec)
      assert.ok(gd)
      assert.strictEqual(gd.extensions, undefined,
        'only exterior_angle should carry extensions')
    },
  },

  // ── Issue 10: circle O/A/B labels ──────────────────────────────────
  {
    name: 'distributePointsOnCircle: single point auto-lands at top (90°)',
    fn: async () => {
      const out = distributePointsOnCircle([{ label: 'A', angle: null }], 100, 100, 50)
      assert.strictEqual(out.length, 1)
      // 90° → x = cx (cos90=0), y = cy - r (sin90=1)
      assert.ok(Math.abs(out[0].x - 100) < 0.01, `expected x≈100, got ${out[0].x}`)
      assert.ok(Math.abs(out[0].y - 50) < 0.01, `expected y≈50, got ${out[0].y}`)
      assert.strictEqual(out[0].label, 'A')
    },
  },
  {
    name: 'distributePointsOnCircle: 3 auto points spread evenly',
    fn: async () => {
      const out = distributePointsOnCircle(
        [{ label: 'A', angle: null }, { label: 'B', angle: null }, { label: 'C', angle: null }],
        100, 100, 50,
      )
      assert.strictEqual(out.length, 3)
      // All should sit on the circle
      for (const p of out) {
        const d = Math.hypot(p.x - 100, p.y - 100)
        assert.ok(Math.abs(d - 50) < 0.01, `point ${p.label} not on circle: d=${d}`)
      }
      // A is top, B sweeps clockwise ~120°, C ~240°
      const ya = out[0].y, yb = out[1].y, yc = out[2].y
      assert.ok(ya < yb && ya < yc, 'A should be highest (smallest y)')
    },
  },
  {
    name: 'distributePointsOnCircle: explicit angle overrides auto',
    fn: async () => {
      const out = distributePointsOnCircle([{ label: 'A', angle: 0 }], 100, 100, 50)
      // angle=0 → x = cx+r, y = cy
      assert.ok(Math.abs(out[0].x - 150) < 0.01)
      assert.ok(Math.abs(out[0].y - 100) < 0.01)
    },
  },
  {
    name: 'distributePointsOnCircle: empty/null returns empty array',
    fn: async () => {
      assert.deepStrictEqual(distributePointsOnCircle([], 100, 100, 50), [])
      assert.deepStrictEqual(distributePointsOnCircle(null, 100, 100, 50), [])
    },
  },
  {
    name: 'graphValidator accepts circle with center + pointsOnCircle',
    fn: async () => {
      const gd = {
        type: 'shape', shape: 'circle',
        center: 'O',
        pointsOnCircle: [{ label: 'A', angle: null }, { label: 'B', angle: null }],
        chord: { from: 'A', to: 'B' },
      }
      const v = validateGraphData('中心Oの円で、円周上の点A, Bを結ぶ弦の長さを求めなさい。', gd)
      assert.ok(v && !v.rejected, `rejected: ${v?.reason}`)
    },
  },
  {
    name: 'graphValidator label-coverage uses circle labels (not just `labels`)',
    fn: async () => {
      // O, A, B are ONLY in center + pointsOnCircle. Without our fix
      // this would reject as labels_mismatch because graphData.labels is empty.
      const gd = {
        type: 'shape', shape: 'circle',
        labels: null,
        center: 'O',
        pointsOnCircle: [{ label: 'A', angle: null }, { label: 'B', angle: null }],
      }
      const v = validateGraphData('中心Oの円で、点A, 点Bが円周上にある。', gd)
      assert.ok(v && !v.rejected, `circle labels should satisfy coverage: ${v?.reason}`)
    },
  },

  // ── Issue 11: coordinate polygons (parallelogram on coord plane) ───
  {
    name: 'graphValidator accepts coordinate polygon',
    fn: async () => {
      const gd = {
        type: 'coordinate',
        range: 5,
        polygons: [{
          vertices: [
            { x: 0, y: 0, label: 'A' },
            { x: 3, y: 0, label: 'B' },
            { x: 5, y: 2, label: 'C' },
            { x: 2, y: 2, label: 'D' },
          ],
          label: '平行四辺形ABCD',
        }],
      }
      const v = validateGraphData('A(0,0), B(3,0), C(5,2), D(2,2)を頂点とする平行四辺形。', gd)
      assert.ok(v && !v.rejected, `rejected: ${v?.reason}`)
    },
  },
  {
    name: 'graphValidator rejects coordinate with ONLY an empty polygon',
    fn: async () => {
      const gd = {
        type: 'coordinate',
        range: 5,
        polygons: [{ vertices: [{ x: 0, y: 0, label: 'A' }], label: null }],
      }
      const v = validateGraphData('', gd)
      assert.ok(v && v.rejected, 'a 1-vertex polygon must be rejected')
      assert.strictEqual(v.reason, 'coordinate_polygon_too_few_vertices')
    },
  },
  {
    name: 'sanitizeGraphData expands coordinate range to fit polygon vertices',
    fn: async () => {
      const gd = {
        type: 'coordinate',
        range: 3, // too tight for a vertex at (6, 2)
        polygons: [{
          vertices: [
            { x: 0, y: 0, label: 'A' },
            { x: 6, y: 0, label: 'B' },
            { x: 6, y: 2, label: 'C' },
            { x: 0, y: 2, label: 'D' },
          ],
          label: null,
        }],
      }
      sanitizeGraphData('', gd)
      assert.ok(gd.range >= 7, `range should expand to fit (6,2), got ${gd.range}`)
      assert.ok(gd.range <= 8, `range should still cap at 8, got ${gd.range}`)
    },
  },
]
