// Smoke test: every module that api/generate.js (the Vercel entrypoint)
// depends on must resolve AND export its advertised public surface.
//
// Why this exists: on 2026-04-18 we shipped a handler that imported
// `../lib/buildGraphFromSpec.js` before that file was committed. The
// Vercel build silently succeeded but every runtime request crashed with
// ERR_MODULE_NOT_FOUND, and the frontend quietly fell back to mock
// placeholders, confusing our test users. Running this file as part of
// `node tests/run.mjs` makes "is every import reachable?" a PR-level gate.
import assert from 'node:assert/strict'
import * as handlerMod from '../api/generate.js'
import * as solvers from '../lib/mathSolvers.js'
import * as classifier from '../lib/classifier.js'
import * as validator from '../lib/questionValidator.js'
import * as buildGraph from '../lib/buildGraphFromSpec.js'

export default [
  {
    name: 'critical: api/generate.js default export is a function',
    fn: async () => {
      assert.strictEqual(typeof handlerMod.default, 'function',
        'Vercel will 500 at cold start if the handler export disappears')
    },
  },
  {
    name: 'critical: api/generate.js exports normalizeMathText / isBeingAsked / sanitizeGraphData',
    fn: async () => {
      for (const n of ['normalizeMathText', 'isBeingAsked', 'sanitizeGraphData']) {
        assert.strictEqual(typeof handlerMod[n], 'function', `missing helper: ${n}`)
      }
    },
  },
  {
    name: 'critical: lib/mathSolvers.js exports GENERATORS map',
    fn: async () => {
      assert.ok(solvers.GENERATORS, 'GENERATORS export missing')
      for (const key of ['triangle_angle_sum', 'exterior_angle', 'similarity_ratio_length',
                         'ratio_simplify', 'ratio_length']) {
        assert.strictEqual(typeof solvers.GENERATORS[key], 'function',
          `GENERATORS.${key} is not a function`)
      }
    },
  },
  {
    name: 'critical: each generator produces a shippable question object with graphData',
    fn: async () => {
      for (const [key, gen] of Object.entries(solvers.GENERATORS)) {
        const q = gen()
        assert.ok(q && typeof q === 'object', `${key} produced non-object`)
        assert.ok(Array.isArray(q.choices), `${key} missing choices`)
        assert.ok(typeof q.correctIndex === 'number', `${key} missing correctIndex`)
        assert.ok(q.spec && q.spec.problemType === key, `${key} wrong spec.problemType`)
      }
    },
  },
  {
    name: 'critical: lib/classifier.js exports classifyUnit / isProblemTypeAllowed',
    fn: async () => {
      assert.strictEqual(typeof classifier.classifyUnit, 'function')
      assert.strictEqual(typeof classifier.isProblemTypeAllowed, 'function')
    },
  },
  {
    name: 'critical: lib/questionValidator.js exports validateQuestionObject + GRAPH_REQUIRED_PROBLEM_TYPES',
    fn: async () => {
      assert.strictEqual(typeof validator.validateQuestionObject, 'function')
      assert.ok(validator.GRAPH_REQUIRED_PROBLEM_TYPES instanceof Set)
    },
  },
  {
    name: 'critical: lib/buildGraphFromSpec.js exports buildGraphFromSpec',
    fn: async () => {
      assert.strictEqual(typeof buildGraph.buildGraphFromSpec, 'function')
    },
  },
  {
    name: 'critical: classifier routes 三角形と四角形 > 三角形の性質 to solver_required',
    fn: async () => {
      const c = classifier.classifyUnit('三角形と四角形', '三角形の性質', 'math')
      assert.strictEqual(c.category, 'solver_required',
        '三角形の性質 must stay solver-backed in production')
    },
  },
]
