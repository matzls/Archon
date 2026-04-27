# Codex Workflow Authoring Process

Use this file when creating or reviewing a Codex-safe Archon workflow.

## 1. Classify The Workflow

Choose one class:

- Codex-native default: shipped, bundled, tested, operator-ready.
- Repo-local Codex experiment: useful locally, not yet a shipped default.
- Claude/default workflow: not Codex-safe unless explicitly adapted.
- Test workflow: meant for smoke or engine validation.

Codex-native workflows should usually end with `-codex`.

## 2. Define The Artifact Chain

Before writing YAML, map the handoff:

| Node | Reads | Writes |
| --- | --- | --- |
| analysis | user input, repo files | `$ARTIFACTS_DIR/analysis.md` |
| plan | analysis artifact | plan document or JSON decision |
| implement | plan and repo state | code, tests, task-progress marker |
| validate | code and expected behavior | validation output |
| finalize | git diff, evidence | PR body or final report |

If a downstream node uses `context: fresh` or a loop uses `fresh_context: true`,
the artifact must contain enough information to continue without chat memory.

## 3. Pick Node Types Conservatively

Use deterministic nodes for deterministic work:

- file checks
- JSON parsing
- git state
- command discovery
- validation commands
- status extraction

Use AI nodes for reasoning:

- design decisions
- code review
- implementation
- synthesis

Use approval or interactive loops only when the human must make a decision.

## 4. Codex Prompt Rules

Codex prompts should be explicit about:

- exact completion signal and when it is allowed
- hard stop boundaries
- one-task-per-iteration behavior
- task-scoped validation
- what files/artifacts to read
- what files/artifacts to write
- what must not be done

Avoid Claude-style reliance on per-node tool restrictions. Codex will not honor
`allowed_tools` or `denied_tools` from workflow YAML in this fork.

## 5. Branching And Structured Output

If a `when:` condition reads a field, the upstream AI node must use
`output_format`.

Good:

```yaml
- id: classify
  prompt: "Classify the request."
  output_format:
    type: object
    properties:
      route:
        type: string
        enum: [small, large]
    required: [route]

- id: slice-map
  depends_on: [classify]
  when: "$classify.output.route == 'large'"
```

After conditional branches, merge with:

```yaml
trigger_rule: none_failed_min_one_success
```

## 6. Human Gates

Use `interactive: true` at workflow level when the workflow includes:

- `approval:` nodes
- `loop.interactive: true`
- any human-in-the-loop turn that must surface in Web UI chat

Use `approval` for gate-then-proceed or gate-then-rework.
Use `loop.interactive` for conversational iteration.

## 7. Validation

Run:

```bash
python3 .agents/skills/my-dash-workflow-builder-codex/scripts/codex_workflow_lint.py <workflow.yaml> --repo-root .
bun run cli validate workflows <workflow-name> --json
```

For shipped defaults also run the relevant package tests:

```bash
bun test packages/workflows/src/defaults/bundled-defaults.test.ts
bun test packages/workflows/src/loader.test.ts
bun test packages/workflows/src/validator.test.ts
```

Use the repo's broader validation command before a PR:

```bash
bun run validate
```

Do not weaken tests or validation to make a workflow pass.
