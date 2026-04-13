// End-to-end fixture tests: walk canned graphData through the entire
// render-decision pipeline (validator → geometry) to prove the renderer
// would draw something. MathGraph.jsx itself has no hidden branching
// beyond these two gates, so this test is a reliable substitute for
// actually mounting React in Node.
import assert from 'assert'
import { validateGraphData } from '../frontend/src/lib/graphValidator.js'
import {
  computeTriangleVertices,
  computeTriangleFromAngles,
} from '../frontend/src/lib/graphGeometry.js'

const W = 280, H = 220, pad = 40

// Fixtures that mimic real AI output (post-stage-2 cleanup).
const FIXTURES = [
  {
    name: 'triangle-with-sides',
    question: '三角形ABCで、AB = 5cm、BC = 7cm、CA = 9cmのとき、面積を求めなさい。',
    graphData: {
      type: 'shape', shape: 'triangle',
      labels: ['A', 'B', 'C'],
      sides: ['5cm', '7cm', '9cm'],
    },
    expectVerticesVia: 'sides',
  },
  {
    name: 'right-triangle-angles-only',
    question: '直角三角形ABCで、∠C = 90°、∠A = 35°です。∠Bの大きさは何度ですか？',
    graphData: {
      type: 'shape', shape: 'triangle',
      labels: ['A', 'B', 'C'],
      angles: ['35°', null, '90°'],
    },
    expectVerticesVia: 'angles',
  },
  {
    name: 'isosceles-AB=AC=8',
    question: '二等辺三角形ABCで、AB = AC = 8cm、BC = 6cmのとき、面積を求めなさい。',
    graphData: {
      type: 'shape', shape: 'triangle',
      labels: ['A', 'B', 'C'],
      sides: ['8cm', '6cm', '8cm'],
    },
    expectVerticesVia: 'sides',
  },
  {
    name: 'congruent-triangle-pair',
    question: '三角形ABCと三角形DEFが合同です。AB = 4cm、BC = 5cm、CA = 6cmのとき、三角形DEFの辺の長さは？',
    graphData: {
      type: 'shape', shape: 'triangle',
      labels: ['A', 'B', 'C'],
      sides: ['4cm', '5cm', '6cm'],
      secondShape: {
        shape: 'triangle',
        labels: ['D', 'E', 'F'],
        sides: [null, null, null],
      },
    },
    expectVerticesVia: 'sides',
    expectSecondShape: true,
  },
  {
    name: 'rectangle-ABCD',
    question: '長方形ABCDで、AB = 6cm、BC = 4cmのとき、対角線の長さは？',
    graphData: {
      type: 'shape', shape: 'rectangle',
      labels: ['A', 'B', 'C', 'D'],
      sides: ['6cm', '4cm', '6cm', '4cm'],
    },
    expectVerticesVia: null, // rectangle uses fixed layout, no geometry compute
  },
  {
    name: 'parallelogram-ABCD',
    question: '平行四辺形ABCDで、AB = 8cm、BC = 5cmのとき、CDの長さは？',
    graphData: {
      type: 'shape', shape: 'parallelogram',
      labels: ['A', 'B', 'C', 'D'],
      sides: ['8cm', '5cm', null, '5cm'],
    },
    expectVerticesVia: null,
  },
  {
    name: 'circle-with-radius',
    question: '半径 5cm の円の面積を求めなさい。',
    graphData: {
      type: 'shape', shape: 'circle',
      radius: '5cm',
    },
    expectVerticesVia: null,
  },
  {
    name: 'linear-graph',
    question: '一次関数 y = 2x + 3 のグラフを描きなさい。',
    graphData: {
      type: 'coordinate',
      range: 5,
      lines: [{ slope: 2, intercept: 3, label: 'y=2x+3' }],
    },
    expectVerticesVia: null,
  },
  {
    name: 'numberline',
    question: '数直線上で -3 と 2 の距離を求めなさい。',
    graphData: {
      type: 'numberline',
      min: -5, max: 5,
      points: [{ value: -3, label: 'A' }, { value: 2, label: 'B' }],
    },
    expectVerticesVia: null,
  },
  {
    name: 'quadratic-y=2x²',
    question: '二次関数 y = 2x² のグラフを描きなさい。',
    graphData: {
      type: 'coordinate',
      range: 5,
      curves: [{ a: 2, b: 0, c: 0, label: 'y=2x²' }],
    },
    expectVerticesVia: null,
  },
  {
    name: 'quadratic-y=-3x²+1',
    question: '二次関数 y = -3x² + 1 のグラフを描きなさい。',
    graphData: {
      type: 'coordinate',
      range: 5,
      curves: [{ a: -3, b: 0, c: 1, label: 'y=-3x²+1' }],
    },
    expectVerticesVia: null,
  },
]

export default FIXTURES.map(fx => ({
  name: fx.name,
  fn: async () => {
    // 1. Validator must accept
    const validated = validateGraphData(fx.question, JSON.parse(JSON.stringify(fx.graphData)))
    assert.ok(validated && !validated.rejected,
      `validator rejected ${fx.name}: ${validated?.reason}`)

    // 2. For triangles, geometry must produce vertices
    if (fx.expectVerticesVia === 'sides') {
      const vs = computeTriangleVertices(fx.graphData.sides, W, H, pad)
      assert.ok(vs, `${fx.name}: sides did not compute vertices`)
      assert.strictEqual(vs.length, 3)
    }
    if (fx.expectVerticesVia === 'angles') {
      const vs = computeTriangleFromAngles(fx.graphData.angles, W, H, pad)
      assert.ok(vs, `${fx.name}: angles did not compute vertices`)
      assert.strictEqual(vs.length, 3)
    }

    // 3. Pair fixture must preserve secondShape
    if (fx.expectSecondShape) {
      assert.ok(validated.secondShape, `${fx.name}: secondShape dropped`)
      assert.strictEqual(validated.secondShape.shape, 'triangle')
      assert.deepStrictEqual(validated.secondShape.labels, ['D', 'E', 'F'])
    }
  },
}))
