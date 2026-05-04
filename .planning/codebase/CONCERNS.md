# Codebase Concerns

**Analysis Date:** 2026-05-04

## Tech Debt

**Workflow executor concentration:**

- Issue: `packages/workflows/src/dag-executor.ts` is a 3,885-line executor that owns topology, retry policy, provider dispatch, subprocess execution, approval pause/resume, workflow event persistence, loop handling, MCP failure filtering, activity heartbeats, cost aggregation, and user-facing messaging.
- Files: `packages/workflows/src/dag-executor.ts`
- Impact: Executor changes have a broad blast radius; workflow runtime fixes often require understanding unrelated concerns in the same file. Parallel-layer execution, approval state, and output substitution interact inside one module.
- Fix approach: Extract stable seams by behavior, not by generic utility: subprocess node execution, approval/pause handling, provider node execution, event persistence, and layer scheduling. Keep `executeDagWorkflow()` as an orchestration facade.

**REST API route concentration:**

- Issue: `packages/server/src/routes/api.ts` is a 2,648-line module that defines schemas, CORS, upload handling, conversations, codebases, env vars, workflows, artifacts, config, providers, dashboard, and health routes.
- Files: `packages/server/src/routes/api.ts`, `packages/server/src/routes/schemas/*.ts`
- Impact: Adding or reviewing one endpoint requires scanning a large mixed-concern file. Route-level auth, path validation, cleanup, and serialization policy are easy to apply inconsistently.
- Fix approach: Split handlers by domain under `packages/server/src/routes/handlers/` while keeping shared helpers (`apiError`, `validateCwd`, upload validation, OpenAPI registration) explicit and reused.

**Orchestrator agent concentration:**

- Issue: `packages/core/src/orchestrator/orchestrator-agent.ts` is a 1,645-line module that handles workflow routing, input preflight, worktree resolution, platform message persistence, natural-language approval routing, provider dispatch, title generation, and error reporting.
- Files: `packages/core/src/orchestrator/orchestrator-agent.ts`
- Impact: Conversation dispatch, workflow execution, and platform persistence are coupled. Approval behavior and normal chat behavior share state-heavy control flow.
- Fix approach: Extract approval routing, workflow launch preparation, provider request construction, and message persistence into focused collaborators with narrow interfaces.

**Generated workflow/default bundle drift:**

- Issue: Defaults exist in source YAML/Markdown plus generated TypeScript. The root validation includes `bun run check:bundled`, which is required because the generated bundle can drift from `.archon/workflows/defaults/**` and `.archon/commands/defaults/**`.
- Files: `package.json`, `scripts/generate-bundled-defaults.ts`, `packages/workflows/src/defaults/bundled-defaults.generated.ts`, `.archon/workflows/defaults/**`, `.archon/commands/defaults/**`
- Impact: A workflow can pass YAML review but ship stale bundled defaults if generation is skipped. The generated file is large and noisy, so review quality depends on checking source and generated outputs together.
- Fix approach: Treat source defaults as canonical. Always run `bun run check:bundled` before shipping workflow or command changes; regenerate with `bun run generate:bundled` only when source defaults intentionally change.

**PIV V2 responsibility boundary drift:**

- Issue: `.archon/workflows/defaults/archon-piv-loop-codex-v2.yaml` says the PIV loop comes after a PRD exists and is not for PRD creation, but Mode B creates or refreshes a design doc, creates a slice map, selects one slice, and then enters the one-slice PIV lane.
- Files: `.archon/workflows/defaults/archon-piv-loop-codex-v2.yaml`, `docs/plans/archon-requirements-gate-codex_plan.md`, `docs/design/codex-piv-v2-workflow-design.md`
- Impact: Broad requests can be partially formalized by PIV V2 before a dedicated requirements gate exists. This blurs routing between intake, PRD/requirements formalization, and execution.
- Fix approach: Add an entry guard to PIV V2 that accepts only focused PRDs, focused slice briefs, or a requirements handoff with one selected slice. Move broad Mode B artifact creation into `archon-requirements-gate-codex` or a compatibility wrapper.

## Known Bugs

**Workflow input preflight can fail open on git status errors:**

- Symptoms: `preflightWorkflowInputFiles()` treats `git status --porcelain` failures as an empty status, so a git failure can hide uncommitted changes for a referenced local input file.
- Files: `packages/core/src/utils/workflow-input-preflight.ts`, `packages/core/src/orchestrator/orchestrator-agent.ts`, `packages/cli/src/commands/workflow.ts`
- Trigger: Any isolated workflow launch that references a local file while `git status` fails due to permissions, transient repository state, or an unexpected git error.
- Workaround: Run from a healthy git checkout and commit input files before launching isolated workflows.
- Fix approach: Return a typed preflight error for git command failures and block isolation unless the failure is a known "path absent" condition.

**Artifact serving assumes `codebase.name` has `owner/repo` shape:**

- Symptoms: `/api/artifacts/:runId/*` derives artifact storage paths from `codebase.name.split('/')`; codebases without two name segments return "could not determine owner/repo" even when the run and file exist.
- Files: `packages/server/src/routes/api.ts`, `packages/web/src/components/chat/MessageBubble.tsx`, `packages/web/src/components/workflows/ArtifactViewerModal.tsx`
- Trigger: Workflow artifacts for locally registered repositories whose codebase name is not `owner/repo`.
- Workaround: Access the artifact directly from the run artifact directory on disk.
- Fix approach: Store `artifact_owner`/`artifact_repo` or `artifact_dir` on the workflow run, instead of deriving storage identity from the display name.

**Claude provider env-leak gate is tracked but not enforced in provider code:**

- Symptoms: `ClaudeProvider.sendQuery()` contains TODO `#1135` stating the pre-spawn env-leak gate was removed during provider extraction and caller-side enforcement is tracked separately.
- Files: `packages/providers/src/claude/provider.ts`, `packages/docs-web/src/content/docs/reference/security.md`, `packages/paths/src/strip-cwd-env.ts`
- Trigger: Provider subprocess launches depend on upstream boot/caller env cleanup being correct. A missed entry point can pass unintended environment variables into Claude subprocesses.
- Workaround: Use Archon-owned `.env` files and avoid putting Archon secrets in target repo `.env` files.
- Fix approach: Add caller-side enforcement tests at every provider launch path and make pre-spawn env checks fail closed before `ClaudeProvider.sendQuery()`.

**Codex structured output parsing is fragile to non-JSON assistant text:**

- Symptoms: The Codex provider parses structured output from the last assistant message as JSON; if the message is not JSON, it emits a warning that downstream `$nodeId.output.field` references may not evaluate correctly.
- Files: `packages/providers/src/codex/provider.ts`, `packages/workflows/src/dag-executor.ts`, `.archon/workflows/defaults/archon-piv-loop-codex-v2.yaml`
- Trigger: A Codex node with `output_format` returns prose, markdown-fenced invalid JSON, or extra text around JSON.
- Workaround: Keep `output_format` prompts explicit and validate downstream outputs with bash/script guard nodes where the output controls workflow routing.
- Fix approach: Add provider-level structured output contract tests for all default Codex workflows and fail the node when required structured output is missing.

## Security Considerations

**Web API is open by default when exposed:**

- Risk: API routes use CORS origin `WEB_UI_ORIGIN || '*'`, and project security docs state the Web UI has no built-in user authentication. A publicly exposed deployment without Caddy/auth profile can allow remote users to operate an AI agent with file and shell access.
- Files: `packages/server/src/routes/api.ts`, `packages/docs-web/src/content/docs/reference/security.md`, `docker-compose.yml`, `auth-service/server.js`
- Current mitigation: `auth-service/server.js` provides optional form auth for Caddy `forward_auth`, and security docs require Caddy basic/form auth when exposing the Web UI publicly.
- Recommendations: Treat `WEB_UI_ORIGIN` plus reverse-proxy auth as required for non-local deployments. Add a startup warning when `BUNDLED_IS_BINARY` or Docker listens on a non-loopback host without auth-related configuration.

**Per-codebase environment variables are stored plaintext:**

- Risk: `remote_agent_codebase_env_vars.value` is `TEXT NOT NULL`; migration comments explicitly state "No encryption". API responses return keys only, but any DB reader can access values.
- Files: `migrations/020_codebase_env_vars.sql`, `packages/core/src/db/env-vars.ts`, `packages/server/src/routes/schemas/codebase.schemas.ts`, `packages/core/src/orchestrator/orchestrator-agent.ts`
- Current mitigation: Values are not returned by the list endpoint, debug logs include only keys, and the product is documented as single-developer.
- Recommendations: Label UI-managed env vars as DB-stored plaintext, avoid storing long-lived production secrets there, and consider OS keychain or encrypted-at-rest storage before multi-user/cloud use.

**Workflow subprocess nodes execute arbitrary shell and script content:**

- Risk: Bash nodes run `bash -c <workflow content>` and script nodes run `bun --no-env-file` or `uv run`; workflow config env vars are merged into subprocess environments.
- Files: `packages/workflows/src/dag-executor.ts`, `.archon/workflows/defaults/**`, `packages/docs-web/src/content/docs/guides/script-nodes.md`
- Current mitigation: Bash/script nodes are workflow-authored, have default timeouts, sanitize error output, and use `bun --no-env-file` for Bun script nodes.
- Recommendations: Treat workflow authoring as trusted code execution. For shared/community workflows, require review of bash/script nodes, dependency lists, and env var usage before installation.

**Pi provider mutates process-wide environment:**

- Risk: Pi config-level env vars are copied into `process.env` for in-process extensions when missing. Those values can persist for later provider calls in the same server process.
- Files: `packages/providers/src/community/pi/provider.ts`, `packages/providers/src/types.ts`
- Current mitigation: Existing shell env wins and request-level env remains separate for subprocess isolation.
- Recommendations: Prefer request-scoped env injection where possible. Add tests that verify Pi config env does not leak across codebases or later sessions that do not request the same keys.

## Performance Bottlenecks

**Wide DAG layers have no visible concurrency limiter:**

- Problem: `executeDagWorkflow()` runs every node in a topological layer through `Promise.allSettled()`. A wide workflow can start many provider sessions or subprocesses at once.
- Files: `packages/workflows/src/dag-executor.ts`
- Cause: Parallelism is derived from graph shape, not from a configured concurrency budget.
- Improvement path: Add workflow-level and global `maxParallelNodes` controls, default to a conservative value, and preserve existing behavior only when explicitly configured.

**Workflow events can store large node outputs inline:**

- Problem: Bash/script node completion events include `node_output: output` in event data. Large stdout payloads can bloat SQLite/PostgreSQL rows and SSE/dashboard payloads.
- Files: `packages/workflows/src/dag-executor.ts`, `packages/core/src/db/workflow-events.ts`, `packages/server/src/routes/api.ts`
- Cause: Node output is both runtime data for substitution and event data for UI/history.
- Improvement path: Store large outputs as artifacts with previews in events. Keep event payloads bounded and fetch full content through artifact endpoints.

**Artifact endpoint reads complete files into memory:**

- Problem: `/api/artifacts/:runId/*` reads artifact files with `readFile(filePath, 'utf-8')` and returns one complete `Response`.
- Files: `packages/server/src/routes/api.ts`, `packages/web/src/components/workflows/ArtifactViewerModal.tsx`
- Cause: Artifact serving is optimized for text/markdown convenience rather than large files.
- Improvement path: Add size checks, stream large artifacts, and keep the modal on bounded text previews.

## Fragile Areas

**Bun `mock.module()` test isolation:**

- Files: `CLAUDE.md`, `packages/*/package.json`, `packages/**/*.test.ts`
- Why fragile: Bun module mocks persist across process-wide module cache; package test scripts manually split conflicting files into separate `bun test` invocations.
- Safe modification: Add new `mock.module()` tests to their own batch when they mock shared modules. Run `bun run test`, not root `bun test`.
- Test coverage: Existing package scripts encode isolation batches; coverage depends on contributors preserving those scripts when adding test files.

**PIV V2 YAML embeds multiple languages and runtime contracts:**

- Files: `.archon/workflows/defaults/archon-piv-loop-codex-v2.yaml`, `packages/workflows/src/loader.ts`, `packages/workflows/src/dag-executor.ts`
- Why fragile: The workflow mixes Codex prompts, structured output schemas, loop sentinels, typed decision gates, bash, and Python heredocs. YAML/schema validation cannot prove all embedded scripts and prompt contracts execute correctly.
- Safe modification: Pair every YAML change with `bun run check:bundled`, targeted loader/default tests, and a live or scripted workflow smoke for the affected branch.
- Test coverage: Static tests cover loader/schema/runtime pieces; live Codex workflow smoke exists but is opt-in through `ARCHON_LIVE_E2E=1`.

**Worktree cleanup and deletion paths:**

- Files: `packages/isolation/src/providers/worktree.ts`, `packages/core/src/services/cleanup-service.ts`, `packages/server/src/routes/api.ts`
- Why fragile: Cleanup uses git worktree removal, branch deletion, optional remote branch deletion, and recursive workspace directory removal for Archon-managed paths.
- Safe modification: Keep path normalization and Archon-managed root checks intact. Prefer git-native removal first, and preserve "skip with reason" behavior for uncommitted changes or active sessions.
- Test coverage: Worktree and cleanup tests exist, but destructive cleanup behavior requires careful integration testing with real git repositories.

**Fork-local protected paths:**

- Files: `AGENTS.md`, `.agents/skills/**`, `.claude/skills/archon/**`, `.archon/workflows/defaults/*codex*`, `.archon/commands/defaults/*codex*`, `packages/cli/src/bundled-skill.ts`, `packages/cli/src/commands/skill.ts`, `docs/design/**`, `docs/prd/**`, `docs/plans/**`
- Why fragile: This repository intentionally diverges from upstream. Upstream sync must merge into personalized `dev` while preserving fork-local Codex/PIV workflow surfaces.
- Safe modification: Read `docs/reference/mase-archon-fork-operating-model.md` before changing protected paths. Use merge-based upstream sync and classify incoming changes as port/adapt/preserve/drop.
- Test coverage: Bundle drift and skill install behavior have targeted checks; upstream merge conflict behavior remains operator-governed.

## Scaling Limits

**Single-developer trust model:**

- Current capacity: Product docs describe single-developer use and no multi-tenant isolation.
- Limit: Shared teams or public deployments can expose full working-directory read/write/execute ability through Web UI or adapters if auth/allowlists are not configured.
- Scaling path: Add first-class auth for Web UI, audit logging by actor, per-codebase access control, and provider/tool permission policies before multi-user use.

**SQLite default and event-heavy workflows:**

- Current capacity: SQLite is default and PostgreSQL is optional.
- Limit: Long-running workflows with many events, large node outputs, and concurrent runs can make dashboard/history queries slower and grow local DB size quickly.
- Scaling path: Bound event payloads, archive old workflow events, use PostgreSQL for always-on/cloud deployments, and add indexed query reviews for dashboard endpoints.

**Live validation depends on external credentials and model credits:**

- Current capacity: `scripts/e2e/codex-live-workflow-smoke.ts` is gated by `ARCHON_LIVE_E2E=1` and notes it requires real Codex provider credentials/network and may spend model credits.
- Limit: Critical provider/workflow behavior can remain untested in routine local/CI validation.
- Scaling path: Keep deterministic unit/integration tests for contracts, and schedule explicit live-smoke runs for release candidates or workflow-runtime changes.

## Dependencies at Risk

**External AI SDK behavior:**

- Risk: Claude and Codex providers depend on SDK-specific event shapes, structured output behavior, subprocess auth behavior, and model aliases.
- Impact: Provider updates can break streaming, structured output, resume/session IDs, token accounting, or auth handling.
- Migration plan: Keep provider contract tests in `packages/providers/src/**`, pin known-good SDK versions in `bun.lock`, and test default workflows when bumping `@anthropic-ai/claude-agent-sdk` or `@openai/codex-sdk`.

**Optional browser automation tooling:**

- Risk: UI/E2E skills rely on `agent-browser`, which is optional and has platform-specific setup requirements.
- Impact: UI validation can be skipped or become environment-dependent.
- Migration plan: Keep unit tests independent of browser tooling, document setup in `.agents/skills/agent-browser/SKILL.md`, and use Playwright or `agent-browser` smoke only when the environment is prepared.

**Haiku model alias usage conflicts with fork policy:**

- Risk: Default workflows, examples, and GSD model-profile docs still reference `model: haiku` or Haiku-tier model profiles.
- Impact: A workflow can select a model tier Mase does not want used for reasoning unless the runtime configuration overrides it.
- Migration plan: Audit `.archon/workflows/defaults/**`, `.archon/workflows/test-workflows/**`, `.agents/skills/archon/references/**`, and `.codex/get-shit-done/**` before running automated workflows. Replace reasoning nodes with approved model aliases or runtime-native overrides.

## Missing Critical Features

**Dedicated Archon requirements gate:**

- Problem: The planning docs define `archon-requirements-gate-codex`, but the current implementation still relies on PIV V2 Mode B for broad-request design/slice artifact creation.
- Blocks: Clean separation between intake, PRD/requirements formalization, and PIV execution for broad or ambiguous requests.

**First-class Web UI authentication:**

- Problem: Web UI auth is delegated to reverse proxy/auth-service configuration.
- Blocks: Safe multi-user operation and public deployments without operator-managed proxy setup.

**Bounded workflow output storage:**

- Problem: Node outputs can be stored in workflow events and rendered back through dashboard/history surfaces without a central size policy.
- Blocks: Predictable storage growth and responsive UI for long-running or verbose workflows.

## Test Coverage Gaps

**Input preflight error handling:**

- What's not tested: Git command failure classification in `gitStatusForPath()` and `gitPathExistsAtRef()` as distinct from clean status or file absence.
- Files: `packages/core/src/utils/workflow-input-preflight.ts`, `packages/core/src/utils/workflow-input-preflight.test.ts`
- Risk: Isolated workflows launch with local input files that are not actually available in the new worktree.
- Priority: High

**Default workflow live behavior:**

- What's not tested: End-to-end behavior of complex default workflows such as `archon-piv-loop-codex-v2` under real provider output, approval loops, structured output, and Mode B script guards.
- Files: `.archon/workflows/defaults/archon-piv-loop-codex-v2.yaml`, `scripts/e2e/codex-live-workflow-smoke.ts`, `packages/workflows/src/defaults/bundled-defaults.test.ts`
- Risk: Static schema and bundled-default tests pass while runtime prompt/script interactions fail.
- Priority: High

**Web UI auth/exposure configuration:**

- What's not tested: Deployment-level behavior when Web UI is exposed with default CORS/auth settings, Caddy form auth, and `WEB_UI_ORIGIN`.
- Files: `packages/server/src/routes/api.ts`, `docker-compose.yml`, `auth-service/server.js`, `packages/docs-web/src/content/docs/reference/security.md`
- Risk: Operators can deploy an unauthenticated remote control surface by following only the default app profile.
- Priority: Medium

**Plaintext env var lifecycle:**

- What's not tested: Redaction and non-return of env var values across all API, logs, workflow events, and provider warning paths.
- Files: `packages/core/src/db/env-vars.ts`, `packages/server/src/routes/api.ts`, `packages/core/src/orchestrator/orchestrator-agent.ts`, `packages/providers/src/**`
- Risk: Future logging or event payload changes expose configured secrets.
- Priority: Medium

---

_Concerns audit: 2026-05-04_
