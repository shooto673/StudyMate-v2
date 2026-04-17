// End-to-end(-ish) test of the API handler's debug-force branch.
// Invokes the default export of api/generate.js with a synthetic req/res,
// without actually calling Claude/OpenAI (we only exercise the solver path).
import assert from 'node:assert/strict'
import handler from '../api/generate.js'

function mockReqRes({ body = {}, query = {}, url = '/api/generate', env = {} } = {}) {
  const prevEnv = {}
  for (const [k, v] of Object.entries(env)) {
    prevEnv[k] = process.env[k]
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v },
    status(code) { this.statusCode = code; return this },
    json(obj) { this.body = obj; return this },
    end() { return this },
  }
  const req = { method: 'POST', body, query, url }
  const restore = () => {
    for (const [k, v] of Object.entries(prevEnv)) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
  }
  return { req, res, restore }
}

export default [
  {
    name: 'handler: body.debug_force_problem_type=ratio_simplify returns solver questions',
    fn: async () => {
      const { req, res, restore } = mockReqRes({
        body: {
          unitTitle: '相似な図形', subUnitTitle: '相似比',
          subject: 'math', grade: 'j3', count: 2,
          debug_force_problem_type: 'ratio_simplify',
        },
        env: { VERCEL_ENV: 'preview', ALLOW_DEBUG_FORCE: undefined },
      })
      try {
        await handler(req, res)
        assert.strictEqual(res.statusCode, 200, `got ${res.statusCode}: ${JSON.stringify(res.body)}`)
        assert.strictEqual(res.body._meta.forced_problem_type, 'ratio_simplify')
        for (const pt of res.body._meta.problemTypes) {
          assert.strictEqual(pt, 'ratio_simplify')
        }
      } finally { restore() }
    },
  },
  {
    name: 'handler: ?forceProblemType=exterior_angle via query string works',
    fn: async () => {
      const { req, res, restore } = mockReqRes({
        body: { unitTitle: 'x', subUnitTitle: 'y', subject: 'math', grade: 'j2', count: 2 },
        query: { forceProblemType: 'exterior_angle' },
        env: { VERCEL_ENV: 'development' },
      })
      try {
        await handler(req, res)
        assert.strictEqual(res.statusCode, 200, JSON.stringify(res.body))
        for (const pt of res.body._meta.problemTypes) {
          assert.strictEqual(pt, 'exterior_angle')
        }
      } finally { restore() }
    },
  },
  {
    name: 'handler: forceProblemType in URL string (no req.query) still works',
    fn: async () => {
      const { req, res, restore } = mockReqRes({
        body: { unitTitle: 'x', subUnitTitle: 'y', subject: 'math', grade: 'j3', count: 1 },
        query: null, // some adapters strip req.query
        url: '/api/generate?forceProblemType=ratio_simplify&foo=bar',
        env: { VERCEL_ENV: 'preview' },
      })
      try {
        await handler(req, res)
        assert.strictEqual(res.statusCode, 200, JSON.stringify(res.body))
        assert.strictEqual(res.body._meta.forced_problem_type, 'ratio_simplify')
      } finally { restore() }
    },
  },
  {
    name: 'handler: production + no ALLOW_DEBUG_FORCE → 403 on forced type',
    fn: async () => {
      const { req, res, restore } = mockReqRes({
        body: {
          unitTitle: 'x', subUnitTitle: 'y', subject: 'math', grade: 'j3',
          debug_force_problem_type: 'ratio_simplify',
        },
        env: { VERCEL_ENV: 'production', ALLOW_DEBUG_FORCE: undefined },
      })
      try {
        await handler(req, res)
        assert.strictEqual(res.statusCode, 403)
        assert.strictEqual(res.body.error, 'debug_force_disabled_in_production')
      } finally { restore() }
    },
  },
  {
    name: 'handler: production + ALLOW_DEBUG_FORCE=true allows forcing',
    fn: async () => {
      const { req, res, restore } = mockReqRes({
        body: {
          unitTitle: 'x', subUnitTitle: 'y', subject: 'math', grade: 'j3', count: 1,
          debug_force_problem_type: 'ratio_simplify',
        },
        env: { VERCEL_ENV: 'production', ALLOW_DEBUG_FORCE: 'true' },
      })
      try {
        await handler(req, res)
        assert.strictEqual(res.statusCode, 200, JSON.stringify(res.body))
        assert.strictEqual(res.body._meta.forced_problem_type, 'ratio_simplify')
      } finally { restore() }
    },
  },
  {
    name: 'handler: solver-first for 相似比 attaches graphData to questions',
    fn: async () => {
      const { req, res, restore } = mockReqRes({
        body: {
          unitTitle: '相似な図形', subUnitTitle: '相似比',
          subject: 'math', grade: 'j3', count: 3,
        },
        env: { VERCEL_ENV: 'development' },
      })
      try {
        await handler(req, res)
        assert.strictEqual(res.statusCode, 200)
        assert.strictEqual(res.body._meta.stage1, 'solver')
        // ratio_simplify items have graphData=null; similarity_ratio_length must have one.
        const similarityQ = res.body.questions.find(
          q => q._solverSpec?.problemType === 'similarity_ratio_length'
        )
        assert.ok(similarityQ, 'expected at least one similarity_ratio_length question')
        assert.ok(similarityQ.graphData, 'similarity question must carry graphData')
        assert.strictEqual(similarityQ.graphData.type, 'shape')
      } finally { restore() }
    },
  },
  {
    name: 'handler: solver-first for 三角形の性質 attaches graphData (triangle)',
    fn: async () => {
      const { req, res, restore } = mockReqRes({
        body: {
          unitTitle: '三角形と四角形', subUnitTitle: '三角形の性質',
          subject: 'math', grade: 'j2', count: 4,
        },
        env: { VERCEL_ENV: 'development' },
      })
      try {
        await handler(req, res)
        assert.strictEqual(res.statusCode, 200)
        for (const q of res.body.questions) {
          assert.ok(q.graphData, 'every triangle question must carry graphData')
          assert.strictEqual(q.graphData.shape, 'triangle')
        }
      } finally { restore() }
    },
  },
  {
    name: 'handler: unknown debug_force_problem_type returns 400',
    fn: async () => {
      const { req, res, restore } = mockReqRes({
        body: {
          unitTitle: 'x', subUnitTitle: 'y', subject: 'math', grade: 'j3',
          debug_force_problem_type: 'does_not_exist',
        },
        env: { VERCEL_ENV: 'development' },
      })
      try {
        await handler(req, res)
        assert.strictEqual(res.statusCode, 400)
        assert.strictEqual(res.body.error, 'unknown_problem_type')
      } finally { restore() }
    },
  },
]
