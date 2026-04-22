// Tests for lib/stage2GraphMerge.js — the Stage-2 post-processing module
// extracted from api/generate.js in Phase 2B.
//
// Coverage:
//   • module surface: mergeStage2GraphData is callable
//   • null / non-array inputs: never throw, return appliedCount: 0
//   • nlPoints → points conversion for numberline shape
//   • top-level null fields are stripped
//   • secondShape with null fields is cleaned; shape-less secondShape is dropped
//   • fixSideOrder integration: side ordering is re-derived from question text
//   • sanitizeGraphData integration: range clamp, asked-side null-out
//   • needsGraph: false OR graphData: null → entry is skipped
//   • out-of-bounds questionIndex → entry is skipped (never crashes)
//   • appliedCount is accurate (counts only successful attachments)
//   • questions array length is never reduced
import assert from 'node:assert/strict'
import { mergeStage2GraphData } from '../lib/stage2GraphMerge.js'

// Helper — deep clone a graphData payload so each test starts from a
// fresh copy (the merger mutates its input).
const clone = x => JSON.parse(JSON.stringify(x))

// Minimal question factory
const q = (question, extra = {}) => ({
  question,
  choices: ['A', 'B', 'C', 'D'],
  correctIndex: 0,
  correctAnswer: 'A',
  explanation: '',
  ...extra,
})

export default [
  // ── module surface ──────────────────────────────────────────────────
  {
    name: 'mergeStage2GraphData is exported as a function',
    fn: async () => {
      assert.strictEqual(typeof mergeStage2GraphData, 'function')
    },
  },

  // ── defensive input handling ────────────────────────────────────────
  {
    name: 'returns appliedCount: 0 when graphResults is null',
    fn: async () => {
      const questions = [q('x=1?')]
      const result = mergeStage2GraphData(questions, null)
      assert.deepStrictEqual(result, { appliedCount: 0 })
      assert.strictEqual(questions[0].graphData, undefined, 'no graphData attached')
    },
  },
  {
    name: 'returns appliedCount: 0 when graphResults is undefined',
    fn: async () => {
      const questions = [q('x=1?')]
      const result = mergeStage2GraphData(questions, undefined)
      assert.deepStrictEqual(result, { appliedCount: 0 })
    },
  },
  {
    name: 'returns appliedCount: 0 when questions is not an array',
    fn: async () => {
      const result = mergeStage2GraphData(null, [{ questionIndex: 0, needsGraph: true, graphData: {} }])
      assert.deepStrictEqual(result, { appliedCount: 0 })
    },
  },
  {
    name: 'tolerates null entries inside graphResults',
    fn: async () => {
      const questions = [q('x=1?')]
      const { appliedCount } = mergeStage2GraphData(questions, [null, undefined])
      assert.strictEqual(appliedCount, 0)
    },
  },

  // ── skip rules ──────────────────────────────────────────────────────
  {
    name: 'skips entries with needsGraph: false',
    fn: async () => {
      const questions = [q('純粋計算問題')]
      const { appliedCount } = mergeStage2GraphData(questions, [
        { questionIndex: 0, needsGraph: false, graphData: null },
      ])
      assert.strictEqual(appliedCount, 0)
      assert.strictEqual(questions[0].graphData, undefined)
    },
  },
  {
    name: 'skips entries with null graphData even if needsGraph: true',
    fn: async () => {
      const questions = [q('x=1?')]
      const { appliedCount } = mergeStage2GraphData(questions, [
        { questionIndex: 0, needsGraph: true, graphData: null },
      ])
      assert.strictEqual(appliedCount, 0)
      assert.strictEqual(questions[0].graphData, undefined)
    },
  },
  {
    name: 'skips out-of-bounds questionIndex without crashing',
    fn: async () => {
      const questions = [q('Q0'), q('Q1')]
      const { appliedCount } = mergeStage2GraphData(questions, [
        { questionIndex: -1, needsGraph: true, graphData: { type: 'coordinate', range: 5 } },
        { questionIndex: 99, needsGraph: true, graphData: { type: 'coordinate', range: 5 } },
      ])
      assert.strictEqual(appliedCount, 0)
    },
  },
  {
    name: 'skips entries with non-numeric questionIndex',
    fn: async () => {
      const questions = [q('Q0')]
      const { appliedCount } = mergeStage2GraphData(questions, [
        { questionIndex: 'zero', needsGraph: true, graphData: { type: 'coordinate', range: 5 } },
      ])
      assert.strictEqual(appliedCount, 0)
    },
  },

  // ── cleanup: nlPoints → points ──────────────────────────────────────
  {
    name: 'numberline: renames nlPoints to points',
    fn: async () => {
      const questions = [q('数直線で -2 を示せ')]
      const graphData = { type: 'numberline', nlPoints: [{ value: -2, label: 'A' }] }
      const { appliedCount } = mergeStage2GraphData(questions, [
        { questionIndex: 0, needsGraph: true, graphData: clone(graphData) },
      ])
      assert.strictEqual(appliedCount, 1)
      const gd = questions[0].graphData
      assert.deepStrictEqual(gd.points, [{ value: -2, label: 'A' }])
      assert.strictEqual(gd.nlPoints, undefined, 'nlPoints must be deleted after rename')
    },
  },

  // ── cleanup: top-level null strip ───────────────────────────────────
  {
    name: 'strips top-level null fields from graphData',
    fn: async () => {
      const questions = [q('直線 y = x')]
      const graphData = {
        type: 'coordinate',
        range: 5,
        lines: [{ slope: 1, intercept: 0, label: 'y=x' }],
        curves: null,     // LLM emitted null for optional slot
        polygons: null,
        shape: null,
      }
      mergeStage2GraphData(questions, [
        { questionIndex: 0, needsGraph: true, graphData: clone(graphData) },
      ])
      const gd = questions[0].graphData
      assert.strictEqual('curves' in gd, false, 'null curves must be deleted')
      assert.strictEqual('polygons' in gd, false, 'null polygons must be deleted')
      assert.strictEqual('shape' in gd, false, 'null shape must be deleted')
      assert.strictEqual(gd.range, 5, 'non-null fields preserved')
    },
  },

  // ── cleanup: secondShape ────────────────────────────────────────────
  {
    name: 'cleans null fields inside secondShape',
    fn: async () => {
      const questions = [q('合同な三角形ABCとDEF')]
      const graphData = {
        type: 'shape',
        shape: 'triangle',
        labels: ['A', 'B', 'C'],
        sides: null,
        angles: null,
        secondShape: {
          shape: 'triangle',
          labels: ['D', 'E', 'F'],
          sides: null,
          angles: null,
        },
      }
      mergeStage2GraphData(questions, [
        { questionIndex: 0, needsGraph: true, graphData: clone(graphData) },
      ])
      const second = questions[0].graphData.secondShape
      assert.ok(second, 'secondShape should survive because it has a shape')
      assert.strictEqual('sides' in second, false, 'null sides should be stripped')
      assert.strictEqual('angles' in second, false, 'null angles should be stripped')
      assert.strictEqual(second.shape, 'triangle')
    },
  },
  {
    name: 'drops secondShape entirely if no shape remains',
    fn: async () => {
      const questions = [q('問題文')]
      const graphData = {
        type: 'shape',
        shape: 'triangle',
        labels: ['A', 'B', 'C'],
        secondShape: {
          shape: null, // shape-less → drop the whole secondShape
          labels: null,
          sides: null,
        },
      }
      mergeStage2GraphData(questions, [
        { questionIndex: 0, needsGraph: true, graphData: clone(graphData) },
      ])
      assert.strictEqual(questions[0].graphData.secondShape, undefined,
        'shape-less secondShape must be dropped')
    },
  },

  // ── integration: fixSideOrder ───────────────────────────────────────
  {
    name: 'fixSideOrder integration: re-orders sides from question text',
    fn: async () => {
      // Question says AB=3, BC=4, CA=5. LLM emitted sides in wrong order.
      const questions = [q('三角形ABCで AB = 3cm, BC = 4cm, CA = 5cm のとき…')]
      const graphData = {
        type: 'shape',
        shape: 'triangle',
        labels: ['A', 'B', 'C'],
        sides: ['5cm', '3cm', '4cm'], // wrong order
      }
      mergeStage2GraphData(questions, [
        { questionIndex: 0, needsGraph: true, graphData: clone(graphData) },
      ])
      const gd = questions[0].graphData
      // After fixSideOrder, sides should be [AB, BC, CA] = [3cm, 4cm, 5cm]
      assert.strictEqual(gd.sides[0], '3cm', `AB slot should be 3cm, got ${gd.sides[0]}`)
      assert.strictEqual(gd.sides[1], '4cm', `BC slot should be 4cm, got ${gd.sides[1]}`)
      assert.strictEqual(gd.sides[2], '5cm', `CA slot should be 5cm, got ${gd.sides[2]}`)
    },
  },

  // ── integration: sanitizeGraphData (range clamp) ────────────────────
  {
    name: 'sanitizeGraphData integration: clamps coordinate range > 8',
    fn: async () => {
      const questions = [q('直線 y = x のグラフ')]
      const graphData = {
        type: 'coordinate',
        range: 15,
        lines: [{ slope: 1, intercept: 0, label: 'y=x' }],
      }
      mergeStage2GraphData(questions, [
        { questionIndex: 0, needsGraph: true, graphData: clone(graphData) },
      ])
      assert.strictEqual(questions[0].graphData.range, 8, 'range must clamp to 8')
    },
  },

  // ── integration: sanitizeGraphData (asked-side nulling) ─────────────
  {
    name: 'sanitizeGraphData integration: nulls asked side on triangle',
    fn: async () => {
      const questions = [q('三角形ABCで AB=4cm, BC=5cm, CA=6cm。CA の長さを求めよ')]
      const graphData = {
        type: 'shape',
        shape: 'triangle',
        labels: ['A', 'B', 'C'],
        sides: ['4cm', '5cm', '6cm'],
      }
      mergeStage2GraphData(questions, [
        { questionIndex: 0, needsGraph: true, graphData: clone(graphData) },
      ])
      const gd = questions[0].graphData
      assert.strictEqual(gd.sides[2], null, 'asked side CA must be null in the figure')
      assert.strictEqual(gd.sides[0], '4cm', 'non-asked sides must remain')
    },
  },

  // ── counting + non-destructive ──────────────────────────────────────
  {
    name: 'appliedCount matches the number of successful attachments',
    fn: async () => {
      const questions = [q('Q0'), q('Q1'), q('Q2')]
      const { appliedCount } = mergeStage2GraphData(questions, [
        { questionIndex: 0, needsGraph: true, graphData: { type: 'coordinate', range: 5, lines: [] } },
        { questionIndex: 1, needsGraph: false, graphData: null },              // skip
        { questionIndex: 2, needsGraph: true, graphData: { type: 'coordinate', range: 6, lines: [] } },
      ])
      assert.strictEqual(appliedCount, 2)
      assert.ok(questions[0].graphData, 'Q0 has graphData')
      assert.strictEqual(questions[1].graphData, undefined, 'Q1 skipped')
      assert.ok(questions[2].graphData, 'Q2 has graphData')
    },
  },
  {
    name: 'never drops entries from the questions array',
    fn: async () => {
      const questions = [q('Q0'), q('Q1'), q('Q2')]
      const originalLen = questions.length
      mergeStage2GraphData(questions, [
        { questionIndex: 0, needsGraph: true, graphData: null },     // skip
        { questionIndex: 1, needsGraph: false, graphData: null },    // skip
        { questionIndex: 99, needsGraph: true, graphData: {} },       // skip (OOB)
      ])
      assert.strictEqual(questions.length, originalLen,
        'merge must never shrink the questions array')
    },
  },
]
