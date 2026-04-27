---
name: my-dash-workflow-builder-codex
description: Build, review, or adapt Archon workflow YAML for Codex in this custom fork. Use when Codex needs to design a new Archon workflow, create or review a `-codex` workflow, convert a Claude-oriented workflow to Codex-safe behavior, prepare `archon-piv-loop-codex-v2`, audit Workflow Builder output for Codex compatibility, or decide which Archon workflow authoring rules and references apply before editing `.archon/workflows/`, `.archon/commands/`, workflow schemas, workflow docs, or bundled defaults.
---

# My Dash Workflow Builder Codex

## Purpose

Use this skill as the Codex-facing reference pack for building Archon workflows
in this fork. It keeps the authoring process grounded in the local runtime,
the provider capability boundary, and the latest upstream drift notes.

This is not the generic Archon host skill. Use `archon` for running and
monitoring workflows. Use this skill when the job is to design, review, or
modify Codex-safe workflow definitions and supporting commands.

## Operating Rule

Prefer repo reality over prose:

1. Inspect the target workflow and current runtime files.
2. Check the Codex capability boundary.
3. Build or edit the YAML and commands.
4. Run the Codex workflow lint helper.
5. Run Archon's own validation.
6. If the workflow is intended as a shipped default, check bundle/default tests.

Do not treat `archon-workflow-builder` output or Web Workflow Builder UI output
as authoritative for Codex. They are useful inputs, not the Codex contract.

## Reference Selection

Read only the references needed for the task:

- `references/runtime-schema.md` - YAML schema, discovery, validation, node
  types, and source-vs-upstream differences.
- `references/codex-capability-contract.md` - what is real for Codex and what
  is Claude-only or global-only.
- `references/authoring-process.md` - step-by-step workflow design and review
  process.
- `references/workflow-builder-status.md` - current status of the YAML builder
  workflow and Web UI builder.
- `references/piv-v2-reference.md` - rules for building
  `archon-piv-loop-codex-v2`.
- `references/upstream-status.md` - latest checked upstream state and drift
  notes.

## Useful Commands

Run these from the Archon repo root unless a target repo is explicit.

```bash
bun run cli workflow list --json
bun run cli validate workflows <workflow-name> --json
python3 .agents/skills/my-dash-workflow-builder-codex/scripts/codex_workflow_lint.py .archon/workflows/defaults/<workflow-name>.yaml --repo-root .
```

For all default workflows:

```bash
python3 .agents/skills/my-dash-workflow-builder-codex/scripts/codex_workflow_lint.py .archon/workflows/defaults/*.yaml --repo-root .
```

The lint helper is intentionally conservative. It flags Codex-risk patterns
that Archon may only warn about at runtime, such as per-node Claude-only
controls on `provider: codex` workflows.

If you are outside this source checkout and using the installed binary, the
equivalent validator form is `archon validate workflows <workflow-name> --json`.

## Authoring Checklist

- Name Codex-specific workflows with a `-codex` suffix unless there is a strong
  compatibility reason not to.
- Set `provider: codex` explicitly for Codex-native workflows.
- Use workflow-level Codex tuning for loop-heavy workflows:
  `modelReasoningEffort`, `webSearchMode`, and `additionalDirectories`.
- Use node-level Codex tuning only for `command` and `prompt` nodes in this
  fork; check upstream drift before relying on it in portable workflows.
- Use top-level `tags` for Web UI filtering when the inferred tags would be
  misleading.
- Use `mutates_checkout: false` only for workflows that truly do not write to
  the checkout and can safely run concurrently on the same live path.
- Use `output_format` for AI nodes whose output is consumed by `when:` or
  `$node.output.field`.
- Use deterministic `bash` or `script` nodes for checks, parsing, validation,
  and file-system facts.
- Use `trigger_rule: none_failed_min_one_success` after conditional branches
  where exactly one path is expected to run.
- Set workflow-level `interactive: true` for approval gates or
  `loop.interactive: true`.
- Pass state through files and `$ARTIFACTS_DIR`, not through assumed model
  memory.
- Validate with Archon's validator before calling a workflow ready.

## Codex Red Lines

For Codex-safe workflows, do not depend on per-node:

- `hooks`
- `mcp`
- `skills`
- `agents`
- `allowed_tools`
- `denied_tools`
- Claude-only `effort`, `thinking`, `fallbackModel`, `betas`, or `sandbox`

Archon may load a workflow containing these fields and warn at runtime, but a
Codex workflow that depends on them is not actually Codex-safe.

## Upstream Check

When upstream freshness matters, compare this fork against `upstream/dev`.
The last checked upstream state for this skill is recorded in
`references/upstream-status.md`. Update that reference when new upstream
workflow schema, docs, or builder changes affect Codex authoring.
