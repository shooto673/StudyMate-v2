// Tests for lib/stage2Candidates.js — the candidate selection helper for Stage 2.
//
// Coverage:
//   • needsGraph=false questions are excluded from candidates
//   • needsGraph=true questions are included
//   • questions without a needsGraph field (undefined) are included as fallback candidates
//   • empty input returns empty array
//   • all-false returns empty (Stage2 skipped)
//   • mixed values return correct original indices
import assert from 'node:assert/strict'
import { selectCandidateIndices } from '../lib/stage2Candidates.js'

export default [
  {
    name: 'needsGraph=false questions are excluded from candidates',
    fn: async () => {
      const qs = [
        { question: 'Q0', needsGraph: false },
        { question: 'Q1', needsGraph: true },
        { question: 'Q2', needsGraph: false },
      ]
      assert.deepStrictEqual(selectCandidateIndices(qs), [1])
    },
  },
  {
    name: 'needsGraph=true questions are all included as candidates',
    fn: async () => {
      const qs = [
        { question: 'Q0', needsGraph: true },
        { question: 'Q1', needsGraph: true },
      ]
      assert.deepStrictEqual(selectCandidateIndices(qs), [0, 1])
    },
  },
  {
    name: 'questions without needsGraph field (undefined) are fallback candidates',
    fn: async () => {
      const qs = [
        { question: 'Q0' },
        { question: 'Q1', needsGraph: false },
        { question: 'Q2' },
      ]
      assert.deepStrictEqual(selectCandidateIndices(qs), [0, 2])
    },
  },
  {
    name: 'empty questions array returns empty candidates',
    fn: async () => {
      assert.deepStrictEqual(selectCandidateIndices([]), [])
    },
  },
  {
    name: 'all needsGraph=false returns no candidates (Stage2 will be skipped)',
    fn: async () => {
      const qs = [
        { question: 'Q0', needsGraph: false },
        { question: 'Q1', needsGraph: false },
      ]
      assert.deepStrictEqual(selectCandidateIndices(qs), [])
    },
  },
  {
    name: 'mixed values: returned indices are original positions in the questions array',
    fn: async () => {
      const qs = [
        { question: 'Q0', needsGraph: false },
        { question: 'Q1' },
        { question: 'Q2', needsGraph: true },
        { question: 'Q3', needsGraph: false },
        { question: 'Q4', needsGraph: true },
      ]
      assert.deepStrictEqual(selectCandidateIndices(qs), [1, 2, 4])
    },
  },
]
