---
title: "r001-archon-piv-loop-codex-v2 Orchestration Plan"
kind: plan
status: draft
created: 2026-04-27
updated: "2026-04-27"
origin_prd: "docs/prd/r001-archon-piv-loop-codex-v2.md"
plan_role: umbrella
---

## Purpose

Orchestration-only campaign ledger for `docs/prd/r001-archon-piv-loop-codex-v2.md`.

- This plan coordinates slice sequencing, ownership, and cleanup.
- This plan is not an implementation autopilot target.

## Plan Status & Controls

E2E Gate: not_required
E2E Waiver Category: orchestration_only

## Slice Ledger

| Slice | Plan | Recommended Worktree | Status |
| --- | --- | --- | --- |
| S1 | `docs/plans/r001-archon-piv-loop-codex-v2-s1_plan.md` | `.worktrees/r001-archon-piv-loop-codex-v2-s1` | not started |
| S2 | `docs/plans/r001-archon-piv-loop-codex-v2-s2_plan.md` | `.worktrees/r001-archon-piv-loop-codex-v2-s2` | not started |
| S3 | `docs/plans/r001-archon-piv-loop-codex-v2-s3_plan.md` | `.worktrees/r001-archon-piv-loop-codex-v2-s3` | not started |
| S4 | `docs/plans/r001-archon-piv-loop-codex-v2-s4_plan.md` | `.worktrees/r001-archon-piv-loop-codex-v2-s4` | not started |
| S5 | `docs/plans/r001-archon-piv-loop-codex-v2-s5_plan.md` | `.worktrees/r001-archon-piv-loop-codex-v2-s5` | not started |
| S6 | `docs/plans/r001-archon-piv-loop-codex-v2-s6_plan.md` | `.worktrees/r001-archon-piv-loop-codex-v2-s6` | not started |
| S7 | `docs/plans/r001-archon-piv-loop-codex-v2-s7_plan.md` | `.worktrees/r001-archon-piv-loop-codex-v2-s7` | not started |


## Unresolved Items (Canonical)

Rules:
- Unresolved items are canonical in `<plan>.state.json`.
- Edit via `state_manager.py --action set_unresolved`; markdown is rendered output.
- `[LBA]` items are always blocking until checked.
- `[Q]` items block only when placed under `### Blockers`.
- Default scope is phases `P1+` unless explicitly tagged.

### Blockers (must resolve before freeze)
- (none)

### FYI / Later (does not block freeze)
- (none)
