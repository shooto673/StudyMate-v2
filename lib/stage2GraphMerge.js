// lib/stage2GraphMerge.js
//
// Stage-2 graph merger.
//
// After the Stage-2 LLM (GPT-4o-mini) extracts structured `graphData` from
// the question texts, this module walks the extraction result and attaches
// each graphData onto its corresponding question in the array — with
// defensive cleanup along the way.
//
// Responsibility split (per CLAUDE.md):
//   • api/generate.js — orchestrator; owns the Stage-2 LLM RPC and the
//     GRAPH_DATA_SCHEMA protocol.
//   • THIS module — pure in-memory merge + format cleanup. Delegates
//     mathematical sanitation to lib/sanitizeQuestion.js.
//   • lib/questionValidator.js — the single Final Gate that may drop a
//     question. This module never drops.
//
// Cleanup responsibilities (verbatim migration from the old inline loop
// in api/generate.js, kept byte-identical to avoid behavior drift):
//   1. nlPoints → points field rename (numberline shape compat)
//   2. Strip top-level null fields (LLM JSON noise)
//   3. Strip null fields inside secondShape; drop it if no shape remains
//   4. Re-derive side ordering from question text (fixSideOrder)
//   5. Defensive sanitisation (sanitizeGraphData: clamp range, null asked
//      sides/angles, re-extract quad sides)
//   6. Attach to questions[idx].graphData and bump appliedCount

import { fixSideOrder, sanitizeGraphData } from './sanitizeQuestion.js'

/**
 * Merge Stage-2 LLM extraction results back into the question array.
 *
 * @param {Array<object>} questions — the question array produced by Stage 1
 *   + sanitize + validate. Mutated in place to attach graphData.
 * @param {Array<object>|null} graphResults — the Stage-2 LLM response, i.e.
 *   an array of `{ questionIndex, needsGraph, graphData }`. A null/undefined
 *   input returns { appliedCount: 0 } without throwing (the caller already
 *   logs the upstream failure).
 * @returns {{ appliedCount: number }} — how many questions received a
 *   graphData payload. Never larger than questions.length.
 */
export function mergeStage2GraphData(questions, graphResults) {
  if (!Array.isArray(graphResults) || !Array.isArray(questions)) {
    return { appliedCount: 0 }
  }

  let appliedCount = 0
  for (const gResult of graphResults) {
    if (!gResult) continue
    const idx = gResult.questionIndex
    // Bounds + needsGraph + graphData presence gates. Note: !needsGraph
    // OR missing graphData both mean "no figure for this question" — we
    // leave questions[idx].graphData undefined, which the frontend
    // renders as a text-only problem (per CLAUDE.md graceful-degrade rule).
    if (
      typeof idx !== 'number' ||
      idx < 0 ||
      idx >= questions.length ||
      !gResult.needsGraph ||
      !gResult.graphData
    ) {
      continue
    }

    const gd = gResult.graphData

    // 1. Map nlPoints → points for numberline compatibility.
    if (gd.type === 'numberline' && gd.nlPoints) {
      gd.points = gd.nlPoints
      delete gd.nlPoints
    }

    // 2. Clean null fields at top level (LLM JSON Schema emits nulls
    //    for omitted optional fields; downstream code prefers absent keys).
    Object.keys(gd).forEach(k => { if (gd[k] === null) delete gd[k] })

    // 3. Clean null fields inside secondShape; drop it entirely if
    //    empty/shape-less. secondShape without a shape is meaningless.
    if (gd.secondShape) {
      Object.keys(gd.secondShape).forEach(k => {
        if (gd.secondShape[k] === null) delete gd.secondShape[k]
      })
      if (!gd.secondShape.shape) delete gd.secondShape
    }

    // 4. Fix side ordering: re-derive from question text so that an LLM
    //    that confused [AB,BC,CA] for [BC,CA,AB] gets corrected.
    if (gd.type === 'shape' && gd.labels && gd.sides) {
      gd.sides = fixSideOrder(questions[idx].question, gd.labels, gd.sides)
    }

    // 5. Defensive sanitisation: clamp range, null-out asked sides/angles,
    //    re-extract missing quadrilateral sides, and similar.
    sanitizeGraphData(questions[idx].question, gd)

    // 6. Attach.
    questions[idx].graphData = gd
    appliedCount++
  }

  return { appliedCount }
}
