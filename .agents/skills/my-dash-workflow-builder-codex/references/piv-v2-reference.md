# Codex PIV V2 Reference

Use this file when building or reviewing `archon-piv-loop-codex-v2`.

## Tier Model

- `archon-piv-loop-codex`: simple guided Codex PIV, already useful and
  Codex-adapted.
- local heavy Codex workflow system: strict multi-slice campaign machinery.
- `archon-piv-loop-codex-v2`: proposed Archon-native middle ground.

V2 should be one serious slice per run. It should not become a hidden campaign
orchestrator.

## Basis

Start from:

- `.archon/workflows/defaults/archon-piv-loop-codex.yaml`
- `.archon/workflows/defaults/archon-piv-loop-codex.README.md`
- `docs/design/codex-piv-v2-workflow-design.md`
- `docs/design/codex-first-workflow-surface-strategy.md`

Do not start from `archon-workflow-builder`.
Do not port the full local heavy workflow into Archon.

## V2 Goals

- stronger planning artifact than V1
- explicit one-slice scope
- optional design-doc and slice-map intake for large requests
- durable focused slice plan
- planning review before implementation
- code validation after implementation
- final live validation for runtime behavior changes
- optional PR-review handoff after a PR exists

## V2 Artifact Model

Recommended durable artifacts:

- `docs/prd/<feature>.prd.md` when product requirements need a durable source
- `docs/design/<feature>.md` for architecture or slicing rationale
- `docs/plans/<feature>_slice_map.md`
- `docs/plans/<feature>-s<n>_plan.md`
- `docs/plans/_advisory-reviews/<feature>-s<n>_plan-peer-review.json`
- `docs/plans/_peer-reviews/<feature>-s<n>_plan-peer-review.json`

Run-scoped evidence:

- `$ARTIFACTS_DIR/e2e-reports/*`
- logs, screenshots, traces, and temporary proof files

Do not make repo docs the raw evidence store. Summarize durable outcomes in
docs and keep heavy proof in artifacts.

## Plan Template Rules

V2 should use a slim Archon-native plan template with:

- YAML frontmatter
- ELI5 summary
- problem statement
- solution concept
- scope and non-goals
- current inputs
- architecture notes
- slice metadata
- plan status and controls
- unresolved items and load-bearing assumptions
- peer review gate
- phased task plan
- code validation commands
- final live validation plan
- documentation surface map
- risks

Do not paste the full local workflow-plan template wholesale into a workflow
prompt.

## Implementation Slices

Recommended order:

1. V2 workflow skeleton copied from V1.
2. V2 plan template and coordinated plan-path contract.
3. Typed phase gates only after the runtime supports them.
4. Design-doc and slice-map mode.
5. Live E2E evidence convention.
6. Planning and implementation review gates.
7. Optional PR-review handoff.

## Stop Conditions

Do not call V2 ready if:

- it still relies on Claude-only node controls for Codex behavior
- a loop completion signal can be emitted before task-scoped validation
- downstream nodes depend on model memory instead of artifacts
- it starts from one base branch and silently opens a PR against another
- it claims live validation when only unit tests or mocks ran
