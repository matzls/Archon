# Fork-Local Agent Hints

This file is local guidance for Mase's personalized Archon fork. It documents
fork-only operating rules that should not be assumed for upstream contributions.

## Upstream Sync

When Mase asks to update this fork from upstream, use the repo-local
`my-achrchon-sync` skill.

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
- `.archon/workflows/defaults/*codex*`
- `.archon/commands/defaults/*codex*`
- `docs/design/**`
- `docs/prd/**`
- `docs/plans/**`

The daily `my-achrchon-sync` GitHub Action only checks for upstream drift and
opens or updates an issue. It must not auto-merge upstream changes.
