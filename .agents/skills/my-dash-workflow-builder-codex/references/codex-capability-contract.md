# Codex Capability Contract

Use this file when deciding whether a workflow is genuinely Codex-safe.

## Mental Model

There are two layers:

1. Outer Codex session chooses, edits, launches, and monitors Archon.
2. Inner Archon workflow uses Codex only when the workflow or node resolves to
   `provider: codex`.

A workflow is not Codex-native because Codex launched it. It is Codex-native
only when the YAML, prompts, validation, and operator model match the actual
Codex provider surface.

## Real Codex Workflow Surface In This Fork

Workflow-level:

- `provider: codex`
- `model: <OpenAI model>`
- `modelReasoningEffort`
- `webSearchMode`
- `additionalDirectories`

Normal `command` and `prompt` node level in this fork:

- `provider`
- `model`
- `output_format`
- `modelReasoningEffort`
- `webSearchMode`
- `additionalDirectories`

Loop nodes:

- `provider` and `model` are available through the loop execution path in this
  fork.
- Codex tuning fields should be set at workflow level for loops.
- Do not rely on per-loop-node `modelReasoningEffort`, `webSearchMode`, or
  `additionalDirectories`.

Structured output:

- `output_format` maps to Codex `outputSchema`.
- If Codex emits valid JSON, downstream `$node.output.field` references are
  valid.
- If Codex emits non-JSON, Archon warns and downstream field access can fail or
  skip.

## Unsupported Or Non-Equivalent For Codex

Do not depend on these fields for Codex workflows:

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

Archon capability warnings are runtime warnings, not a Codex support guarantee.
If a Codex workflow needs one of these effects, redesign the workflow.

## Global-Only Codex Equivalents

Some concepts exist for Codex, but not as per-node Archon workflow controls:

- Codex MCP belongs in Codex config, not `mcp:` on a workflow node.
- Codex skill discovery is global or repo-local through `.agents/skills/`, not
  `skills:` on a workflow node.
- Codex tool restrictions belong in Codex configuration, not
  `allowed_tools` or `denied_tools` fields on one Archon node.

## Model Compatibility

For `provider: codex`, do not use Claude aliases:

- `sonnet`
- `opus`
- `haiku`
- `inherit`
- any `claude-*` model ID

Use OpenAI/Codex model IDs instead. If a model is unavailable, the Codex
provider can surface model-access guidance.

## Fork Versus Upstream

This fork has local Codex behavior that upstream `coleam00/Archon` did not
carry at the latest checked upstream state:

- `archon-piv-loop-codex`
- `archon-assist-codex`
- node-level Codex tuning for command/prompt nodes
- local Codex workflow design docs and host-skill references

Merged upstream capabilities that are now available locally:

- top-level `tags`
- top-level `mutates_checkout`
- maintainer workflows
- maintainer commands under `.archon/commands/maintainer-*.md`
- grouped smoke-test workflows under `.archon/workflows/test-workflows/`

Before writing portable upstream-ready workflows, re-check upstream. Upstream
may still not accept every fork-specific Codex workflow or field.
