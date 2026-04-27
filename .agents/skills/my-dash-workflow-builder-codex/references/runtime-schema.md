# Runtime Schema Reference

Use this file when authoring or reviewing Archon workflow YAML. It summarizes
the current fork's runtime contract and notes upstream drift that affects
workflow authoring.

## Current Local Sources Of Truth

- Workflow schema:
  `packages/workflows/src/schemas/workflow.ts`
- DAG node schema:
  `packages/workflows/src/schemas/dag-node.ts`
- Loop schema:
  `packages/workflows/src/schemas/loop.ts`
- Loader and parser:
  `packages/workflows/src/loader.ts`
- Resource validator:
  `packages/workflows/src/validator.ts`
- DAG executor:
  `packages/workflows/src/dag-executor.ts`
- Provider contract:
  `packages/providers/src/types.ts`
- Provider capabilities:
  `packages/providers/src/*/capabilities.ts`
- Authoring docs:
  `packages/docs-web/src/content/docs/guides/authoring-workflows.md`

## Workflow Locations

Archon discovers workflow YAML recursively from:

1. repo-local `.archon/workflows/`
2. user-global `~/.archon/workflows/`
3. bundled defaults

Same-named workflows are overridden by higher-precedence scopes. CLI reads the
working directory directly. Server/Web reads the registered workspace clone, so
server-visible workflow changes generally need to be pushed or synced.

## Top-Level Workflow Fields

Required:

- `name`
- `description`
- `nodes`

Common optional fields:

- `provider`
- `model`
- `interactive`
- `worktree.enabled`
- `mutates_checkout`
- `tags`

Codex optional fields in this fork:

- `modelReasoningEffort`
- `webSearchMode`
- `additionalDirectories`

Claude-oriented optional fields:

- `effort`
- `thinking`
- `fallbackModel`
- `betas`
- `sandbox`

Merged upstream additions:

- `tags` is available as a top-level workflow field. An explicit empty array
  suppresses Web UI tag inference.
- `mutates_checkout: false` skips same-path workflow serialization for
  workflows that do not write to the checkout. Omit it, or set true, for the
  safe default path lock.

## Node Types

Each node must have exactly one mode field:

- `command`: run a named `.archon/commands/*.md` command.
- `prompt`: run an inline AI prompt.
- `bash`: run deterministic shell; stdout becomes `$nodeId.output`.
- `script`: run deterministic Bun or uv script; stdout becomes
  `$nodeId.output`.
- `loop`: repeat an AI prompt until a completion signal or `until_bash`.
- `approval`: pause for human approval or rejection.
- `cancel`: intentionally terminate the workflow run.

## Common Node Fields

- `id`
- `depends_on`
- `when`
- `trigger_rule`
- `context`
- `idle_timeout`
- `retry`

Trigger rules:

- `all_success`
- `one_success`
- `none_failed_min_one_success`
- `all_done`

Use `none_failed_min_one_success` after conditional branches when one of
multiple paths is expected to run and skipped branches are acceptable.

## AI Node Fields

For `command` and `prompt` nodes:

- `provider`
- `model`
- `output_format`
- `context`
- `retry`
- `modelReasoningEffort` in this fork for Codex nodes
- `webSearchMode` in this fork for Codex nodes
- `additionalDirectories` in this fork for Codex nodes

Claude-only fields may parse on the node but are not Codex-safe:

- `hooks`
- `mcp`
- `skills`
- `agents`
- `allowed_tools`
- `denied_tools`
- `effort`
- `thinking`
- `maxBudgetUsd`
- `systemPrompt`
- `fallbackModel`
- `betas`
- `sandbox`

## Loop Node Boundary

Loop nodes have their own session behavior and do not behave like normal
`command` or `prompt` nodes.

Loop config supports:

- `prompt`
- `until`
- `max_iterations`
- `fresh_context`
- `until_bash`
- `interactive`
- `gate_message`
- progress/stuck tracking fields in this fork

Loop node restrictions:

- `retry` is a hard parse error on loop nodes.
- `output_format` is not a loop-node structured-output contract.
- Node-level `modelReasoningEffort`, `webSearchMode`, and
  `additionalDirectories` are ignored on loops in this fork.
- Use workflow-level Codex tuning for loop-heavy Codex workflows.

## Script Nodes

Use script nodes for deterministic transforms where shell quoting would be
fragile.

Rules:

- `runtime: bun` for TypeScript/JavaScript.
- `runtime: uv` for Python.
- `deps` is uv-only.
- Named scripts resolve from `.archon/scripts/` and `~/.archon/scripts/`.
- Inline scripts receive substituted output text directly; parse with
  `JSON.parse` or `json.loads` instead of shell interpolation.

Upstream drift:

- Smoke-test workflows are grouped under `.archon/workflows/test-workflows/`.
- Maintainer workflows live under `.archon/workflows/maintainer/`.
- Maintainer command helpers live under `.archon/commands/maintainer-*.md`.

## Validation Ladder

Use both checks:

1. `python3 .agents/skills/my-dash-workflow-builder-codex/scripts/codex_workflow_lint.py <file> --repo-root .`
2. `bun run cli validate workflows <workflow-name> --json`

The Codex lint helper checks Codex authoring risks. Archon validation checks
syntax, DAG structure, dependencies, resource existence, provider/model
compatibility, named scripts, and runtime availability.

Outside this source checkout, the installed-binary equivalent is
`archon validate workflows <workflow-name> --json`.
