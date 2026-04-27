---
title: Lessons Learned
kind: reference
status: active
created: 2026-04-27
updated: 2026-04-27
---

# Lessons Learned

## 2026-04-27 — Archon PIV Loop Codex V2 S1

Plan: `docs/plans/r001-archon-piv-loop-codex-v2-s1_plan.md`

- In sandboxed worktrees, Bun install may need a repo-local temp/cache path and `--backend=copyfile` before targeted workflow proof commands can run.
- A V1-derived workflow skeleton can reuse the existing `archon-piv-loop-codex` companion note when Slice 1 preserves the same context-reset behavior and keeps new V2 deferrals explicit in the YAML.
