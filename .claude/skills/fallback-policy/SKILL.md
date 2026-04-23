---
name: fallback-policy
description: Decide safe fallback behavior for generation failures in StudyMate. Use when graphData fails, validation fails, or a generation route is unstable.
---

# Fallback Policy Skill

## Goal
Choose the safest fallback path when generation does not fully succeed.

## Decision order
1. If solver-first output is valid, use it.
2. If solver-first output fails but a safe LLM path exists, use the safe LLM path.
3. If the problem is valid but graphData is invalid, return text-only problem.
4. If the problem object is invalid, regenerate.
5. If regeneration fails repeatedly, return a safe cached problem.

## Rules
- Never return a problem with inconsistent answer fields.
- Never return invalid graphData just because the text problem is correct.
- Prefer degraded but valid output over rich but broken output.

## Output format
Return:
- failure type
- safest fallback
- reason
- whether this should trigger a new regression test
