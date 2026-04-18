#!/usr/bin/env node
// Pre-push safety net: walk every `import` statement in api/**.js and
// assert the target path is tracked by git. Stops the class of outage
// where a Vercel serverless entrypoint references a file that only
// exists on the committer's laptop.
//
// Usage:  node scripts/preflight.mjs
//         (wire into CI or a git pre-push hook; exits 1 on missing files)
import { execSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(import.meta.url), '../..')

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = resolve(dir, name)
    if (statSync(full).isDirectory()) {
      if (name === 'node_modules' || name === '.git' || name === 'dist') continue
      out.push(...walk(full))
    } else if (/\.m?js$/.test(name)) {
      out.push(full)
    }
  }
  return out
}

function tracked(pathRelToRepo) {
  try {
    execSync(`git ls-files --error-unmatch -- "${pathRelToRepo}"`,
      { cwd: repoRoot, stdio: 'pipe' })
    return true
  } catch { return false }
}

const missing = []
const apiFiles = walk(resolve(repoRoot, 'api'))
const importRe = /from\s+['"](\.\.?\/[^'"]+)['"]/g

for (const f of apiFiles) {
  const src = readFileSync(f, 'utf8')
  for (const m of src.matchAll(importRe)) {
    const candidates = [m[1]]
    if (!/\.m?js$/.test(m[1])) {
      candidates.push(m[1] + '.js', m[1] + '.mjs', m[1] + '/index.js')
    }
    let resolved = null
    for (const cand of candidates) {
      const abs = resolve(dirname(f), cand)
      try { if (statSync(abs).isFile()) { resolved = abs; break } } catch {}
    }
    if (!resolved) {
      missing.push({ from: relative(repoRoot, f), spec: m[1], reason: 'not_on_disk' })
      continue
    }
    const rel = relative(repoRoot, resolved)
    if (!tracked(rel)) {
      missing.push({ from: relative(repoRoot, f), spec: m[1], resolved: rel, reason: 'untracked_by_git' })
    }
  }
}

if (missing.length) {
  console.error('\x1b[31m✗ preflight: api/** imports unshippable modules\x1b[0m')
  for (const m of missing) {
    console.error(`  ${m.from}  ← imports "${m.spec}"  (${m.reason}${m.resolved ? `: ${m.resolved}` : ''})`)
  }
  console.error('\nFix: git add the missing files, then re-run this script.')
  process.exit(1)
}
console.log('\x1b[32m✓ preflight: every api/** import is tracked by git\x1b[0m')
