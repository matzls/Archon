# Fork-Local Agent Hints

This file is local guidance for Mase's personalized Archon fork. It documents
fork-only operating rules that should not be assumed for upstream contributions.

## Upstream Sync

When Mase asks to update this fork from upstream, use the repo-local
`my-achrchon-sync` skill.

Before changing Archon host skills, bundled skill install behavior, the global
Codex Archon skill, or fork-local upstream sync behavior, read
`docs/reference/mase-archon-fork-operating-model.md`.

Rules:

- Source of incoming changes: `upstream/dev` from `coleam00/Archon`.
- Destination branch: personalized `dev` on `origin` (`matzls/Archon`).
- Use a merge branch such as `codex/merge-upstream-dev-YYYY-MM-DD`.
- Merge upstream. Do not rebase, reset, or fast-forward `dev` directly to
  upstream.
- Preserve fork-local Codex/PIV workflows, skills, PRDs, design docs, and plans
  by default.
- Leave unrelated feature branches and untracked local files untouched.

Protected paths by default:

- `.agents/skills/**`
- `.claude/skills/archon/**`
- `.archon/workflows/defaults/*codex*`
- `.archon/commands/defaults/*codex*`
- `packages/cli/src/bundled-skill.ts`
- `packages/cli/src/commands/skill.ts`
- `docs/design/**`
- `docs/prd/**`
- `docs/plans/**`

The daily `my-achrchon-sync` GitHub Action only checks for upstream drift and
opens or updates an issue. It must not auto-merge upstream changes.
