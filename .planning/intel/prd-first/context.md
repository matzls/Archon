# Synthesized Context

## Mase Archon Fork Operating Model

source: docs/reference/mase-archon-fork-operating-model.md

topic: fork-local operating model

notes:

- This repository is Mase's personalized Archon fork and the source for Mase's Codex-first Archon operating surface.
- Before changing host skills, bundled skill install behavior, fork-local Codex/PIV workflows, commands, or upstream sync behavior, read the operating model.
- Skill surfaces form a canonical packaged chain: `.agents/skills/archon/` -> `.claude/skills/archon/` -> `packages/cli/src/bundled-skill.ts`.
- `/Users/mase/.codex/skills/archon/` is a personal global Codex runtime overlay. It should be diffed and classified before overwriting because it may intentionally diverge for Mase-specific routing.
- Upstream sync should inspect incoming changes to skills, workflows, commands, and bundled install behavior, then classify deltas as `port`, `adapt`, `preserve`, `drop`, or `defer`.
- Validation for host skill or install behavior changes includes bundled-skill, skill command, setup tests, repo skill mirror diffs, temp install diffs, and a fresh Codex discovery smoke for the global skill when it changes.
