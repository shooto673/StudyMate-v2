// Tiny zero-dependency test runner. Run with `node tests/run.mjs`.
// Imports each test file, which should export an array of { name, fn }.
import schemaTest from './schema.test.mjs'
import geometryTest from './geometry.test.mjs'
import validatorTest from './validator.test.mjs'
import graphDataShapeTest from './graphDataShape.test.mjs'
import explanationIntegrityTest from './explanationIntegrity.test.mjs'
import solverAndValidatorTest from './solverAndValidator.test.mjs'
import coverageAndForceTest from './coverageAndForce.test.mjs'

const suites = [
  { name: 'schema', cases: schemaTest },
  { name: 'geometry', cases: geometryTest },
  { name: 'validator', cases: validatorTest },
  { name: 'graphDataShape', cases: graphDataShapeTest },
  { name: 'explanationIntegrity', cases: explanationIntegrityTest },
  { name: 'solverAndValidator', cases: solverAndValidatorTest },
  { name: 'coverageAndForce', cases: coverageAndForceTest },
]

let passed = 0
let failed = 0
const failures = []

for (const suite of suites) {
  for (const { name, fn } of suite.cases) {
    try {
      await fn()
      passed++
      console.log(`  ok  ${suite.name} › ${name}`)
    } catch (err) {
      failed++
      failures.push({ suite: suite.name, name, err })
      console.log(`  FAIL ${suite.name} › ${name}`)
      console.log(`       ${err.message}`)
    }
  }
}

console.log('')
console.log(`${passed} passed, ${failed} failed`)
if (failed > 0) {
  for (const f of failures) {
    console.log(`\n--- ${f.suite} › ${f.name} ---`)
    console.log(f.err.stack || f.err.message)
  }
  process.exit(1)
}
