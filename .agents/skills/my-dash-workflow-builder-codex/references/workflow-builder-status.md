# Workflow Builder Status

Use this file when deciding whether to rely on Archon's current Workflow Builder
surfaces for Codex workflow authoring.

## Current YAML Workflow Builder

File:

- `.archon/workflows/defaults/archon-workflow-builder.yaml`

Current status in this fork:

- It appears in workflow discovery and validates structurally after the
  placeholder output-reference repair.
- It remains provider-neutral and still contains Claude-oriented prompt
  guidance such as `allowed_tools` and `denied_tools`.
- If Archon defaults to Codex, validation can warn that those tool restrictions
  are ignored by Codex. That is a capability warning, not a DAG-structure
  failure.

Design status:

- Keep the shared/original builder separate.
- Do not present it as the Codex workflow-building contract.
- A future `archon-workflow-builder-codex` workflow should be separate and
  designed around the Codex capability contract.
- This skill is intentionally named `my-dash-workflow-builder-codex` because
  it is the custom Codex authoring reference, not an upstream default.

## Current Web UI Builder

Files:

- `packages/web/src/routes/WorkflowBuilderPage.tsx`
- `packages/web/src/components/workflows/WorkflowBuilder.tsx`
- `packages/web/src/components/workflows/WorkflowCanvas.tsx`
- `packages/web/src/components/workflows/NodeLibrary.tsx`
- `packages/web/src/components/workflows/NodeInspector.tsx`
- `packages/web/src/lib/dag-layout.ts`

Current useful capabilities:

- loads existing workflow definitions
- visualizes DAG edges
- edits top-level `provider` and `model`
- authors `command`, `prompt`, and `bash` nodes
- edits dependencies, `when`, `trigger_rule`, `context`, `idle_timeout`,
  `retry`
- exposes some Claude-oriented fields such as `allowed_tools`,
  `denied_tools`, `skills`, `mcp`, and `hooks`
- validates through the server endpoint

Current limits for Codex workflow authoring:

- it does not author all runtime node types as first-class nodes in the canvas
  authoring path
- it exposes Claude-oriented fields that Codex ignores
- it does not expose the full Codex-specific tuning surface in the main
  authoring flow
- it is a helpful UI surface, not the source of truth for Codex compatibility

## Practical Rule

Use the Web UI builder for inspection, simple DAG sketching, and visual review.
Use this skill and the runtime schema references for actual Codex workflow
authoring.

If the Web UI generates YAML, run the Codex lint helper and Archon validation
before trusting it.
