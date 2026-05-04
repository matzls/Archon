# Synthesized Requirements

## REQ-archon-piv-loop-codex-v2

source: docs/prd/r001-archon-piv-loop-codex-v2.md

status: planned

scope: `archon-piv-loop-codex-v2` workflow, Codex workflow tiering, focused slice plans, design-doc intake, slice maps, planning review gates, code validation, final live validation, integration branches, PR handoff.

description:

Create an Archon-native Codex workflow tier for serious one-slice feature delivery. It should sit between the simple V1 PIV loop and the local heavy multi-slice campaign system.

acceptance_criteria:

- The V2 default workflow validates with Archon's workflow validator and is included consistently in source and bundled defaults.
- V2 is documented as one serious slice per run, not as a hidden campaign orchestrator.
- Focused requests can proceed through focused slice planning, planning review, freeze, implementation, code validation, final live validation policy, and PR handoff.
- Large requests or PRDs can produce or update a design doc and slice map, select exactly one slice, and execute only that slice.
- Focused slice plans include status, inputs, unresolved items, review-gate state, code validation commands, final live validation plan, documentation surface map, and risks.
- Planning review blocks implementation until findings are fixed, deferred with reason, or explicitly waived.
- Runtime behavior changes record live validation evidence under the agreed run-scoped path or record an explicit waiver.
- Slice PR or PR-ready payloads preserve the persisted integration branch as the explicit PR base.
- Completed slices feed durable scope, assumption, or requirement changes back to the PRD and slice map.

## REQ-paused-output-web-parity

source: docs/prd/paused-output-web-parity.prd.md

status: implemented

scope: paused Web workflow cards, clipped paused previews, workflow chat progress card, dashboard workflow run card, `approval.lastOutput`.

description:

Show the latest persisted paused workflow output in Web chat and dashboard approval surfaces while preserving the short approval prompt.

acceptance_criteria:

- A paused workflow in the Web chat progress card shows the approval prompt and `Latest output` when `approval.lastOutput` exists.
- A paused workflow in the dashboard workflow run card shows the approval prompt and `Latest output` when `run.metadata.approval.lastOutput` exists.
- New latest-output rendering is gated on `status === "paused"`.
- Output ending with `[truncated]` shows a visible clipped-output notice.
- No backend schema, executor, database, or workflow persistence change is made in this slice.

## REQ-paused-snapshot-contract-design

source: docs/prd/paused-snapshot-contract-design.prd.md

status: implemented

scope: paused approval snapshot, `lastOutput`, `lastOutputTruncated`, `finalAssistantOutput`, `finalAssistantOutputTruncated`, workflow executor, approval metadata, SSE status payloads.

description:

Define an additive paused approval snapshot contract that keeps compatibility output while exposing the assistant's semantic closing output when available.

acceptance_criteria:

- `approval.lastOutput` remains the compatibility field and keeps current cleaned-output semantics.
- The paused approval contract adds typed truncation metadata for `lastOutput`.
- The contract adds optional `finalAssistantOutput` and `finalAssistantOutputTruncated`.
- Whenever `lastOutput` is present, `lastOutputTruncated` is serialized as an explicit boolean.
- Whenever `finalAssistantOutput` is present, `finalAssistantOutputTruncated` is serialized as an explicit boolean.
- `finalAssistantOutput` is derived from the last contiguous assistant text segment after the most recent tool activity, or from the final assistant segment when no tool exists.
- If no assistant text exists after the last tool activity, `finalAssistantOutput` is omitted.
- Tests cover long tool-heavy iterations, no-tool iterations, no-closing-assistant cases, approval re-pause, contract serialization, segment boundaries, and truncation flags.

## REQ-runtime-metadata-hygiene

source: docs/prd/runtime-metadata-hygiene.prd.md

status: implemented

scope: workflow runtime metadata, `metadata.approval`, `metadata.lastApproval`, paused workflow runs, approval gates, resume logic, Web UI, CLI, API.

description:

Separate live paused-workflow approval metadata from resolved approval history so non-paused runtime rows do not look actionable while resume logic still has needed context.

acceptance_criteria:

- `status === "paused"` is the only actionable pause signal in runtime state.
- Paused runs persist `metadata.approval` with live gate context.
- `running`, `failed`, `completed`, and `cancelled` runs do not persist `metadata.approval`.
- Approve/reject paths archive the latest resolved gate to `metadata.lastApproval` with decision metadata and enough audit/debug context.
- Standard approval, reject-with-`on_reject`, ordinary interactive-loop approval, and completion-alias loop approval still resume correctly.
- Workflow events remain the detailed history surface; no full metadata approval-history array is required.
- Web, CLI, and API pause rendering do not treat non-paused rows as live pauses.

## REQ-full-output-fallback

source: docs/prd/full-output-fallback.prd.md

status: implemented

scope: clipped paused previews, workflow run details logs view, worker conversation history, bounded paused status payloads, Archon Web workflows.

description:

When a bounded paused Web preview is clipped, provide an explicit action that opens the authoritative full paused output through the existing worker conversation logs path.

acceptance_criteria:

- A paused Web card with a non-truncated preview behaves as it does today.
- A paused Web card with a truncated preview shows `View full paused output`.
- That action opens the workflow run details page in a logs-oriented view.
- The logs-oriented view uses existing worker conversation history as the full output source.
- The operator can inspect the full paused exchange without adding large paused-output payloads to routine status responses.
- If the full-log path is unavailable, the UI reports that clearly.
- No filesystem log-reading endpoint is introduced.

## REQ-non-web-paused-output-adapter-review

source: docs/prd/non-web-paused-output-adapter-review.prd.md

status: accepted

scope: non-Web paused output, CLI paused rendering, shared `/workflow status`, GitHub command path, `finalAssistantOutput`, `lastOutput`, truncation wording.

description:

Define the smallest justified non-Web paused-output improvement: keep CLI as the only live non-Web paused-output surface and improve CLI plus shared `/workflow status` pull output to prefer semantic paused previews.

acceptance_criteria:

- Non-Web behavior is explicitly adapter-tiered, not strict Web parity.
- CLI paused rendering prefers `finalAssistantOutput` over `lastOutput` when both exist.
- Shared `/workflow status` prefers `finalAssistantOutput` over `lastOutput`, so GitHub inherits the better preview through the command/status path.
- CLI and shared `/workflow status` show one preferred preview only.
- Plain-text outputs clearly indicate when the chosen preview is clipped.
- No automatic paused transcript dump is added for any non-Web adapter.
- No non-Web full-output fallback path is introduced.

## REQ-workflow-node-display-names

source: docs/prd/workflow-node-display-names.prd.md

status: draft

scope: workflow execution graph, DAG nodes, node labels, `display_name` schema field, web UI graph components, workflow definitions.

description:

Add optional human-readable `display_name` labels to DAG nodes and show them in execution graph node cards so operators can understand workflow graph purpose without decoding YAML ids.

acceptance_criteria:

- Add optional `display_name?: string` to the shared DAG node schema.
- Regenerate frontend API types so the Web app receives the new field.
- Execution graph node cards show `display_name` when present.
- Execution graph fallbacks distinguish command, shell, prompt, loop, script, approval, and cancel nodes without changing builder behavior in phase 1.
- For display-name-annotated workflows, no raw `node.id` appears as the execution graph primary label.
- Phase 1 makes no DB event contract changes and keeps `step_name` as `node.id`.
- Builder canvas editing/rendering, non-graph execution surfaces, inference fallbacks, retroactive relabeling, and per-platform label variants remain out of scope for phase 1.
