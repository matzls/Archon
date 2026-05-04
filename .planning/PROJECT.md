# Archon

## What This Is

Archon is Mase's personalized Codex-focused fork of Archon. This project tracks the fork-local workflow surface that makes Archon reliable for Codex-driven planning, implementation, validation, and operator handoff.

## Core Value

Codex-facing Archon workflows are honest, narrow, and reliable enough that Mase can trust the workflow state, paused output, validation evidence, and PR-ready handoff.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

None yet in this GSD workspace. Some ingested PRDs are source-marked implemented, but this workspace has not independently verified them.

### Active

<!-- Current scope. Building toward these. -->

- [ ] Reliable paused approval metadata and semantic paused-output contract.
- [ ] Web approval surfaces show useful paused output without bloating routine status payloads.
- [ ] Non-Web paused-output adapters stay tiered and prefer semantic previews where justified.
- [ ] Workflow execution graph nodes can show human-readable purpose labels.
- [ ] `archon-piv-loop-codex-v2` provides a serious one-slice Codex delivery workflow with review gates, validation separation, and durable PR handoff.

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Strict Claude/Codex workflow parity - the fork decision is to keep the Codex surface intentionally narrow and honest.
- Hidden multi-slice orchestration inside `archon-piv-loop-codex-v2` - V2 may intake large requests, but each run executes exactly one selected slice.
- Large paused-output payloads in routine status responses - full output should use the existing worker conversation logs path.
- New filesystem log-reading endpoint for paused output - existing worker conversation history remains the authoritative full-output source.
- Builder canvas editing/rendering and retroactive graph relabeling for display names - phase 1 display-name work is execution-graph only.

## Context

This repository is Mase's personalized Archon fork and source for the Codex-first Archon operating surface. The fork-local operating model says host skills, bundled install behavior, Codex/PIV workflows, commands, and upstream sync behavior need extra care before changes.

Skill surfaces form a packaged chain: `.agents/skills/archon/` -> `.claude/skills/archon/` -> `packages/cli/src/bundled-skill.ts`. Mase's global Codex runtime overlay at `/Users/mase/.codex/skills/archon/` may intentionally diverge, so it should be diffed and classified before overwriting.

The PRD-first ingest found no blockers, no warnings, and no info conflicts. It intentionally narrowed scope to PRD/design context and preserved the existing `.planning/codebase/` mapping.

## Constraints

- **Codex surface strategy**: Keep visible Codex workflows curated and honest; ship only when repo defaults, bundled defaults, discovery tests, metadata, and operator docs agree.
- **PIV V2 tier model**: `archon-piv-loop-codex-v2` must be stronger than simple V1 PIV and lighter than the local heavy campaign system.
- **One slice per run**: V2 may create or refresh design docs and slice maps, but a run executes exactly one selected slice.
- **Integration branch persistence**: Multi-slice delivery must preserve the selected integration branch as both slice start point and default PR base.
- **Artifact authority**: PRDs own requirements, design docs own architecture/tradeoffs, slice maps own campaign inventory/status, and focused slice plans own executable implementation contracts.
- **Review gates**: Planning peer review blocks implementation until findings are fixed, deferred with reason, or explicitly waived; implementation peer review runs after code validation and before closeout.
- **Validation split**: Code validation and final live validation are distinct; runtime behavior changes need live proof when feasible or an explicit waiver.
- **Fork-local safety**: Upstream skill, workflow, command, and bundled installer deltas should be classified as port, adapt, preserve, drop, or defer before applying.

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision                                                                                                                   | Rationale                                                                                           | Outcome   |
| -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------- |
| Treat this fork as Codex-first for local usage with a narrow curated workflow surface.                                     | Prevents thin pseudo-parity with Claude-oriented defaults and keeps shipped workflow claims honest. | - Pending |
| Keep `archon-piv-loop-codex` as the reference-quality Codex workflow and `archon-assist-codex` as the general assist lane. | Gives operators a small, dependable workflow set instead of many ambiguous choices.                 | - Pending |
| Defer thin pseudo-parity defaults until genuinely Codex-native.                                                            | Avoids exposing workflow names that imply maturity the implementation does not have.                | - Pending |
| Do not treat shared `archon-workflow-builder` as Codex-safe by default.                                                    | A dedicated Codex builder variant should wait until capability boundaries are verified.             | - Pending |

---

_Last updated: 2026-05-04 after PRD-first project initialization_
