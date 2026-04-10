// Tests for graphValidator — the gate between AI output and the renderer.
import assert from 'assert'
import {
  validateGraphData,
  extractMentionedLabels,
  questionLooksVisual,
} from '../frontend/src/lib/graphValidator.js'

function accepted(result) {
  return result && !result.rejected
}

export default [
  {
    name: 'extractMentionedLabels parses 「三角形ABC」',
    fn: async () => {
      const labels = extractMentionedLabels('三角形ABCで、AB = 5cmです。')
      assert.deepStrictEqual(labels.sort(), ['A', 'B', 'C'])
    },
  },
  {
    name: 'extractMentionedLabels parses 「三角形ABCと三角形DEF」',
    fn: async () => {
      const labels = extractMentionedLabels('三角形ABCと三角形DEFが合同です。')
      assert.deepStrictEqual(labels.sort(), ['A', 'B', 'C', 'D', 'E', 'F'])
    },
  },
  {
    name: 'extractMentionedLabels parses 「四角形ABCD」',
    fn: async () => {
      const labels = extractMentionedLabels('長方形ABCDの面積を求めなさい。')
      assert.deepStrictEqual(labels.sort(), ['A', 'B', 'C', 'D'])
    },
  },
  {
    name: 'extractMentionedLabels ignores unrelated uppercase letters',
    fn: async () => {
      const labels = extractMentionedLabels('式 A = π r² を用いて…')
      assert.deepStrictEqual(labels, [])
    },
  },
  {
    name: 'validateGraphData accepts a well-formed triangle',
    fn: async () => {
      const gd = {
        type: 'shape', shape: 'triangle',
        labels: ['A', 'B', 'C'],
        sides: ['5cm', '7cm', '9cm'],
      }
      const out = validateGraphData('三角形ABCの面積を求めなさい。', gd)
      assert.ok(accepted(out), `expected accept, got ${JSON.stringify(out)}`)
    },
  },
  {
    name: 'validateGraphData accepts angle-only right triangle',
    fn: async () => {
      const gd = {
        type: 'shape', shape: 'triangle',
        labels: ['A', 'B', 'C'],
        angles: ['35°', null, '90°'],
      }
      const out = validateGraphData('直角三角形ABCで∠C=90°、∠A=35°。∠Bは何度？', gd)
      assert.ok(accepted(out))
    },
  },
  {
    name: 'validateGraphData accepts triangle pair with secondShape',
    fn: async () => {
      const gd = {
        type: 'shape', shape: 'triangle',
        labels: ['A', 'B', 'C'],
        sides: ['4cm', '5cm', '6cm'],
        secondShape: {
          shape: 'triangle',
          labels: ['D', 'E', 'F'],
          sides: [null, null, null],
        },
      }
      const out = validateGraphData('三角形ABCと三角形DEFが合同。DEの長さを求めなさい。', gd)
      assert.ok(accepted(out), `expected accept, got ${JSON.stringify(out)}`)
    },
  },
  {
    name: 'validateGraphData rejects unsupported type',
    fn: async () => {
      const out = validateGraphData('…', { type: 'pie_chart' })
      assert.ok(out.rejected)
      assert.match(out.reason, /unsupported_type/)
    },
  },
  {
    name: 'validateGraphData rejects unsupported shape',
    fn: async () => {
      const out = validateGraphData('…', { type: 'shape', shape: 'pentagon' })
      assert.ok(out.rejected)
      assert.match(out.reason, /unsupported_shape/)
    },
  },
  {
    name: 'validateGraphData rejects when most mentioned labels are missing',
    fn: async () => {
      const gd = {
        type: 'shape', shape: 'triangle',
        labels: ['X', 'Y', 'Z'],
      }
      const out = validateGraphData('三角形ABCの∠Aを求めなさい。', gd)
      assert.ok(out.rejected)
      assert.match(out.reason, /labels_mismatch/)
    },
  },
  {
    name: 'validateGraphData accepts when half or more of mentioned labels are present',
    fn: async () => {
      const gd = {
        type: 'shape', shape: 'triangle',
        labels: ['A', 'B', 'C'],
        secondShape: { shape: 'triangle', labels: ['D', 'E', 'F'] },
      }
      const out = validateGraphData('三角形ABCと三角形DEF…', gd)
      assert.ok(accepted(out))
    },
  },
  {
    name: 'validateGraphData drops invalid secondShape but keeps primary',
    fn: async () => {
      const gd = {
        type: 'shape', shape: 'triangle',
        labels: ['A', 'B', 'C'],
        sides: ['5', '5', '5'],
        secondShape: { shape: 'pentagon', labels: ['D', 'E', 'F', 'G', 'H'] },
      }
      const out = validateGraphData('三角形ABC。', gd)
      assert.ok(accepted(out))
      assert.strictEqual(out.secondShape, undefined)
    },
  },
  {
    name: 'validateGraphData rejects coordinate with no lines or points',
    fn: async () => {
      const out = validateGraphData('一次関数 y=2x+3', { type: 'coordinate' })
      assert.ok(out.rejected)
      assert.strictEqual(out.reason, 'coordinate_empty')
    },
  },
  {
    name: 'validateGraphData rejects numberline with missing range',
    fn: async () => {
      const out = validateGraphData('数直線', { type: 'numberline' })
      assert.ok(out.rejected)
      assert.strictEqual(out.reason, 'numberline_missing_range')
    },
  },
  {
    name: 'questionLooksVisual detects obvious figure questions',
    fn: async () => {
      assert.ok(questionLooksVisual('三角形ABCの面積'))
      assert.ok(questionLooksVisual('一次関数 y=2x+3 のグラフ'))
      assert.ok(questionLooksVisual('半径 5cm の円'))
      assert.ok(questionLooksVisual('合同な三角形'))
      assert.ok(!questionLooksVisual('次の方程式を解きなさい: 2x + 3 = 7'))
    },
  },
]
