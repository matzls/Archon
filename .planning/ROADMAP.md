# Roadmap: Archon

## Overview

This roadmap turns the PRD-first ingest into a Codex workflow reliability milestone for Mase's Archon fork. It first makes paused workflow state trustworthy, then improves Web and non-Web operator output surfaces, then makes workflow graphs easier to read, and finally delivers the serious one-slice `archon-piv-loop-codex-v2` lane on top of those reliability surfaces.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Paused Approval State Contract** - Operators and adapters can trust paused approval metadata and semantic paused-output fields.
- [ ] **Phase 2: Web Paused Output Experience** - Web approval surfaces show useful bounded previews and provide a clear full-output path when clipped.
- [ ] **Phase 3: Non-Web Paused Output Adapters** - CLI and shared workflow status show the best semantic paused preview without pretending to have Web parity.
- [ ] **Phase 4: Workflow Graph Readability** - Execution graph node cards can show human-readable node purpose labels.
- [ ] **Phase 5: Codex PIV V2 Delivery Lane** - `archon-piv-loop-codex-v2` delivers one serious Codex slice per run with review, validation, and PR handoff guarantees.

## Phase Details

### Phase 1: Paused Approval State Contract

**Goal**: Operators and adapters can distinguish live actionable pauses from resolved approval history and can consume a compatible paused-output contract with explicit truncation metadata.
**Depends on**: Nothing (first phase)
**Requirements**: [REQ-paused-snapshot-contract-design, REQ-runtime-metadata-hygiene]
**Success Criteria** (what must be TRUE):

1. Operator can identify an actionable approval gate only when the workflow run status is `paused`.
2. Operator can inspect resolved approval context in `metadata.lastApproval` without non-paused rows looking actionable.
3. Web, CLI, and API pause rendering all ignore stale live approval metadata on running, failed, completed, or cancelled runs.
4. Adapters receiving paused approval metadata always get explicit truncation booleans whenever `lastOutput` or `finalAssistantOutput` is present.
5. Tool-heavy and no-tool paused runs expose the expected compatibility output and semantic assistant closing output behavior.
   **Plans**: TBD

### Phase 2: Web Paused Output Experience

**Goal**: Web chat and dashboard approval surfaces give operators a useful bounded paused preview and a reliable way to inspect full clipped output through existing logs.
**Depends on**: Phase 1
**Requirements**: [REQ-paused-output-web-parity, REQ-full-output-fallback]
**Success Criteria** (what must be TRUE):

1. Operator can see the approval prompt and `Latest output` in the Web chat progress card for paused runs with `approval.lastOutput`.
2. Operator can see the approval prompt and `Latest output` in the dashboard workflow run card for paused runs with `run.metadata.approval.lastOutput`.
3. Operator sees a visible clipped-output notice when a bounded paused preview ends with `[truncated]`.
4. Operator can choose `View full paused output` from a truncated paused Web card and land in a logs-oriented workflow run details view.
5. If the full-log path is unavailable, the Web UI reports that clearly instead of silently failing.
   **Plans**: TBD
   **UI hint**: yes

### Phase 3: Non-Web Paused Output Adapters

**Goal**: CLI and shared workflow status provide the most useful semantic paused preview while keeping non-Web behavior explicitly adapter-tiered.
**Depends on**: Phase 1
**Requirements**: [REQ-non-web-paused-output-adapter-review]
**Success Criteria** (what must be TRUE):

1. CLI paused rendering shows `finalAssistantOutput` instead of `lastOutput` when both exist.
2. Shared `/workflow status` shows `finalAssistantOutput` instead of `lastOutput` when both exist, so GitHub command/status paths inherit the better preview.
3. CLI and shared status output show exactly one preferred paused preview.
4. Plain-text paused output clearly indicates when the chosen preview is clipped.
5. Non-Web adapters do not automatically dump transcripts or introduce a full-output fallback path.
   **Plans**: TBD

### Phase 4: Workflow Graph Readability

**Goal**: Operators can understand execution graph node purpose from node cards without decoding raw YAML ids when workflows provide human-readable labels.
**Depends on**: Phase 1
**Requirements**: [REQ-workflow-node-display-names]
**Success Criteria** (what must be TRUE):

1. Operator can view execution graph node cards that use `display_name` as the primary label when present.
2. For display-name-annotated workflows, operator does not see raw `node.id` as the execution graph primary label.
3. Operator still gets useful fallback labels for command, shell, prompt, loop, script, approval, and cancel nodes when no display name exists.
4. Workflow execution graph display-name support does not change builder behavior, event storage, or `step_name` semantics.
   **Plans**: TBD
   **UI hint**: yes

### Phase 5: Codex PIV V2 Delivery Lane

**Goal**: Mase can run a serious Codex-native Archon workflow that turns a focused request, or one selected slice from a larger request, into reviewed, validated, PR-ready delivery without becoming a hidden campaign orchestrator.
**Depends on**: Phase 1, Phase 2, Phase 3, Phase 4
**Requirements**: [REQ-archon-piv-loop-codex-v2]
**Success Criteria** (what must be TRUE):

1. Operator can discover and validate `archon-piv-loop-codex-v2` consistently from source defaults and bundled defaults.
2. Operator can run V2 for a focused request through focused slice planning, planning review, freeze, implementation, code validation, final live validation policy, and PR handoff.
3. Operator can give V2 a large request or PRD, produce or update a design doc and slice map, select exactly one slice, and execute only that selected slice.
4. Planning review blocks implementation until findings are fixed, deferred with reason, or explicitly waived.
5. PR-ready output preserves the persisted integration branch as the explicit PR base and feeds durable scope, assumption, or requirement changes back to the PRD and slice map.
   **Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase                             | Plans Complete | Status      | Completed |
| --------------------------------- | -------------- | ----------- | --------- |
| 1. Paused Approval State Contract | 0/TBD          | Not started | -         |
| 2. Web Paused Output Experience   | 0/TBD          | Not started | -         |
| 3. Non-Web Paused Output Adapters | 0/TBD          | Not started | -         |
| 4. Workflow Graph Readability     | 0/TBD          | Not started | -         |
| 5. Codex PIV V2 Delivery Lane     | 0/TBD          | Not started | -         |
