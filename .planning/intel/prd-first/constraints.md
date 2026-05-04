# Synthesized Constraints

## CON-codex-piv-v2-tier-model

source: docs/design/codex-piv-v2-workflow-design.md

type: nfr

content:

`archon-piv-loop-codex-v2` must be a middle tier: stronger than the simple Archon Codex PIV V1 lane, lighter than the local heavy Codex campaign system, native to Archon's workflow engine and web UI, and scoped to one executable slice per run.

## CON-codex-piv-v2-one-slice-per-run

source: docs/design/codex-piv-v2-workflow-design.md

type: protocol

content:

V2 may intake a large request, create or refresh a design doc, create a slice map, and select one slice, but a workflow run must execute exactly one selected slice. It must not become hidden multi-slice auto-orchestration.

## CON-codex-piv-v2-integration-branch

source: docs/design/codex-piv-v2-workflow-design.md

type: protocol

content:

For multi-slice delivery, the selected integration branch is both the slice start point and the default PR base. V2 must persist branch/base intent through planning, implementation, and finalization and must not silently open a PR against a different branch.

## CON-codex-piv-v2-artifact-authority

source: docs/design/codex-piv-v2-workflow-design.md

type: protocol

content:

PRDs own upstream requirements, design docs own architecture and tradeoffs, slice maps own campaign-level inventory/status, and focused slice plans own executable implementation contracts. Run-scoped validation evidence belongs under `$ARTIFACTS_DIR/e2e-reports/*`, with durable docs summarizing rather than storing raw evidence.

## CON-codex-piv-v2-review-gates

source: docs/design/codex-piv-v2-workflow-design.md

type: protocol

content:

Planning peer review must run after the focused slice plan and before implementation. Implementation peer review must run after code validation and before closeout. Material review/fix loops are capped at three iterations, and durable accepted/deferred findings must feed back to the focused plan and upstream surfaces.

## CON-codex-piv-v2-validation

source: docs/design/codex-piv-v2-workflow-design.md

type: nfr

content:

V2 must separate code validation from final live validation. Runtime behavior changes require a real live validation proof when feasible, such as a browser/API/CLI smoke against a running local path, or an explicit waiver when live validation is genuinely not possible.
