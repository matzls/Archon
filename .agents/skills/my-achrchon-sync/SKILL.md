---
name: my-achrchon-sync
description: |
  Use in this Archon fork when Mase asks to check, plan, or perform an upstream
  sync from coleam00/Archon dev into the personalized fork dev branch. Triggers:
  "my-achrchon-sync", "sync upstream", "merge upstream dev", "update my Archon
  fork", "pull upstream into dev", "absorb upstream changes". This skill is
  fork-local and protects Mase's Codex/PIV workflows, skills, PRDs, design docs,
  and planning artifacts.
argument-hint: "[check|merge] [optional upstream branch]"
---

# My Archon Sync

Fork-local procedure for absorbing `upstream/dev` into Mase's personalized
Archon `dev` branch without losing local Codex/PIV operating-system changes.

## Safety Rules

- Merge only. Do not rebase, reset, or fast-forward `dev` directly to upstream.
- Start the sync branch from local `dev`, not from a feature branch.
- Do not include unrelated feature branches unless Mase explicitly asks.
- Do not delete or overwrite untracked local files.
- Preserve fork-local workflow/docs/skill artifacts by default.
- If conflicts touch generated bundled defaults, resolve source YAML first and
  regenerate generated output.

Protected paths by default:

- `.agents/skills/**`
- `.archon/workflows/defaults/*codex*`
- `.archon/commands/defaults/*codex*`
- `docs/design/**`
- `docs/prd/**`
- `docs/plans/**`

## Quick Check

Use this before deciding whether a merge is worth doing:

```bash
git fetch origin dev
git fetch upstream dev
git status --short --branch
git rev-list --count dev..upstream/dev
git log --oneline --decorate --max-count=12 dev..upstream/dev
```

If the ahead count is `0`, report that no upstream sync is currently needed.

## Merge Procedure

1. Confirm remotes:

```bash
git remote -v
```

Expected:

- `origin` is Mase's fork: `https://github.com/matzls/Archon.git`
- `upstream` is Cole's repo: `https://github.com/coleam00/Archon`

2. Start from `dev` and create a dated sync branch:

```bash
git checkout dev
git fetch --all --prune
git checkout -b codex/merge-upstream-dev-YYYY-MM-DD
```

3. Merge upstream:

```bash
git merge upstream/dev
```

Resolve conflicts with the safety rules above.

4. Reconcile dependencies and generated defaults:

```bash
bun install
bun run generate:bundled
```

5. Verify protected assets still exist:

```bash
test -f .archon/workflows/defaults/archon-piv-loop-codex.yaml
test -f .archon/workflows/defaults/archon-piv-loop-codex-v2.yaml
test -f .agents/skills/my-dash-workflow-builder-codex/SKILL.md
```

6. Validate workflow discovery and fork-local workflows:

```bash
bun run cli workflow list --json
bun run cli validate workflows archon-piv-loop-codex-v2 --json
bun run cli validate workflows archon-workflow-builder --json
python3 .agents/skills/my-dash-workflow-builder-codex/scripts/codex_workflow_lint.py .archon/workflows/defaults/*.yaml --repo-root .
```

7. Run targeted tests for touched areas, then full validation:

```bash
bun run validate
```

8. Commit the sync branch after validation passes. The commit message must end
   with:

```text
Co-authored-by: Codex <noreply@openai.com>
```

9. Move `dev` to the validated merge commit and push:

```bash
git checkout dev
git merge --ff-only codex/merge-upstream-dev-YYYY-MM-DD
git push origin dev
```

## Conflict Policy

Prefer upstream for general product/runtime improvements. Prefer Mase's fork for
Codex/PIV operating workflows and local process docs unless the upstream change
is clearly compatible.

When upstream deletes a protected file, keep the fork-local file unless Mase
explicitly approves the deletion.

For workflow conflicts:

- Keep Codex/PIV V2 triggers and behavior.
- Absorb upstream fixes for safer staging, CLI setup, workflow validation,
  logging, environment exports, and loop output handling when compatible.
- Preserve workflow discovery behavior for local and default workflows.

## Reporting

Final report should include:

- upstream ahead count and merge commit hash
- whether protected files were preserved
- validation commands run
- any warnings that remain
- whether `origin/dev` was pushed
