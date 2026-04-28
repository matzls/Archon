---
title: Lessons Learned
kind: reference
status: active
created: 2026-04-27
updated: 2026-04-28
---

# Lessons Learned

## Active Gotchas (Read First)
- _(None.)_

## Active Lessons
- _(None.)_

## 2026-04-27 — Archon PIV Loop Codex V2 S1

Plan: `docs/plans/r001-archon-piv-loop-codex-v2-s1_plan.md`

- In sandboxed worktrees, Bun install may need a repo-local temp/cache path and `--backend=copyfile` before targeted workflow proof commands can run.
- A V1-derived workflow skeleton can reuse the existing `archon-piv-loop-codex` companion note when Slice 1 preserves the same context-reset behavior and keeps new V2 deferrals explicit in the YAML.

## 2026-04-27 — r001-archon-piv-loop-codex-v2-s2

- Plan: `docs/plans/r001-archon-piv-loop-codex-v2-s2_plan.md`
- The Codex PIV V2 plan-path migration must update the writer and every downstream reader together; partial migration leaves stale plan discovery paths in review/finalize nodes.
- For campaign recovery after a timed-out child, regenerate deterministic implementation and validation manifests after the recovery commits so `assert_complete` compares against the current clean/dirty worktree hash.
- Evidence: `artifacts/workflow/implementation-reports/r001-archon-piv-loop-codex-v2-s2-plan-2026-04-27-implement.json` and `artifacts/workflow/validation-reports/r001-archon-piv-loop-codex-v2-s2-plan-2026-04-27-validate.json`.

## 2026-04-27 — r001-archon-piv-loop-codex-v2-s3

- Plan: `docs/plans/r001-archon-piv-loop-codex-v2-s3_plan.md`
- Loop-node typed gates need both runtime `output_format` forwarding and a `loop.decision_gate` contract; otherwise sentinel detection remains the compatibility proof surface.
- When Bun cannot write its default temp/cache path in a sandboxed worktree, rerun focused proof commands with a writable temp/cache and `--backend=copyfile` before treating dependency resolution failures as code regressions.

## 2026-04-27 — r001-archon-piv-loop-codex-v2-s4

- Plan: `docs/plans/r001-archon-piv-loop-codex-v2-s4_plan.md`
- LBA resolution must update the plan state sidecar via `state_manager.py --action set_unresolved`; markdown-only evidence is not enough for deterministic readiness gates.

## 2026-04-28 — r001-archon-piv-loop-codex-v2-s4

- Plan: `docs/plans/r001-archon-piv-loop-codex-v2-s4_plan.md`
- When Bun cannot write `$HOME/.bun/install/cache` from a sandboxed worktree, set `BUN_INSTALL_CACHE_DIR` to a writable path before running targeted workflow validation commands.
- S4 Mode B intake is safest as a pre-explore branch: classify large/PRD input, create or refresh the design doc, create the slice map, enforce exactly one selected slice, then pass the selected slice into the existing one-slice lane.

## 2026-04-28 — r001-archon-piv-loop-codex-v2-s5

- Plan: `docs/plans/r001-archon-piv-loop-codex-v2-s5_plan.md`
- In sandboxed worktrees with no `node_modules`, `TMPDIR` alone may not be enough for Bun install; use a writable cache directory plus `--backend=copyfile` before rerunning focused CLI proof commands.
- For workflow-contract slices, pair prompt wording with dependency-shape assertions; a finalization gate is not enforceable unless the downstream node depends on the new gate and regression tests reject the old direct dependency.

## 2026-04-28 — r001-archon-piv-loop-codex-v2-s6

- Plan: `docs/plans/r001-archon-piv-loop-codex-v2-s6_plan.md`
- For post-freeze contract-lock phases, resolving an LBA requires updating the state sidecar with `state_manager.py --action set_unresolved`; completing the task alone does not clear the deterministic blocker.
- `assert_complete` treats `docs/reference/lessons_learned.md` as required closeout evidence even when implementation and validation manifests already pass.
- When default workflow YAML changes, rerun `bun run generate:bundled` before `bun run check:bundled`; otherwise bundled-default validation can report a stale generated-default defect after the real workflow change is correct.

## 2026-04-28 — r001-archon-piv-loop-codex-v2-s7

- Plan: `docs/plans/r001-archon-piv-loop-codex-v2-s7_plan.md`
- In post-freeze lanes that only validate LBAs and contract boundaries, regenerate the implementation manifest after validation state transitions; otherwise `assert_complete` can reject the stale state-after snapshot even when the task evidence is correct.
- Contract-lock work is enough to unblock a later freeze only when both the unresolved item and the plan ledger reflect the same checked/validated state.

## 2026-04-28 — r001-archon-piv-loop-codex-v2-s7_plan

- Plan: `docs/plans/r001-archon-piv-loop-codex-v2-s7_plan.md`
- Validation refreshed deterministic workflow evidence for this slice.
- Validation mode: `fast`.
- Worker verdict before `assert_complete`: `pass`.
- Command evidence ok: `true`.
- E2E gate ok before `assert_complete`: `true`.
