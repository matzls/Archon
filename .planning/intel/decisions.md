# Synthesized Decisions

## DEC-codex-first-workflow-surface-strategy

source: docs/design/codex-first-workflow-surface-strategy.md

title: Codex-First Workflow Surface Strategy

status: proposed

locked: false

scope: Codex workflows, Archon workflow defaults, bundled defaults, workflow builder, PIV loop, asset parity, capability crosswalk.

decision:

- Treat this fork as Codex-first for local usage by keeping the visible Codex workflow surface intentionally narrow, curated, and honest.
- Keep `archon-piv-loop-codex` as the reference-quality Codex workflow and keep `archon-assist-codex` as the general Codex assist lane.
- Remove or defer thin pseudo-parity defaults, including the provisional `archon-feature-development-codex`, until they are genuinely Codex-native.
- Do not treat the shared `archon-workflow-builder` as Codex-safe; design a dedicated Codex workflow-builder variant only after the capability boundary is verified.
- Require repo defaults, bundled defaults, discovery tests, metadata, and operator docs to agree before a Codex workflow is considered shipped.

notes:

- This is a design/policy ADR rather than an implementation plan.
- It aligns with the later Codex PIV V2 PRD and SPEC, which add a new serious one-slice Codex workflow tier without claiming broad Claude parity.
