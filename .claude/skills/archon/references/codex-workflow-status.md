---
title: Codex Workflow Status For Archon
doc_type: skill-reference
updated: 2026-04-26
---

# Codex Workflow Status For Archon

Use this file when the question is "which Archon workflows are currently
Codex-native, and where can they still improve?"

This is a living status reference. It can change as Archon's Codex support
evolves. For stable capability rules, use `codex-capability-crosswalk.md`.

## Mental Model

- `.agents/skills/archon` helps the outer Codex session choose, launch, and
  monitor Archon workflows.
- `provider: codex` makes the inner Archon workflow worker use Codex.
- A workflow without `provider: codex` or node-level `provider: codex` usually
  uses the configured default assistant, which may be Claude.
- Claude-oriented workflow features such as per-node `hooks`, `mcp`, `skills`,
  `allowed_tools`, and `denied_tools` do not become Codex-native just because
  Codex launched the workflow.

## Current Codex Workflow Status

| Workflow | Current Codex state | Current tuning | Missing or optional tuning | Status |
| --- | --- | --- | --- | --- |
| `archon-piv-loop-codex` | Explicit `provider: codex`; strongest current Codex-native PIV lane | Workflow-level `modelReasoningEffort: xhigh`; `interactive: true` | No workflow-level `webSearchMode`; no workflow-level `additionalDirectories`; loop nodes rely on workflow/config-level Codex tuning | Reference-quality current lane, with improvement room |
| `archon-assist-codex` | Explicit `provider: codex`; general fallback lane | Provider only | Consider workflow-level reasoning/search/extra-directory tuning only if a concrete assist use case needs it | Useful fallback, not a substitute for specialized Codex workflows |

## Improvement Targets

For `archon-piv-loop-codex`, evaluate whether the workflow should set:

```yaml
provider: codex
modelReasoningEffort: xhigh
webSearchMode: live
additionalDirectories:
  - /absolute/path/to/shared/docs-or-repo
```

Do not add `additionalDirectories` speculatively. Use it only when there is a
real shared docs repo, companion codebase, or reference corpus that Codex needs
for this workflow.

## Loop-Node Tuning Boundary

`archon-piv-loop-codex` is mostly `loop` nodes. In the current implementation,
loop nodes do not get per-loop-node overrides for:

- `modelReasoningEffort`
- `webSearchMode`
- `additionalDirectories`

Those fields still matter, but for loop-heavy workflows they belong at:

1. workflow YAML
2. `assistants.codex.*` in Archon config
3. SDK defaults

Normal Codex `command` and `prompt` nodes can still use node-level overrides
for those fields.

## Routing Rule

Prefer `-codex` workflows when they exist. If no Codex-specific workflow exists,
Codex can still launch and monitor the workflow, but do not imply that the inner
worker is Codex-native or that Claude-only node controls will translate cleanly.
