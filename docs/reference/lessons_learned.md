---
title: Lessons Learned
kind: reference
status: active
created: 2026-04-27
updated: 2026-04-27
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
