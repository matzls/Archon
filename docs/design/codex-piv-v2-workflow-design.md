---
title: Codex PIV V2 Workflow Design
status: draft
created: 2026-04-26
updated: 2026-04-26
---

# Design Doc: Codex PIV V2 Workflow

## 1. Purpose

Define a middle-ground Codex PIV workflow for Archon.

This document captures the current design direction:

- keep the current `archon-piv-loop-codex` as the simple V1 lane
- keep the local Codex workflow system for heavy multi-slice campaign work
- create `archon-piv-loop-codex-v2` as an Archon-native one-slice workflow
  with stronger planning, typed gates, live validation, and optional PR-review
  handoff

This is a design anchor, not yet an implementation plan.

## 2. Short Version

Codex PIV V2 should be:

- more structured than current Archon Codex PIV
- much lighter than the local Codex campaign/orchestrator system
- native to Archon's workflow engine and web UI
- scoped to one executable slice per run
- able to create a design doc and slice map when the incoming request is too
  large for one run
- able to execute exactly one selected slice from plan to PR/review handoff

```mermaid
flowchart TD
  A["Current Archon Codex PIV (V1)"] --> B["Simple guided tasks"]
  C["Local Codex PIV system"] --> D["Heavy multi-slice campaigns"]
  E["New Archon Codex PIV V2"] --> F["One serious slice per run"]

  F --> G["Optional design doc"]
  F --> H["Optional slice map"]
  F --> I["Focused plan"]
  F --> J["Implementation"]
  F --> K["Live E2E validation"]
  F --> L["PR / review handoff"]
```

## 3. Workflow Tier Model

### 3.1 V1: Simple Archon Codex PIV

Use `archon-piv-loop-codex` for bounded tasks where a single guided plan is
enough.

Strengths:

- simple Archon-native operator flow
- visible workflow run in Archon
- existing Codex-specific prompt discipline
- low ceremony

Weaknesses:

- still too prompt-signal dependent
- weaker task-state tracking
- limited planning depth
- no first-class design-doc or slicing lane
- live E2E expectations are not strong enough yet

### 3.2 Local Heavy PIV

Keep the local Codex workflow system for large, strict, multi-slice campaigns.

Strengths:

- campaign state
- plan sidecars
- freeze gates
- task status ledger
- snapshot gates
- deterministic validation and closeout artifacts
- strong resume semantics

Weaknesses:

- too heavy for normal Archon product usage
- difficult to explain
- depends on many local scripts and state surfaces
- not yet a simple user-facing workflow model

### 3.3 V2: Middle-Ground Archon Codex PIV

Use `archon-piv-loop-codex-v2` for serious but still one-slice work.

Target:

- one run executes one selected slice
- large requests can be decomposed first, but V2 does not own the whole
  campaign automatically
- the operator manually starts the next V2 run for the next slice
- integration branch accumulation remains explicit and human-controlled

## 4. Operator Model

V2 should support two entry modes.

### Mode A: Focused Request

The input is already small enough.

```mermaid
flowchart TD
  A["Focused request"] --> B["Explore"]
  B --> C["Create focused plan"]
  C --> D["Freeze / approve plan"]
  D --> E["Implement"]
  E --> F["Live validation"]
  F --> G["Create PR"]
  G --> H["Optional Codex PR review handoff"]
```

### Mode B: Large Request / PRD

The input is too large for one PIV run.

```mermaid
flowchart TD
  A["Large request or PRD"] --> B["Explore and size"]
  B --> C["Create design doc"]
  C --> D["Create slice map"]
  D --> E["Select one slice"]
  E --> F["Create focused slice plan"]
  F --> G["Run normal one-slice PIV"]
  G --> H["Merge slice into integration branch"]
  H --> I["Start a new V2 run for next slice"]
```

V2 should not run all slices automatically. It may create a slice map, but one
workflow run should execute one selected slice.

## 5. Integration Branch Model

For multi-slice features, V2 should assume an explicit integration branch.

```mermaid
gitGraph
  commit id: "dev"
  branch feature-integration
  checkout feature-integration
  commit id: "design + slice map"
  branch slice-1
  checkout slice-1
  commit id: "slice 1 implementation"
  commit id: "slice 1 validation"
  checkout feature-integration
  merge slice-1
  branch slice-2
  checkout slice-2
  commit id: "slice 2 implementation"
  commit id: "slice 2 validation"
  checkout feature-integration
  merge slice-2
```

Default operating rule:

- one slice branch per V2 run
- one PR per slice, unless the operator explicitly chooses final-integration
  PR style
- merge decisions stay human-owned
- the next slice run starts from the updated integration branch

## 6. Artifact Model

V2 should create fewer artifacts than the local heavy workflow, but stronger
artifacts than V1.

Recommended artifacts:

- design doc: `docs/design/<feature>.md` when the input needs architecture or
  slicing
- slice map: `docs/plans/<feature>_slice_map.md` or equivalent
- focused slice plan: `docs/plans/<feature>-s<n>_plan.md`
- live validation evidence: `artifacts/workflow/e2e-reports/*`
- PR body draft or PR creation payload
- optional PR review handoff packet

Avoid in V2 initially:

- full campaign runner state
- automatic cross-slice advancement
- local-heavy snapshot gate machinery
- strict closeout cleanup ladder
- hidden multi-run orchestration

## 7. Plan Template Recommendation

### 7.1 Do Not Use The Current Archon V1 Template Unchanged

The current `archon-piv-loop-codex` embedded plan template is useful because it
is small and direct, but it is too light for V2.

Gaps:

- no frontmatter
- no explicit plan status controls
- no canonical current inputs section
- no unresolved-item/LBA model
- no first-class E2E gate
- no slicing metadata
- no clear doc-surface map
- no structured phase/task status model

It is still appropriate for V1, but V2 needs more control.

### 7.2 Do Not Import The Full Local Template Wholesale

The local workflow-plan template is much stronger, but it is too heavy to paste
directly into an Archon YAML prompt as the normal V2 template.

Strengths worth borrowing:

- ELI5 summary first
- plan status and controls
- explicit current inputs
- planning shape
- acceptance criteria coverage
- outcome evaluation scenarios
- E2E gate
- unresolved items / load-bearing assumptions
- phased execution plan
- documentation surface map

Parts to keep out of V2 initially:

- full sidecar authority language
- full campaign closeout semantics
- strict local workflow cleanup ladder
- broad workflow library internals

### 7.3 Recommended Basis

Create a new **Archon PIV V2 plan template**.

It should be derived from the local workflow-plan template's structure, but
reduced and adapted for Archon-native operation.

Recommended V2 plan sections:

1. YAML frontmatter
2. ELI5 Summary
3. Problem Statement
4. Solution Concept
5. Scope / Non-Goals
6. Current Inputs
7. Design / Architecture Notes
8. Slice Metadata
9. Plan Status & Controls
10. Unresolved Items / LBAs
11. Phased Task Plan
12. Live E2E Validation Plan
13. Validation Commands
14. Documentation Surface Map
15. Risks

The V2 template should become the serious Archon Codex template. V1 can keep a
lighter template, but both should eventually share the same core contract:

- clear scope
- concrete task list
- task-scoped verification
- live E2E requirement when behavior changes
- explicit out-of-scope boundaries

## 8. Live E2E Requirement

V2 should tighten the meaning of end-to-end validation.

Unit tests, mocks, and simulated integration tests are useful but not enough to
prove a feature works in the running system.

Default requirement:

- if a slice changes runtime behavior, the plan must define a live validation
  proof
- the proof should exercise the real app/service path when feasible
- the proof should write or reference evidence under
  `artifacts/workflow/e2e-reports/`

Preferred proof order:

1. automated browser or API flow against a running local app
2. real CLI/API smoke against the changed integration path
3. manual UI smoke with agent-runnable supporting proof
4. explicit waiver only when live validation is genuinely not possible

Examples:

- start server, call real endpoint, assert response shape
- start web UI, complete the actual workflow in browser automation
- run CLI command against a real fixture repo and verify generated artifacts
- capture screenshot path plus logs for manual UI confirmation

Non-goal:

- do not treat unit tests as live E2E merely because they cover many layers

This should also be considered for the local workflow planning template as a
separate improvement slice, because the local template already has an E2E gate
but the wording should more strongly prefer live system proof.

## 9. PR Review Integration

V2 should not embed the full `my-codex-pr-review` loop immediately.

Recommended staging:

1. V2 creates a PR or PR-ready payload.
2. V2 emits a clear handoff: PR URL, branch, validation evidence, and whether
   remote Codex PR review is recommended.
3. A later `archon-codex-pr-review` workflow can mirror the local
   `my-codex-pr-review` loop.
4. V2 can optionally call or route to that workflow once the PR-review workflow
   is mature.

Reason:

- remote Codex PR review assumes an existing PR
- it needs GitHub state, branch cleanliness, push access, and repeated polling
- that is a clean downstream gate, not part of the core PIV loop

## 10. Implementation Basis

Recommended basis:

- start from `archon-piv-loop-codex`
- create `archon-piv-loop-codex-v2`
- borrow design and state ideas from the local Codex workflow system
- do not cut over or embed the local heavy workflow as-is
- do not write V2 entirely from scratch unless the V1 YAML becomes harder to
  evolve than to replace

Why:

- current Archon Codex PIV is already Codex-adapted
- it already matches Archon's DAG/workflow UI model
- it is easier to review incremental changes from V1 to V2
- local heavy PIV is better treated as a pattern library than as product code
  to import

## 11. Proposed V2 Build Slices

### Slice 1: V2 Workflow Skeleton

- copy `archon-piv-loop-codex` to `archon-piv-loop-codex-v2`
- rename and describe it as a one-slice serious workflow
- keep behavior close to V1
- add tests/bundling parity if needed

### Slice 2: Plan Template And Artifact Paths

- introduce the V2 plan template
- move from `.claude/archon/plans/` to an Archon/Codex-neutral path if feasible
- add slice metadata and live E2E sections
- keep V1 untouched unless explicitly migrated

### Slice 3: Typed Phase Gates

- replace model-sentinel phase advancement with typed decisions where runtime
  support exists
- distinguish continue-feedback from phase-advance
- pilot on V2 before changing V1

### Slice 4: Design Doc And Slice Map Mode

- add optional design-doc creation
- add optional slice-map creation
- select exactly one slice for execution
- avoid automatic multi-slice orchestration

### Slice 5: Live E2E Evidence

- require live validation for runtime behavior changes
- define evidence output conventions
- add fallback/waiver rules

### Slice 6: Optional PR Review Handoff

- after PR creation, emit a structured handoff for remote Codex PR review
- later integrate with a dedicated Archon PR-review workflow

## 12. Open Questions

- What should the neutral plan path be?
  - candidate: `.archon/plans/{slug}.plan.md`
  - candidate: `docs/plans/{slug}_plan.md`
- Should V2 always write design docs under `docs/design/`, or only when the
  request is too large for a direct plan?
- Should slice maps live under `docs/plans/` or `docs/design/`?
- Should V2 create slice PRs directly, or stop at PR-ready payload first?
- Should V1 eventually adopt the V2 core plan template, or remain intentionally
  minimal?

## 13. Current Recommendation

Build V2 as an evolution of current Archon Codex PIV, not a port of local heavy
PIV.

Use the local workflow-plan template as the design source for planning quality,
but create a slim Archon-native V2 plan template rather than copying the full
local template.

Keep the workflow tiering explicit:

- `archon-piv-loop-codex`: simple guided PIV
- `archon-piv-loop-codex-v2`: one serious slice per run
- local Codex workflow system: strict multi-slice campaign execution

Tags:

- `#codex-piv-v2`
- `#archon-native`
- `#one-slice-per-run`
- `#design-doc-intake`
- `#lightweight-slicing`
- `#live-e2e-required`
- `#borrow-local-discipline`
- `#do-not-port-heavy-orchestrator`
