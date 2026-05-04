// lib/stage2Candidates.js
// Pure helper: select which question indices should be processed by Stage 2.
//
// Selection rules:
//   needsGraph=false  → skip (Stage 1 already determined no graph needed)
//   needsGraph=true   → candidate
//   needsGraph absent → fallback candidate (let Stage 2 decide via visual detection)
export function selectCandidateIndices(questions) {
  return questions.map((_, i) => i).filter(i => questions[i].needsGraph !== false)
}
