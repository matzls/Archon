---
title: "Build Intake Skill Plan"
kind: plan
status: draft
created: 2026-05-04
updated: 2026-05-04
audience: agents
canonicality: canonical
source_of_truth: "Codex planning conversation on 2026-05-04"
---

# Build Intake Skill Plan

## Summary

Create a global Codex skill at `$CODEX_HOME/skills/build-intake` that acts as
the pre-build thinking lane for ideas, features, bugs, refactors, and ambiguous
work. It will help Mase brainstorm, challenge assumptions, inspect relevant
context, choose a route, and preserve the result as an agent-readable intake
packet.

Peer review was run twice and incorporated. The final boundary is: **Build
Intake shapes context; it does not create PRDs, certify PIV readiness, select
slices, or emulate the future Archon requirements gate.**

## Skill Contract

Implement these files:

- `$CODEX_HOME/skills/build-intake/SKILL.md`
- `$CODEX_HOME/skills/build-intake/references/conversation.md`
- `$CODEX_HOME/skills/build-intake/references/packet-schema.md`
- `$CODEX_HOME/skills/build-intake/references/routing.md`
- `$CODEX_HOME/skills/build-intake/references/examples.md`
- `$CODEX_HOME/skills/build-intake/evals/evals.json`

Do **not** add `agents/openai.yaml` in v1. The current global skill runtime uses
`SKILL.md` frontmatter for discovery; `agents/openai.yaml` can be added later
only if a concrete UI/install consumer is confirmed.

`SKILL.md` should stay compact and cover:

- Trigger: brainstorm, shape requirements, decide direct Codex vs workflow,
  prepare an intake packet, clarify build intent.
- Non-trigger: tiny explicit edits, already frozen plans, explicit PRD creation
  after Mase has already chosen the PRD lane.
- Core loop: **Shape -> Route -> Preserve**.
- Hard boundary: never emit `ready_for_piv_v2: true`, never validate against
  Archon PRD/PIV handoff rules, never create PRD/design/plan artifacts.

## Packet And Routing Interface

Define `build-intake-packet-v1` in `references/packet-schema.md`.

Required frontmatter:

```yaml
schema_version: build-intake-packet-v1
handoff_status: shaped_not_downstream_validated
created: YYYY-MM-DD
updated: YYYY-MM-DD
source_context: chat | repo | issue | file | mixed
recommended_route: direct_codex | archon_requirements | stop_or_not_ready
route_hint: none | likely_focused | likely_large | uncertain
confidence: low | medium | high
current_consumer:
  kind: codex_cli | archon_workflow | none
  id: codex_cli | archon-interactive-prd | archon-piv-loop-codex-v2 | ""
future_consumer:
  kind: archon_workflow | none
  id: archon-requirements-gate-codex | ""
```

Required body headings:

- User Intent
- Current Understanding
- Facts
- Assumptions
- Decisions
- Open Questions
- Evidence Index
- Route Recommendation
- Downstream Notes
- Scratchpad Summary

Evidence entries must use stable locators:

```yaml
- id: E1
  kind: codebase | external | graphify | conversation | file
  source_ref: "path:line" | "URL" | "graphify-out/GRAPH_REPORT.md#section" | "chat-summary"
  status: verified | partial | unverified
  summary: "short supported claim"
```

Routing rules:

- `direct_codex`: simple enough for local Codex or a lightweight local plan.
- `archon_requirements`: formalization likely needed. Current fallback consumer
  is `archon-interactive-prd` for PRD-shaped work, or
  `archon-piv-loop-codex-v2` only as current compatibility when Mase explicitly
  accepts current V2 behavior.
- `stop_or_not_ready`: goal is unsafe, contradictory, too unclear, or missing
  decisive context.

## Persistence Rules

Default output is inline packet content in chat, ready to paste into Codex or an
Archon workflow prompt.

Durable repo packet is optional. Use it only when Mase asks for handoff
persistence or when Archon worktree visibility matters.

If durable, create `docs/intake/<slug>.intake.md` as a governed
upstream-context doc class with this frontmatter floor:

```yaml
title: "..."
kind: intake-packet
status: draft | active | superseded
audience: agents
canonicality: canonical
created: YYYY-MM-DD
updated: YYYY-MM-DD
source_of_truth: "intake conversation plus Evidence Index"
schema_version: build-intake-packet-v1
handoff_status: shaped_not_downstream_validated
```

`docs/intake` stores summaries and source locators only. Raw logs, screenshots,
Graphify outputs, and validation evidence remain in their producing
tool/workflow locations.

## Implementation Details

`references/conversation.md` should define the brainstorming posture:

- Start conversationally, not as a form.
- Challenge assumptions at a high level before detailed planning.
- Do repo/doc research before asking questions when facts are discoverable.
- Use external sources only when current external truth matters.
- Use Graphify only for complex existing-codebase relationship questions;
  follow bounded-root and ignore-file preflight.

`references/routing.md` should include a current/future consumer table:

- Today: `archon-interactive-prd`, `archon-piv-loop-codex-v2`, `codex_cli`.
- Future: `archon-requirements-gate-codex`.
- Intake always marks Archon output as shaped context, not downstream readiness.

`references/examples.md` should include packet examples for:

- vague idea
- focused existing-codebase feature
- bug fix
- refactor
- large Archon candidate
- stop/not-ready case

## Test Plan

Create `evals/evals.json` with at least five realistic prompts:

- vague product idea needing brainstorming
- focused feature in an existing repo
- bug fix with unclear root cause
- refactor request
- large Archon candidate
- tiny direct edit bypass

Assertions must check:

- required packet frontmatter keys exist when a packet is produced
- route values are only `direct_codex`, `archon_requirements`,
  `stop_or_not_ready`
- no output claims `ready_for_piv_v2`
- Archon routes use actual workflow IDs only
- evidence entries include `kind`, `source_ref`, `status`, and `summary`
- tiny direct edits are allowed to bypass durable packet creation

Run one skill-creator style eval iteration after implementation. If the full
with-skill/baseline benchmark runner is unavailable, run a deterministic
assertion check over generated outputs and record that limitation.

## Assumptions

- The skill is global under `$CODEX_HOME/skills`, not repo-local Archon.
- `archon-requirements-gate-codex` is future-facing and not implemented in this
  plan.
- PIV V2 Mode B is not changed by this plan.
- Durable `docs/intake` packets are optional and governed; inline packet output
  is the default.
