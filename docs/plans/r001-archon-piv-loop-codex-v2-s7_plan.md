---
title: "Archon PIV Loop Codex V2 S7 — PR or PR-review handoff — Plan"
kind: plan
status: draft
created: 2026-04-27
updated: 2026-04-27
origin_prd: "docs/prd/r001-archon-piv-loop-codex-v2.md"
origin: ""
version: "0.1"
---

## ELI5 Summary (Read This First)

- What we're doing: turn `S7` from the PRD execution map into a focused executable slice without widening scope.
- Why we're doing it: the orchestrator needs a concrete slice draft so planning and freeze can converge on the named boundary instead of starting from a blank template.
- What "done" looks like: the repo ships `S7` exactly within `Execution Map row` plus the Execution Map note: PR or PR-review handoff and proves it with focused validation.
- How we'll do it: ground the current repo truth, lock the slice contract and docs, implement the smallest load-bearing surface, then validate and sync the affected docs.
- Next step / resume point: run `refine_all` on this seeded slice and only add more scope if current repo evidence proves it is required.

### Optional Mental Model

- Treat this slice as a scoped receipt for one PRD row: the plan should explain exactly how `S7` lands without borrowing work from later rows.

## 1) Problem Statement
`Archon PIV Loop Codex V2` is already split into execution slices, but `S7` needs a focused plan that keeps the implementation boundary aligned with the PRD instead of expanding into adjacent slice work. The PRD already names the intended surface for this slice; this seeded draft turns that row into an executable workflow artifact.

## 2) Solution Concept (High-Level)
- Keep `S7` anchored to `Execution Map row` plus the Execution Map note: PR or PR-review handoff.
- Ground the slice against the current repo code, docs, and tests before changing implementation.
- Prefer the smallest producer/consumer boundary that satisfies `S7` without opening neighboring slices early.
- Use focused repo-local validation and doc sync as the initial proof shape for this slice.

## 3) Scope / Non-Goals
- In scope: PR or PR-review handoff
- In scope: code, contract docs, and tests directly required by `Execution Map row`.
- Non-goal: widening `S7` into neighboring execution-map rows during the first refine/freeze pass.
- Non-goal: inventing a brand-new UX or runtime surface unless the current repo boundary cannot satisfy this slice.

## 4) Architecture Overview

```mermaid
flowchart LR
    A["PRD S7 scope"] --> B["Focused slice plan"]
    B --> C["Scoped implementation"]
    C --> D["Focused validation and doc sync"]
```

## 5) Decision Options per Area

### A. Slice boundary
| Option | Pros | Cons | Effort |
|--------|------|------|--------|
| A1. Keep `S7` scoped to `Execution Map row` and the row note | Preserves deterministic sequencing and protects neighboring slices | Optional polish can wait for later slices | Low |
| A2. Widen `S7` into adjacent concerns during the first pass | May reduce a later handoff | Breaks slice isolation and makes orchestration less predictable | High |

**Choice:** [x] A1  [ ] A2

## Plan Status & Controls
- Plan Status: Draft (as of 2026-04-27)
- Current Phase: P0 — Grounding
- Last Updated: 2026-04-27
- Last Reviewed: 2026-04-27
- Next Checkpoint: refine this seeded slice against current repo reality, then freeze only if no real blockers remain
- E2E Gate: not_required
- E2E Waiver Category: internal_tooling
- E2E Waiver Rationale: This seeded slice targets contract, workflow, or internal runtime surfaces. Focused repo-local validation is the required proof shape before any broader end-to-end coverage is considered.
- Canonical task location: Section 6 (Phased Execution Plan)

**Terminology & Actors (Workflow Defaults):**
- **[LBA]** = **Load-Bearing Assumption** (must be verified before freeze/implementation).
- **[Q]** = Open Question (blocking only when placed under `### Blockers` in Unresolved Items).
- **People:** Mase.
- **Reserved token:** "LBA" is reserved for load-bearing assumptions only.

> **State file:** Task status tracked in companion `.state.json` file.
> Markdown checkboxes are supplementary for readability. JSON is source of truth.

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
## Phase Summary (Quick View)

| Phase | Phase Status | Tasks (ID: Title — Status) |
|------:|--------------|----------------------------|
| P0 | Proposed | - P0-T1: Ground the current slice boundary against repo reality — proposed<br>- P0-T2: Lock the slice contract and doc surface — proposed |
| P1 | Proposed | - P1-T1: Implement the smallest load-bearing `S7` surface — proposed<br>- P1-T2: Add or update focused validation for the touched surface — proposed |
| P2 | Proposed | - P2-T1: Reconcile docs and prove final slice evidence — proposed |

## 6) Phased Execution Plan

### Phase 0 — Grounding And Contract Lock

- [ ] P0-T1: Ground the current slice boundary against repo reality
  - Test Impact: N/A
  - Commands to Run:
    - inspect `docs/prd/r001-archon-piv-loop-codex-v2.md` and the directly implicated repo surfaces for `S7`
    - record the current runtime, contract, and doc truth that this slice must preserve or change
  - Exit Criteria:
    - the plan captures the current repo truth for `S7`
    - adjacent slice work is explicitly kept out of scope
  - Verify Commands:
    - `python3 "${CODEX_HOME:-$HOME/.codex}/skills/.shared/workflow/scripts/plan_readiness.py" --plan-path docs/plans/r001-archon-piv-loop-codex-v2-s7_plan.md --format markdown`

- [ ] P0-T2: Lock the slice contract and doc surface
  - Test Impact: N/A
  - Commands to Run:
    - update this focused plan after the grounding pass
    - identify the exact docs and contracts that must stay in sync with `S7`
  - Exit Criteria:
    - the plan, code boundary, and doc surface describe the same slice
    - no first-pass scope gap remains inside `Execution Map row`
  - Verify Commands:
    - `rg -n "S7|Execution Map row" docs`

### Phase 1 — Scoped Implementation

- [ ] P1-T1: Implement the smallest load-bearing `S7` surface
  - Test Impact: update
  - Commands to Run:
    - modify only the code and docs required to land `S7`
    - keep neighboring execution-map rows untouched unless the PRD contract proves coupling
  - Exit Criteria:
    - PR or PR-review handoff
    - the implementation boundary still matches `Execution Map row`
  - Verify Commands:
    - run the focused repo-local validation for the touched surface

- [ ] P1-T2: Add or update focused validation for the touched surface
  - Test Impact: add
  - Commands to Run:
    - update the nearest existing test surface or add a small focused test where coverage is missing
    - capture the validation evidence needed for freeze and post-freeze review
  - Exit Criteria:
    - the load-bearing behavior of `S7` has direct validation coverage
    - validation proves the slice without depending on unrelated later-slice work
  - Verify Commands:
    - run the focused test command chosen during P0 grounding

### Phase 2 — Validation And Doc Sync

- [ ] P2-T1: Reconcile docs and prove final slice evidence
  - Test Impact: N/A
  - Commands to Run:
    - sync the touched docs, plan state, and validation evidence after implementation
    - confirm the final slice still matches the execution-map row
  - Exit Criteria:
    - docs, code, and tests agree on the landed `S7` surface
    - the slice is ready for freeze/review without hidden follow-on scope
  - Verify Commands:
    - `python3 "${CODEX_HOME:-$HOME/.codex}/skills/.shared/workflow/scripts/plan_readiness.py" --plan-path docs/plans/r001-archon-piv-loop-codex-v2-s7_plan.md --format markdown`

## Current Inputs (single source of truth)
- Feature: `Archon PIV Loop Codex V2`
- Feature PRD: `docs/prd/r001-archon-piv-loop-codex-v2.md`
- Planning shape: umbrella + slices
- Feature PRD section(s): `Execution Map row`
- Specs / contracts (if any):
  - use the active design/spec docs directly implicated by `S7` during P0 grounding
- Goals:
  - deliver `S7` without widening into later slices
  - keep the focused plan, code, and docs aligned to the same execution-map row
- Non-Goals:
  - adjacent slice implementation
  - speculative abstraction beyond the named slice boundary
- Constraints/Interfaces:
  - follow the current repo contracts before introducing new ones
  - keep changes scoped to the smallest load-bearing surface
- Testing (only if code changes):
  - Test posture: `unit=happy-path`, `integration=critical-only`
  - Test suite status: use the nearest existing repo-local validation surface for `S7`
  - Primary test command(s): record the focused command selected during P0 grounding and keep it tied to the touched surface
  - Test locations: the nearest existing tests for the code touched by `S7`
  - Waivers: if code changes are not required after grounding, record the exact rationale in the plan update
- Owner/Stakeholders: Mase
- Definition of Done: `S7` lands exactly within the PRD row boundary and is proven with focused validation evidence.
- Metrics:
  - slice scope stays within `Execution Map row`
  - validation covers the load-bearing behavior changed by `S7`
- Deadlines: maintain deterministic progress; no separate external deadline is assumed for the seeded draft
- Dependencies:
  - the origin PRD remains the scope authority
  - neighboring slices remain separate unless current repo evidence proves coupling
- Risk tolerance: low; prefer the narrowest safe change

## References (authoritative)
- Source order: vendor docs > official repos/examples > repo code > community posts
- Pin URL + accessed date (+ version/tag/commit)
- Initial:
  - `docs/prd/r001-archon-piv-loop-codex-v2.md` — repo PRD authority (accessed 2026-04-27)
  - `docs/plans/r001-archon-piv-loop-codex-v2-s7_plan.md` — focused slice execution ledger (accessed 2026-04-27)

## Doc Surface Map (Project Docs Only)
Purpose: enumerate project-facing docs that must match implementation reality at closeout.

Explicit exclusions (handled outside the PIV loop closeout): Project Brief, Feature PRDs, `CLAUDE.md`, `memory/projects/`.

| Area | File/Path | Action (must-edit / review-only / N/A) | Notes (what to check) |
| --- | --- | --- | --- |
| README | `README.md` | review-only | Check whether `S7` changes operator-facing workflow or setup guidance. |
| Env contract (.env.example) | `.env.example` | N/A | Update only if this slice introduces or changes a runtime env contract. |
| Integration docs | `docs/design/` | review-only | Review the active design docs directly implicated by `S7`. |
| API docs/schema docs | `docs/specs/` | review-only | Promote to must-edit only for the exact contract docs touched by this slice. |
| Specs/contracts (docs/specs/) | `docs/specs/` | review-only | Keep spec updates scoped to the load-bearing contract for `S7`. |
| Reference docs (docs/reference/) | `docs/reference/` | N/A | Update only if `S7` changes a stable operator runbook. |
| Decisions/ADRs (docs/decisions/) | `docs/decisions/` | N/A | Only needed if the slice introduces a durable architectural decision. |
| Plans (docs/plans/) | `docs/plans/r001-archon-piv-loop-codex-v2-s7_plan.md` | must-edit | This focused plan is the canonical execution ledger for `S7`. |
| Capabilities payload docs/schema | `docs/specs/output-format.md` | review-only | Review if `S7` touches emitted payload or packet shape. |
| Other project docs | `docs/prd/r001-archon-piv-loop-codex-v2.md` | N/A | The feature PRD is the scope anchor and is maintained separately from slice closeout. |

## Doc Sync Log
- 2026-04-27: Seeded focused slice draft from the PRD execution map so the orchestrator can refine from a concrete boundary instead of a blank template.
