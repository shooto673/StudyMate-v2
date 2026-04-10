// Verifies that the OpenAI Structured Outputs schema in api/generate.js
// actually complies with strict-mode rules. This is the primary safety net:
// if the schema drifts, every extraction call fails silently and no math
// figure ever appears.
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import assert from 'assert'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')

function loadSchemaLiteral() {
  const src = readFileSync(join(repoRoot, 'api/generate.js'), 'utf8')
  const marker = 'const GRAPH_DATA_SCHEMA = '
  const start = src.indexOf(marker)
  if (start < 0) throw new Error('GRAPH_DATA_SCHEMA not found in api/generate.js')
  let depth = 0, startBrace = -1, i = start + marker.length
  for (; i < src.length; i++) {
    const c = src[i]
    if (c === '{') { if (depth === 0) startBrace = i; depth++ }
    else if (c === '}') { depth--; if (depth === 0) { i++; break } }
  }
  const literal = src.slice(startBrace, i)
  const cleaned = literal
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'([^']*)'/g, (_, s) => JSON.stringify(s))
    .replace(/([,{\[]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
    .replace(/,(\s*[}\]])/g, '$1')
  return JSON.parse(cleaned)
}

function walk(node, path, errs) {
  if (!node || typeof node !== 'object') return
  const t = node.type
  const isObject = t === 'object' || (Array.isArray(t) && t.includes('object'))
  const isArray = t === 'array' || (Array.isArray(t) && t.includes('array'))

  if (isObject) {
    if (node.additionalProperties !== false) {
      errs.push(`${path}: missing additionalProperties: false`)
    }
    const props = Object.keys(node.properties || {})
    const req = node.required || []
    const missing = props.filter(p => !req.includes(p))
    const extra = req.filter(p => !props.includes(p))
    if (missing.length) errs.push(`${path}: properties NOT in required: ${missing.join(', ')}`)
    if (extra.length) errs.push(`${path}: required lists nonexistent props: ${extra.join(', ')}`)
    for (const p of props) walk(node.properties[p], `${path}.${p}`, errs)
  }
  if (isArray && node.items) walk(node.items, `${path}[]`, errs)
}

export default [
  {
    name: 'schema literal is parseable',
    fn: async () => {
      const schema = loadSchemaLiteral()
      assert.strictEqual(schema.name, 'graph_data_extraction')
      assert.strictEqual(schema.strict, true)
      assert.ok(schema.schema, 'schema.schema must exist')
    },
  },
  {
    name: 'every object has additionalProperties: false and all props in required',
    fn: async () => {
      const schema = loadSchemaLiteral()
      const errs = []
      walk(schema.schema, '$', errs)
      assert.deepStrictEqual(errs, [], `strict mode violations:\n  ${errs.join('\n  ')}`)
    },
  },
  {
    name: 'graphData.secondShape is in required list (catches drift)',
    fn: async () => {
      const schema = loadSchemaLiteral()
      const gdNode = schema.schema.properties.questions.items.properties.graphData
      assert.ok(gdNode.required.includes('secondShape'),
        'graphData.required must include secondShape')
      const ssNode = gdNode.properties.secondShape
      assert.deepStrictEqual(ssNode.required, ['shape', 'labels', 'sides', 'angles'])
    },
  },
  {
    name: 'graphData type enum covers the three shape kinds',
    fn: async () => {
      const schema = loadSchemaLiteral()
      const typeNode = schema.schema.properties.questions.items.properties.graphData.properties.type
      assert.deepStrictEqual(typeNode.enum.sort(), ['coordinate', 'numberline', 'shape'])
    },
  },
]
