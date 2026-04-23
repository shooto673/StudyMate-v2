---
name: problem-validator
description: Validate generated math problem objects. Use when debugging wrong answers, broken choices, inconsistent explanations, or validation design.
---

# Problem Validator Skill

## Goal
Check whether a generated math problem is internally consistent before it is returned to the user.

## What to inspect
- question
- choices
- correctIndex
- correctAnswer
- explanation
- hint
- graphData if present
- unitTitle / subUnitTitle / internal unit IDs if present

## Validation checklist
1. correctAnswer must exist in choices.
2. correctIndex must be within range.
3. choices[correctIndex] must match correctAnswer.
4. explanation must support the same answer as correctAnswer.
5. The problem must have a single intended answer.
6. If graphData exists, it must not leak the asked answer visually.
7. If graphData is invalid, recommend degrading to text-only instead of returning invalid figure data.

## Output format
When reporting:
- State the failure point.
- Classify severity:
  - CRITICAL = must not return to user
  - WARNING = should fix but may still render
- Suggest the smallest safe fix.
- If needed, propose a regression test case.

## Important rule
Do not silently patch mathematical meaning in the frontend.
Server-side validation is the source of truth.
