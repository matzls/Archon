# Upstream Status

Last checked: 2026-04-27

Reference repo:

- `https://github.com/coleam00/Archon`
- checked branch: `dev`
- checked commit: `eec09ff2eb2f12530370d69a67883b1f8502c428`

Web evidence:

- GitHub repo page showed `dev` as the active branch and described Archon as a
  workflow engine for AI coding agents.
- GitHub commit page showed recent commits including workflow tags, maintainer
  workflows, smoke workflow grouping, Pi provider work, `mutates_checkout`, and
  script-node example fixes.

Local fetch evidence:

```text
local dev after merge 1ade7fc267220d239ba562ceb302265f45932ea9
upstream/dev eec09ff2eb2f12530370d69a67883b1f8502c428
upstream/main 7fc476117cddd453d45b812fde65098ccb86447e
```

## Relevant Upstream Changes Since This Fork Point

Recent upstream commits affecting workflow authoring:

- `3868f892` - adds explicit `tags` in workflow YAML.
- `4929c543` - groups smoke-test workflows under `test-workflows/` and adds
  `e2e-minimax-smoke`.
- `6c943559` and `ef950ff1` - add and refine maintainer review workflows.
- `686bec67` - updates Pi provider model registry behavior.
- `8cfd5981` - adds `mutates_checkout` for non-mutating concurrent live-checkout
  workflows.
- `eec09ff2` - updates script-node examples to avoid fragile `String.raw`
  output substitution.

## Important Drift For This Fork

This local `dev` branch has absorbed the latest checked upstream workflow
changes through merge commit `1ade7fc2`.

This fork has local Codex workflow assets that upstream did not carry at the
latest checked state:

- `.agents/skills/archon/`
- `.archon/workflows/defaults/archon-assist-codex.yaml`
- `.archon/workflows/defaults/archon-piv-loop-codex.yaml`
- `.archon/workflows/defaults/archon-piv-loop-codex.README.md`
- Codex workflow design docs under `docs/design/`

Latest checked upstream workflow assets now present locally:

- top-level workflow `tags`
- top-level `mutates_checkout`
- `.archon/workflows/maintainer/maintainer-review-pr.yaml`
- `.archon/workflows/maintainer/maintainer-standup.yaml`
- `.archon/workflows/maintainer/repo-triage.yaml`
- maintainer commands under `.archon/commands/maintainer-*.md`, currently:
  `maintainer-standup`, `maintainer-review-gate`,
  `maintainer-review-code-review`, `maintainer-review-error-handling`,
  `maintainer-review-test-coverage`, `maintainer-review-comment-quality`,
  `maintainer-review-docs-impact`, `maintainer-review-synthesize`, and
  `maintainer-review-report`
- smoke workflows grouped under `.archon/workflows/test-workflows/`
- `.archon/workflows/test-workflows/e2e-minimax-smoke.yaml`

Latest upstream also differs from this fork in Codex option placement:

- This fork supports node-level `modelReasoningEffort`, `webSearchMode`, and
  `additionalDirectories` for Codex `command` and `prompt` nodes.
- Latest checked upstream docs/schema treated Codex tuning as workflow-level
  only.

## Authoring Implication

For this fork, build against the local runtime first. `tags`,
`mutates_checkout`, maintainer workflows, and grouped test workflows are now
local capabilities.

For upstream-portable workflow work, avoid fork-only Codex fields unless the
upstream merge has landed there and the upstream schema confirms support.

Before changing shipped defaults after an upstream merge, re-check:

- `packages/workflows/src/schemas/workflow.ts`
- `packages/workflows/src/schemas/dag-node.ts`
- `packages/workflows/src/loader.ts`
- `packages/workflows/src/dag-executor.ts`
- `packages/docs-web/src/content/docs/guides/authoring-workflows.md`
- `packages/workflows/src/defaults/bundled-defaults.generated.ts`
