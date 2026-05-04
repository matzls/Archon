---
title: "Mase Archon Fork Operating Model"
kind: reference
status: active
audience: "agents-maintainers"
canonicality: canonical
created: 2026-05-04
updated: 2026-05-04
---

# Mase Archon Fork Operating Model

This repository is Mase's personalized Archon fork. Treat it as both a normal
Archon development checkout and the source for Mase's Codex-first Archon
operating surface.

Read this document before changing:

- `.agents/skills/archon/`
- `.claude/skills/archon/`
- `/Users/mase/.codex/skills/archon/`
- `packages/cli/src/bundled-skill.ts`
- `packages/cli/src/commands/skill.ts`
- `.agents/skills/my-achrchon-sync/`
- fork-local Codex/PIV workflows or commands

## Skill Surfaces

Archon has four related skill surfaces in this setup:

- `.agents/skills/archon/` is the authored repo source for the Archon host
  skill.
- `.claude/skills/archon/` is the repo-local Claude mirror. It must stay
  byte-identical to `.agents/skills/archon/`.
- `packages/cli/src/bundled-skill.ts` is the package/install snapshot consumed
  by `archon setup` and `archon skill install`.
- `/Users/mase/.codex/skills/archon/` is Mase's personal global Codex runtime
  overlay. It lets Codex invoke Archon from repos that do not have a repo-local
  Archon host skill.

## Canonical Chain

For packaged Archon behavior, the chain is:

```text
.agents/skills/archon/
  -> .claude/skills/archon/
  -> packages/cli/src/bundled-skill.ts
```

These three should be synchronized mechanically.

For Mase's personal Codex runtime, the chain continues to:

```text
/Users/mase/.codex/skills/archon/
```

The global Codex skill is a deployment overlay, not a blind mirror. It may
intentionally diverge to carry Mase-specific Codex routing notes. Do not
overwrite it without comparing first.

## Global Codex Overlay Policy

Use the global Codex Archon skill for Mase's day-to-day Codex workflow. Do not
install a global Claude Archon skill unless Mase explicitly asks for Claude Code
to invoke Archon globally too.

When installing the global Codex skill for the first time, seed it from:

```text
.agents/skills/archon/
```

Use copy semantics that copy contents, not a nested directory:

```bash
mkdir -p /Users/mase/.codex/skills/archon
cp -R .agents/skills/archon/. /Users/mase/.codex/skills/archon/
```

If `/Users/mase/.codex/skills/archon/` already exists, stop and diff before
copying.

## Skill Sync Checklist

Before syncing repo and global skill copies, inspect both sides:

```bash
git status --short --branch
diff -ru .agents/skills/archon /Users/mase/.codex/skills/archon
git log --oneline -- .agents/skills/archon .claude/skills/archon packages/cli/src/bundled-skill.ts
test -d /Users/mase/.codex/.git && git -C /Users/mase/.codex log --oneline -- skills/archon || echo "/Users/mase/.codex is not a git repo"
test -d /Users/mase/.codex/.git && git -C /Users/mase/.codex status --short -- skills/archon || echo "/Users/mase/.codex is not a git repo"
```

Classify each meaningful delta:

- `port`: move useful repo/global behavior to the other side.
- `adapt`: keep the intent but rewrite path, runtime, or fork-specific details.
- `preserve`: keep Mase-specific overlay behavior.
- `drop`: reject obsolete, duplicated, or wrong behavior.
- `defer`: keep for a later sync decision.

`Current` is not inferred from path, modified time, or repo role. Current means
the copy whose intent has been verified by diff, history, and validation for the
specific sync decision.

## Upstream Sync Skill Checkpoint

Upstream Archon changes can touch host skills, bundled install behavior, or
Codex/PIV workflow surfaces. During `my-achrchon-sync`, do not accept those
changes automatically.

Before and after merging upstream, inspect incoming changes to:

```bash
git diff --name-status dev..upstream/dev -- \
  .agents/skills \
  .claude/skills \
  .archon/workflows/defaults \
  .archon/commands/defaults \
  packages/cli/src/bundled-skill.ts \
  packages/cli/src/commands/skill.ts
```

If upstream touched these areas, classify the changes as `port`, `adapt`,
`preserve`, `drop`, or `defer` before validation and commit.

## Validation Commands

After changing repo host skills or install behavior:

```bash
bun test packages/cli/src/bundled-skill.test.ts
bun test packages/cli/src/commands/skill.test.ts
bun test packages/cli/src/commands/setup.test.ts
diff -qr .agents/skills/archon .claude/skills/archon
tmp="$(mktemp -d /private/tmp/archon-cli-install.XXXXXX)"
archon skill install "$tmp"
diff -qr .agents/skills/archon "$tmp/.agents/skills/archon"
diff -qr .claude/skills/archon "$tmp/.claude/skills/archon"
```

After installing or changing the global Codex skill, verify in a fresh Codex
session from a repo without repo-local Archon skills that Codex can discover and
use the global Archon host skill.
