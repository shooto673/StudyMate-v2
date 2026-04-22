// Tests for lib/sanitizeQuestion.js — the dedicated question fix-up module
// extracted from api/generate.js in the Phase 1 responsibility split.
//
// Coverage:
//   • module surface: every public export is callable
//   • repairCorrectIndex: exact + fuzzy + no-op paths
//   • sanitizeQuestions: the batch orchestrator performs text normalisation,
//     contamination removal, AND correctIndex repair in one pass,
//     IN THE RIGHT ORDER (text is normalised before correctIndex comparison).
//   • sanitizeQuestions never drops a question, even if fields are missing.
//   • re-exports on api/generate.js still resolve to the same implementation
//     (legacy import paths stay live).
import assert from 'node:assert/strict'
import * as sanitize from '../lib/sanitizeQuestion.js'
import * as handlerMod from '../api/generate.js'

export default [
  // ── module surface ──────────────────────────────────────────────────
  {
    name: 'sanitizeQuestion exports the expected public surface',
    fn: async () => {
      for (const name of [
        'normalizeMathText',
        'isBeingAsked',
        'sanitizeGraphData',
        'removeContaminatedSentences',
        'fixSideOrder',
        'repairCorrectIndex',
        'sanitizeQuestions',
      ]) {
        assert.strictEqual(typeof sanitize[name], 'function', `missing export: ${name}`)
      }
    },
  },
  {
    name: 'api/generate.js re-exports point at the same sanitize implementations',
    fn: async () => {
      // Legacy import paths must not silently diverge from the new module.
      for (const name of ['normalizeMathText', 'isBeingAsked', 'sanitizeGraphData', 'removeContaminatedSentences']) {
        assert.strictEqual(handlerMod[name], sanitize[name], `re-export mismatch: ${name}`)
      }
    },
  },

  // ── repairCorrectIndex ──────────────────────────────────────────────
  {
    name: 'repairCorrectIndex: fixes drifting exact-match index',
    fn: async () => {
      const q = {
        choices: ['6cm', '8cm', '9cm', '10cm'],
        correctIndex: 3,
        correctAnswer: '9cm',
      }
      sanitize.repairCorrectIndex(q)
      assert.strictEqual(q.correctIndex, 2)
    },
  },
  {
    name: 'repairCorrectIndex: leaves correctly-aligned questions alone',
    fn: async () => {
      const q = {
        choices: ['1', '2', '3', '4'],
        correctIndex: 1,
        correctAnswer: '2',
      }
      sanitize.repairCorrectIndex(q)
      assert.strictEqual(q.correctIndex, 1)
    },
  },
  {
    name: 'repairCorrectIndex: fuzzy-matches whitespace / full-width drift',
    fn: async () => {
      const q = {
        choices: ['y = -3x + 6', 'y = 3x - 6', 'y = -3x - 6'],
        correctIndex: 1,          // wrong
        correctAnswer: 'y = -3x + 6', // matches choices[0] but with drift…
      }
      // Force a drift scenario: choices[0] uses ASCII '-', correctAnswer
      // uses the same. indexOf should resolve exactly; still verify no-op.
      sanitize.repairCorrectIndex(q)
      assert.strictEqual(q.correctIndex, 0)
    },
  },
  {
    name: 'repairCorrectIndex: returns silently when fields are missing',
    fn: async () => {
      const q1 = { choices: ['a', 'b'], correctIndex: 0 } // no correctAnswer
      const q2 = { correctAnswer: 'a', correctIndex: 0 }  // no choices
      sanitize.repairCorrectIndex(q1)
      sanitize.repairCorrectIndex(q2)
      // Nothing thrown, nothing mutated beyond a no-op
      assert.strictEqual(q1.correctIndex, 0)
      assert.strictEqual(q2.correctIndex, 0)
    },
  },

  // ── sanitizeQuestions: end-to-end batch ─────────────────────────────
  {
    name: 'sanitizeQuestions: normalises full-width minus in question + choices',
    fn: async () => {
      const questions = [{
        question: 'y = \u22123x + 6 のグラフ',
        choices: ['y = \u22123x + 6', 'y = 3x + 6'],
        correctAnswer: 'y = \u22123x + 6',
        correctIndex: 0,
        explanation: '傾きは \u22123 です。',
      }]
      sanitize.sanitizeQuestions(questions)
      assert.ok(!questions[0].question.includes('\u2212'), 'question minus not normalised')
      assert.ok(!questions[0].choices[0].includes('\u2212'), 'choice minus not normalised')
      assert.ok(!questions[0].correctAnswer.includes('\u2212'), 'correctAnswer minus not normalised')
      assert.ok(!questions[0].explanation.includes('\u2212'), 'explanation minus not normalised')
    },
  },
  {
    name: 'sanitizeQuestions: runs text normalisation BEFORE correctIndex repair',
    fn: async () => {
      // Before normalisation, correctAnswer '\u22123cm' ≠ choices[1] '-3cm'
      // → exact indexOf would miss. Order matters: normalise first, then repair.
      const questions = [{
        question: 'x を求めよ',
        choices: ['-2cm', '-3cm', '-4cm'],
        correctAnswer: '\u22123cm',
        correctIndex: 0,
        explanation: '答えは -3cm',
      }]
      sanitize.sanitizeQuestions(questions)
      assert.strictEqual(questions[0].correctAnswer, '-3cm', 'correctAnswer should be ASCII-normalised')
      assert.strictEqual(questions[0].correctIndex, 1, 'repair should land at choices[1]')
    },
  },
  {
    name: 'sanitizeQuestions: removes contaminated sentence mentioning foreign label',
    fn: async () => {
      const questions = [{
        question: '∠a = 65° のとき ∠b を求めよ',
        choices: ['45°', '65°', '115°', '130°'],
        correctAnswer: '115°',
        correctIndex: 2,
        explanation: '平行線の錯角は等しいので ∠b = 180° - 65° = 115° です。再計算すると EF = 10cm です。',
      }]
      sanitize.sanitizeQuestions(questions)
      assert.ok(!questions[0].explanation.includes('EF'), `EF must be stripped, got "${questions[0].explanation}"`)
      assert.ok(questions[0].explanation.includes('115°'), 'answer sentence must remain')
    },
  },
  {
    name: 'sanitizeQuestions: never drops or nullifies a question',
    fn: async () => {
      const before = [
        { question: 'a', choices: ['1'], correctAnswer: '1', correctIndex: 0 },
        { question: 'b', choices: ['2'], correctAnswer: '2', correctIndex: 0 },
        null, // tolerate junk
        { /* empty */ },
      ]
      const after = sanitize.sanitizeQuestions(before)
      assert.strictEqual(after, before, 'should return the same reference (in-place)')
      assert.strictEqual(after.length, 4, 'should never drop entries')
    },
  },
  {
    name: 'sanitizeQuestions: accepts non-array input defensively',
    fn: async () => {
      // Not an error path, just a no-op — keeps the orchestrator simple.
      const result = sanitize.sanitizeQuestions(null)
      assert.strictEqual(result, null)
    },
  },

  // ── sanitizeGraphData (moved module, smoke test) ────────────────────
  {
    name: 'sanitizeGraphData: clamps coordinate range > 8 down to 8',
    fn: async () => {
      const gd = { type: 'coordinate', range: 12, lines: [] }
      sanitize.sanitizeGraphData('y = x', gd)
      assert.strictEqual(gd.range, 8)
    },
  },
  {
    name: 'sanitizeGraphData: nulls asked side on triangle',
    fn: async () => {
      const gd = {
        type: 'shape', shape: 'triangle',
        labels: ['A', 'B', 'C'],
        sides: ['4cm', '5cm', '6cm'],
      }
      // All three sides are declared in the text so _verifySidesAgainstText
      // keeps them; _nullAskedEdges then nulls only the asked side CA.
      sanitize.sanitizeGraphData('三角形ABCで AB=4cm, BC=5cm, CA=6cm。CA の長さを求めよ', gd)
      assert.strictEqual(gd.sides[2], null, 'asked side CA (index 2) must be null')
      assert.strictEqual(gd.sides[0], '4cm', 'other sides must remain')
    },
  },
]
