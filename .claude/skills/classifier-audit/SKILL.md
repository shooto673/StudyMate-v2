---
name: classifier-audit
description: Audit StudyMate's unit classification and route selection. Use when solver-first does not trigger, or when a unit seems routed to the wrong generator.
---

# Classifier Audit Skill

## Goal
Check whether unit classification and route selection are correct.

## What to inspect
- UI labels
- internal unit IDs
- SUBUNIT_MATRIX or equivalent mapping
- classifier rules
- solver-first coverage list
- fallback route rules

## Audit checklist
1. Is the routing based on internal IDs rather than fragile display labels?
2. Does the target unit belong to solver-first coverage?
3. If not, is the fallback route intentional?
4. Could a label mismatch cause a wrong route?
5. Does the current route match the project rules in CLAUDE.md?

## Output format
Report:
- expected route
- actual route
- mismatch cause
- smallest safe fix
