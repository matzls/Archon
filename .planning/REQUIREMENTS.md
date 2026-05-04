# Requirements: Archon

**Defined:** 2026-05-04
**Core Value:** Codex-facing Archon workflows are honest, narrow, and reliable enough that Mase can trust the workflow state, paused output, validation evidence, and PR-ready handoff.

## v1 Requirements

Requirements for the initialized Archon Codex workflow reliability milestone. Each maps to exactly one roadmap phase.

### Codex Workflow Delivery

- [ ] **REQ-archon-piv-loop-codex-v2**: Create an Archon-native Codex workflow tier for serious one-slice feature delivery, with focused slice planning, review gates, validation, integration-branch preservation, PR handoff, and feedback into upstream artifacts. _(Source status: planned)_

### Paused Approval Output

- [ ] **REQ-paused-snapshot-contract-design**: Define an additive paused approval snapshot contract that preserves `approval.lastOutput` compatibility while exposing semantic assistant closing output and explicit truncation metadata. _(Source status: implemented)_
- [ ] **REQ-paused-output-web-parity**: Show the latest persisted paused workflow output in Web chat and dashboard approval surfaces while preserving the short approval prompt. _(Source status: implemented)_
- [ ] **REQ-full-output-fallback**: When a bounded paused Web preview is clipped, provide an explicit action that opens the authoritative full paused output through the existing worker conversation logs path. _(Source status: implemented)_

### Runtime Metadata

- [ ] **REQ-runtime-metadata-hygiene**: Separate live paused-workflow approval metadata from resolved approval history so non-paused runtime rows do not look actionable while resume logic retains needed context. _(Source status: implemented)_

### Adapter Output

- [ ] **REQ-non-web-paused-output-adapter-review**: Keep CLI as the only live non-Web paused-output surface and improve CLI plus shared `/workflow status` output to prefer semantic paused previews without adding transcript dumps. _(Source status: accepted)_

### Workflow Graph Readability

- [ ] **REQ-workflow-node-display-names**: Add optional human-readable `display_name` labels to DAG nodes and show them in execution graph node cards without changing builder behavior in phase 1. _(Source status: draft)_

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

None identified by the PRD-first ingest.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                                                  | Reason                                                                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Strict non-Web parity with Web paused-output behavior    | Adapter behavior is explicitly tiered; CLI and shared status receive semantic previews, not full Web parity. |
| Automatic paused transcript dumps for non-Web adapters   | Adds noise and risk; the accepted non-Web scope is one preferred preview only.                               |
| Non-Web full-output fallback path                        | The Web fallback uses existing worker conversation logs; non-Web fallback is explicitly out of scope.        |
| Large paused-output payloads in routine status responses | The system should keep routine status bounded and use logs for authoritative full output.                    |
| Filesystem log-reading endpoint                          | Full paused output should use existing worker conversation history, not a new endpoint.                      |
| Multi-slice auto-orchestration inside PIV V2             | V2 is a middle tier and must execute exactly one selected slice per run.                                     |
| Builder canvas editing/rendering for display names       | Phase 1 display names affect execution graph node cards only.                                                |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement                              | Phase   | Status  |
| ---------------------------------------- | ------- | ------- |
| REQ-paused-snapshot-contract-design      | Phase 1 | Pending |
| REQ-runtime-metadata-hygiene             | Phase 1 | Pending |
| REQ-paused-output-web-parity             | Phase 2 | Pending |
| REQ-full-output-fallback                 | Phase 2 | Pending |
| REQ-non-web-paused-output-adapter-review | Phase 3 | Pending |
| REQ-workflow-node-display-names          | Phase 4 | Pending |
| REQ-archon-piv-loop-codex-v2             | Phase 5 | Pending |

**Coverage:**

- v1 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0

---

_Requirements defined: 2026-05-04_
_Last updated: 2026-05-04 after roadmap creation_
