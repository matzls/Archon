<!-- refreshed: 2026-05-04 -->

# Architecture

**Analysis Date:** 2026-05-04

## System Overview

```text
+-------------------------------------------------------------+
|                       User Entry Points                     |
|  CLI: `packages/cli/src/cli.ts`                             |
|  HTTP/Web: `packages/server/src/index.ts`                   |
|  Browser UI: `packages/web/src/App.tsx`                     |
+----------------------+----------------------+---------------+
                       |                      |
                       v                      v
+-------------------------------------------------------------+
|                  Orchestration and API Layer                |
|  Message router: `packages/core/src/orchestrator/`          |
|  API routes: `packages/server/src/routes/api.ts`            |
|  Web adapter/SSE: `packages/server/src/adapters/web/`       |
+----------------------+----------------------+---------------+
                       |                      |
                       v                      v
+-------------------------------------------------------------+
|                 Workflow, Provider, Isolation Core          |
|  Workflow engine: `packages/workflows/src/`                 |
|  Provider registry: `packages/providers/src/`               |
|  Worktree isolation: `packages/isolation/src/`              |
|  Git helpers: `packages/git/src/`                           |
+----------------------+----------------------+---------------+
                       |
                       v
+-------------------------------------------------------------+
|              State, Artifacts, Defaults, Project Files      |
|  DB modules: `packages/core/src/db/`                        |
|  Migrations: `migrations/`                                  |
|  Paths/config: `packages/paths/src/`                        |
|  Workflows/commands: `.archon/` and bundled defaults        |
+-------------------------------------------------------------+
```

## Component Responsibilities

| Component                      | Responsibility                                                                                                                                                | File                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| CLI entrypoint                 | Parses top-level commands, strips unsafe CWD env, loads Archon env, registers providers, dispatches CLI commands.                                             | `packages/cli/src/cli.ts`                                                          |
| CLI workflow command           | Loads workflows, enforces worktree flag policy, creates CLI conversation state, resolves isolation, executes workflow.                                        | `packages/cli/src/commands/workflow.ts`                                            |
| Server entrypoint              | Boots Hono API, platform adapters, web SSE adapter, database, cleanup scheduler, and provider registry.                                                       | `packages/server/src/index.ts`                                                     |
| Web API routes                 | Owns `/api/*` route registration, OpenAPI schemas, CORS, uploads, workflow CRUD/run actions, artifacts, SSE endpoints.                                        | `packages/server/src/routes/api.ts`                                                |
| Web UI shell                   | Wires React router, query client, project context, error boundary, and top-level pages.                                                                       | `packages/web/src/App.tsx`                                                         |
| Orchestrator agent             | Single message entry point for chat platforms, deterministic slash commands, natural-language approval routing, workflow discovery, and AI provider dispatch. | `packages/core/src/orchestrator/orchestrator-agent.ts`                             |
| Orchestrator isolation bridge  | Coordinates isolation resolution and background workflow dispatch for web worker conversations.                                                               | `packages/core/src/orchestrator/orchestrator.ts`                                   |
| Workflow executor              | Creates/resumes workflow runs, enforces path locks, resolves providers/config, creates artifact paths, and calls the DAG executor.                            | `packages/workflows/src/executor.ts`                                               |
| DAG executor                   | Executes workflow nodes in topological layers, supports parallel layers, approvals, bash/script/prompt/loop nodes, events, retries, and resume skips.         | `packages/workflows/src/dag-executor.ts`                                           |
| Workflow discovery and loading | Discovers bundled/global/project workflows, parses YAML with Bun, validates DAG structure and schema.                                                         | `packages/workflows/src/workflow-discovery.ts`, `packages/workflows/src/loader.ts` |
| Provider registry              | Registers Claude, Codex, and community providers and returns provider instances by ID.                                                                        | `packages/providers/src/registry.ts`                                               |
| Isolation resolver             | Reuses, adopts, or creates worktree isolation environments using DB-backed workflow identity.                                                                 | `packages/isolation/src/resolver.ts`                                               |
| Worktree provider              | Creates/removes git worktrees, validates repo-local worktree paths, copies configured files into worktrees.                                                   | `packages/isolation/src/providers/worktree.ts`                                     |
| Database adapter layer         | Auto-selects PostgreSQL from `DATABASE_URL` or SQLite at Archon home.                                                                                         | `packages/core/src/db/connection.ts`                                               |
| Path/config utilities          | Centralizes Archon home, workspace, workflow, command, script, artifact, log, and env paths.                                                                  | `packages/paths/src/archon-paths.ts`, `packages/core/src/config/config-loader.ts`  |
| Platform adapters              | Integrates chat/forge platforms with `IPlatformAdapter`.                                                                                                      | `packages/adapters/src/`                                                           |
| Fork-local skills              | Defines repo-local operator workflows, validation workflows, sync policy, and Codex/Claude skill surfaces.                                                    | `.agents/skills/`, `.codex/skills/`                                                |

## Pattern Overview

**Overall:** Bun TypeScript monorepo with package-layered services, dependency-injected workflow execution, adapter-based platforms, and DB-backed state.

**Key Characteristics:**

- Package boundaries are explicit through workspace packages: `@archon/cli`, `@archon/server`, `@archon/core`, `@archon/workflows`, `@archon/providers`, `@archon/isolation`, `@archon/git`, `@archon/paths`, and `@archon/adapters`.
- Entry points must bootstrap environment stripping, Archon-owned env loading, and provider registration before application logic reads provider/config state. See `packages/cli/src/cli.ts:12`, `packages/cli/src/cli.ts:16`, `packages/cli/src/cli.ts:36`, `packages/server/src/index.ts:10`, `packages/server/src/index.ts:35`, and `packages/server/src/index.ts:50`.
- Workflow execution is separated from persistence through `WorkflowDeps` and `IWorkflowStore`; the concrete store adapter lives in `packages/core/src/workflows/store-adapter.ts`.
- Worktree isolation is a first-class safety layer, not an incidental implementation detail. Both chat and CLI paths route through isolation policy before mutating checkouts.
- The Web UI consumes typed REST and SSE surfaces from the Hono server, with generated OpenAPI types in `packages/web/src/lib/api.generated.d.ts`.
- Repo-local skills are part of the product surface for this fork. `.agents/skills/archon-dev/SKILL.md` routes development work, `.agents/skills/archon/SKILL.md` documents user-facing Archon operation, and `.codex/skills/gsd-map-codebase/SKILL.md` owns this mapping artifact contract.

## Layers

**Entrypoint Layer:**

- Purpose: Initialize process environment, parse user input, start long-lived services, and route to command/server handlers.
- Location: `packages/cli/src/cli.ts`, `packages/server/src/index.ts`, `packages/web/src/main.tsx`, `packages/web/src/App.tsx`
- Contains: CLI parser, Hono server boot, React app boot.
- Depends on: `@archon/paths`, `@archon/providers`, `@archon/core`, `@archon/server`, `@archon/workflows`.
- Used by: Users running `archon`, web clients, platform webhooks.

**API and Platform Adapter Layer:**

- Purpose: Expose HTTP routes, SSE streams, webhook endpoints, and chat/forge platform adapters.
- Location: `packages/server/src/routes/api.ts`, `packages/server/src/adapters/web/`, `packages/adapters/src/`
- Contains: Hono route registration, OpenAPI route configs, upload validation, web message persistence, SSE transport, Telegram/GitHub/Discord/Slack/Gitea/GitLab adapters.
- Depends on: `@archon/core`, `@archon/workflows`, `@archon/git`, `@archon/paths`.
- Used by: Web UI, platform webhooks, background workflow dispatch.

**Core Orchestration Layer:**

- Purpose: Convert user messages into deterministic commands, workflow runs, or AI provider conversations.
- Location: `packages/core/src/orchestrator/`, `packages/core/src/handlers/`, `packages/core/src/operations/`
- Contains: `handleMessage`, command parsing, workflow dispatch, session transitions, natural-language approvals, codebase registration operations.
- Depends on: DB modules, workflow discovery/executor, provider registry, isolation resolver.
- Used by: `packages/server/src/index.ts`, `packages/server/src/routes/api.ts`, `packages/cli/src/commands/chat.ts`.

**Workflow Engine Layer:**

- Purpose: Load, validate, execute, resume, pause, and observe DAG-based workflows.
- Location: `packages/workflows/src/`
- Contains: YAML loader, schema definitions, command validation, router, executor, DAG executor, event emitter, bundled defaults.
- Depends on: `@archon/providers`, `@archon/git`, `@archon/paths`, injected `WorkflowDeps`.
- Used by: CLI workflow command, orchestrator, API workflow endpoints.

**Provider Layer:**

- Purpose: Normalize AI assistant execution behind `IAgentProvider` while preserving provider-specific capabilities.
- Location: `packages/providers/src/`
- Contains: Claude provider, Codex provider, community Pi provider, capabilities, binary resolvers, provider registry.
- Depends on: `@archon/paths` and provider SDK packages.
- Used by: Workflow DAG nodes, title generation, orchestrator chat sessions.

**Isolation and Git Layer:**

- Purpose: Keep workflow mutation out of shared checkouts by creating, adopting, resolving, and cleaning git worktrees.
- Location: `packages/isolation/src/`, `packages/git/src/`
- Contains: `IsolationResolver`, `WorktreeProvider`, PR state, copy-file handling, branch/repo/worktree helpers, subprocess execution wrappers.
- Depends on: `@archon/paths`.
- Used by: CLI workflow command, orchestrator, cleanup service, isolation CLI.

**Persistence Layer:**

- Purpose: Persist codebases, conversations, sessions, messages, workflow runs, workflow events, env vars, and isolation environments.
- Location: `packages/core/src/db/`, `migrations/`
- Contains: Database auto-detection, SQLite/Postgres adapters, table-specific query modules, migrations.
- Depends on: `@archon/paths`, SQL adapter abstractions.
- Used by: Core orchestration, workflow store adapter, server routes, CLI commands.

**Configuration and Defaults Layer:**

- Purpose: Resolve global and repo config, Archon paths, bundled commands/workflows/skills, and generated default artifacts.
- Location: `packages/core/src/config/`, `packages/paths/src/`, `.archon/`, `.agents/skills/`, `.codex/skills/`
- Contains: Config merge/safe-output logic, path helpers, default workflow/command source files, skill bundles.
- Depends on: Bun YAML, `@archon/providers` for provider validation.
- Used by: CLI, server, workflows, web settings routes, skill installation.

**Frontend Layer:**

- Purpose: Provide the local web UI for chat, workflows, dashboard, builder, settings, and run inspection.
- Location: `packages/web/src/`
- Contains: Routes, components, hooks, Zustand workflow store, TanStack Query client, generated API types.
- Depends on: REST and SSE endpoints exposed by `@archon/server`.
- Used by: Browser users through `archon serve` or dev server.

## Data Flow

### CLI Workflow Run

1. `archon workflow run <name>` enters the CLI parser (`packages/cli/src/cli.ts:171`) and dispatches under the workflow command switch (`packages/cli/src/cli.ts:320`).
2. `workflowRunCommand` loads available workflows, resolves the name, and validates `--branch`, `--no-worktree`, `--resume`, `--from`, and workflow-level `worktree.enabled` policy (`packages/cli/src/commands/workflow.ts:349`, `packages/cli/src/commands/workflow.ts:411`).
3. The command creates or reuses a CLI conversation row, finds or auto-registers the codebase, then performs input preflight before worktree creation (`packages/cli/src/commands/workflow.ts:606`).
4. If isolation is active, the command resolves or creates a worktree environment before execution (`packages/cli/src/commands/workflow.ts:590`).
5. The CLI calls `executeWorkflow`, which creates or resumes a workflow run, enforces path locks, creates artifact directories, registers event streaming, and invokes the DAG executor (`packages/cli/src/commands/workflow.ts:824`, `packages/workflows/src/executor.ts:232`, `packages/workflows/src/executor.ts:447`, `packages/workflows/src/executor.ts:627`, `packages/workflows/src/executor.ts:739`).
6. The DAG executor executes topological layers, logs events, and persists completion/failure/pause state (`packages/workflows/src/dag-executor.ts:3177`, `packages/workflows/src/dag-executor.ts:3835`).

### Web Chat to Workflow

1. The React app routes `/chat`, `/dashboard`, `/workflows`, `/workflows/builder`, `/workflows/runs/:runId`, and `/settings` through `packages/web/src/App.tsx:63`.
2. Web API helpers call relative REST routes and direct backend SSE in dev mode (`packages/web/src/lib/api.ts:14`, `packages/web/src/lib/api.ts:64`).
3. The server starts the web adapter, message persistence, SSE transport, workflow bridge, and Hono routes (`packages/server/src/index.ts:142`, `packages/server/src/index.ts:220`, `packages/server/src/routes/api.ts:877`).
4. `/api/conversations/{id}/message` routes through `handleMessage`; SSE streams are registered at `packages/server/src/routes/api.ts:1490` and `packages/server/src/routes/api.ts:1526`.
5. `handleMessage` creates/loads conversation state, routes natural-language approvals, handles deterministic slash commands, discovers workflows, builds the prompt, and calls the selected AI provider or workflow dispatcher (`packages/core/src/orchestrator/orchestrator-agent.ts:593`, `packages/core/src/orchestrator/orchestrator-agent.ts:456`, `packages/core/src/orchestrator/orchestrator-agent.ts:527`).
6. Web background workflow dispatch creates a hidden worker conversation, resolves its own isolation environment, pre-creates a run row for UI navigation, and bridges worker events back to the parent conversation (`packages/core/src/orchestrator/orchestrator.ts:256`).

### Workflow Definition Loading

1. Discovery uses config-aware default loading (`packages/workflows/src/workflow-discovery.ts:357`).
2. The loader parses YAML with Bun, validates each DAG node with Zod, enforces unique IDs, validates `depends_on`, rejects cycles, and checks `$node.output` references (`packages/workflows/src/loader.ts:24`, `packages/workflows/src/loader.ts:38`, `packages/workflows/src/loader.ts:88`).
3. Workflow definitions are modeled as DAG workflows with `nodes`, optional provider/model settings, Codex reasoning settings, and a narrow `worktree.enabled` policy (`packages/workflows/src/schemas/workflow.ts:39`, `packages/workflows/src/schemas/workflow.ts:77`).

### State Management

- Database state uses `packages/core/src/db/connection.ts`, which selects PostgreSQL when `DATABASE_URL` exists and SQLite at Archon home otherwise (`packages/core/src/db/connection.ts:30`).
- Core tables are declared in `migrations/000_combined.sql`: codebases, conversations, sessions, isolation environments, workflow runs, workflow events, and messages.
- Workflow execution state is stored through `IWorkflowStore` and the core adapter in `packages/core/src/workflows/store-adapter.ts:30`.
- UI cache state uses TanStack Query through `packages/web/src/lib/query-client.ts` and workflow-specific Zustand state through `packages/web/src/stores/workflow-store.ts`.
- SSE and web message buffering use in-memory maps in `packages/server/src/adapters/web/transport.ts`, `packages/server/src/adapters/web/persistence.ts`, and `packages/server/src/adapters/web/workflow-bridge.ts`; durable messages still persist through `packages/core/src/db/messages.ts`.

## Key Abstractions

**Platform Adapter:**

- Purpose: Normalize chat, web, and forge platforms behind `sendMessage`, threading, streaming mode, platform type, and optional structured events.
- Examples: `packages/core/src/types/index.ts:92`, `packages/server/src/adapters/web.ts`, `packages/adapters/src/chat/telegram/adapter.ts`, `packages/adapters/src/forge/github/adapter.ts`
- Pattern: Interface-based adapter with optional web-only extension.

**Agent Provider:**

- Purpose: Normalize AI execution for Claude, Codex, and community providers.
- Examples: `packages/providers/src/types.ts`, `packages/providers/src/registry.ts`, `packages/providers/src/claude/provider.ts`, `packages/providers/src/codex/provider.ts`
- Pattern: Registry with metadata/capabilities and factory functions.

**Workflow Definition:**

- Purpose: Declarative DAG workflow config loaded from YAML and validated before execution.
- Examples: `packages/workflows/src/schemas/workflow.ts`, `.archon/workflows/defaults/`, `.archon/workflows/test-workflows/`
- Pattern: Zod schema plus source-aware discovery (`bundled`, `global`, `project`).

**Workflow Store:**

- Purpose: Decouple the workflow engine from concrete DB modules.
- Examples: `packages/workflows/src/store.ts`, `packages/core/src/workflows/store-adapter.ts`
- Pattern: Interface plus adapter construction in `createWorkflowDeps`.

**Isolation Provider and Resolver:**

- Purpose: Separate isolation policy resolution from the mechanism that creates/removes worktrees.
- Examples: `packages/isolation/src/resolver.ts`, `packages/isolation/src/providers/worktree.ts`, `packages/isolation/src/types.ts`
- Pattern: Resolver returns discriminated union results; caller handles user messaging and DB linking.

**Path Utilities:**

- Purpose: Centralize Archon home, workspace, worktree, config, env, command, workflow, script, artifact, and log path rules.
- Examples: `packages/paths/src/archon-paths.ts`, `packages/paths/src/env-loader.ts`, `packages/paths/src/strip-cwd-env-boot.ts`
- Pattern: Shared package imported by every runtime boundary.

**Skill Surface:**

- Purpose: Repo-local operational instructions for Archon development, user workflows, release validation, UI validation, sync, and GSD mapping/planning.
- Examples: `.agents/skills/archon-dev/SKILL.md`, `.agents/skills/archon/SKILL.md`, `.agents/skills/validate-ui/SKILL.md`, `.codex/skills/gsd-map-codebase/SKILL.md`
- Pattern: Skill-as-procedure files with references, cookbooks, and explicit routing.

## Entry Points

**CLI:**

- Location: `packages/cli/src/cli.ts`
- Triggers: `archon <command>` binary or `bun --cwd packages/cli src/cli.ts`.
- Responsibilities: Environment bootstrap, provider registration, git repo validation, dispatch to `chat`, `setup`, `workflow`, `isolation`, `validate`, `complete`, `serve`, `skill`, and `version`.

**Workflow CLI Command:**

- Location: `packages/cli/src/commands/workflow.ts`
- Triggers: `archon workflow list|run|status|resume|abandon|approve|reject|cleanup|event`.
- Responsibilities: Workflow discovery, CLI adapter creation, codebase lookup/registration, isolation, execution, status reporting, approval operations.

**Server:**

- Location: `packages/server/src/index.ts`
- Triggers: `bun --filter @archon/server dev`, `bun --filter @archon/server start`, or `archon serve`.
- Responsibilities: Start Hono, health/API/OpenAPI routes, Web UI serving, SSE, platform adapters, webhook endpoints, cleanup scheduler.

**Web UI:**

- Location: `packages/web/src/main.tsx`, `packages/web/src/App.tsx`
- Triggers: Vite dev server or served static web dist.
- Responsibilities: Browser routes, query cache, project context, chat/workflow/dashboard/settings experiences.

**Workflow Engine:**

- Location: `packages/workflows/src/executor.ts`, `packages/workflows/src/dag-executor.ts`
- Triggers: CLI, orchestrator, and API workflow run actions.
- Responsibilities: Run lifecycle, artifact/log path setup, event persistence, DAG node execution, provider invocation, pause/resume/cancel/completion.

**Auth Sidecar:**

- Location: `auth-service/server.js`
- Triggers: Node service from `auth-service/package.json`.
- Responsibilities: Cookie-based auth sidecar for Caddy `forward_auth`.

**Docs Site:**

- Location: `packages/docs-web/src/content.config.ts`, `packages/docs-web/src/content/docs/index.mdx`
- Triggers: Astro dev/build commands from `packages/docs-web/package.json`.
- Responsibilities: Documentation website.

## Architectural Constraints

- **Runtime:** Bun is the primary TypeScript runtime for packages under `packages/`; `auth-service/server.js` is a separate Node sidecar.
- **Threading:** Node/Bun event loop with async I/O. DAG nodes within one topological layer run concurrently via `Promise.allSettled` in `packages/workflows/src/dag-executor.ts:3246`.
- **Process boundaries:** CLI and server are separate processes sharing database state and Archon home paths. Do not assume process-local state is globally visible.
- **Global state:** Provider registry in `packages/providers/src/registry.ts:32`; database singleton in `packages/core/src/db/connection.ts:27`; orchestrator isolation resolver singleton in `packages/core/src/orchestrator/orchestrator.ts:67`; workflow event emitter singleton in `packages/workflows/src/event-emitter.ts`; logger caches across many modules.
- **Worktree mutation lock:** Workflows serialize by `working_path` unless `workflow.mutates_checkout === false` (`packages/workflows/src/executor.ts:473`).
- **Environment loading:** Entry points must strip user CWD `.env` first and load only Archon-owned env files (`packages/cli/src/cli.ts:12`, `packages/server/src/index.ts:10`, `packages/paths/src/env-loader.ts`).
- **Config precedence:** Defaults, global `~/.archon/config.yaml`, repo `.archon/config.yaml`, and environment variables merge in `packages/core/src/config/config-loader.ts:2`.
- **Workflow source precedence:** Workflow source types are `bundled`, `global`, and `project`; comments in `packages/workflows/src/schemas/workflow.ts:113` document project overriding lower-precedence sources.
- **Provider bootstrap:** `registerBuiltinProviders()` and `registerCommunityProviders()` are process-entrypoint responsibilities (`packages/providers/src/registry.ts:108`).
- **Circular imports:** Not detected in the inspected package boundaries. Keep `packages/providers/src/types.ts` free of SDK and `@archon/*` imports as documented at `packages/providers/src/types.ts:3`.
- **Fork-local protected paths:** When changing host skills, bundled skill install behavior, or sync behavior, follow `AGENTS.md` and read `docs/reference/mase-archon-fork-operating-model.md`.

## Anti-Patterns

### Bypassing Entry-Point Environment Bootstrap

**What happens:** Importing application modules before `@archon/paths/strip-cwd-env-boot` and `loadArchonEnv` lets user project `.env` values leak into Archon runtime.
**Why it's wrong:** CLI and server comments explicitly require stripping CWD env before any module reads `process.env` (`packages/cli/src/cli.ts:12`, `packages/server/src/index.ts:10`).
**Do this instead:** Add new runtime entry points with the same bootstrap order as `packages/cli/src/cli.ts` or `packages/server/src/index.ts`.

### Creating Provider-Specific Switches Outside the Registry

**What happens:** New provider behavior is hardcoded across callers instead of localizing registration.
**Why it's wrong:** Provider registration is centralized in `packages/providers/src/registry.ts:108`, and community providers are intended to be added by implementing a provider directory plus one registration call.
**Do this instead:** Add provider implementation under `packages/providers/src/community/<id>/` and register it through `registerCommunityProviders()` in `packages/providers/src/registry.ts`.

### Running Mutating Workflows Without Explicit Worktree Policy

**What happens:** A workflow mutates the live checkout accidentally because isolation flags or YAML policy are mismatched.
**Why it's wrong:** CLI enforces `worktree.enabled` and invocation flag conflicts in `packages/cli/src/commands/workflow.ts:411`; orchestrator short-circuits only when workflow YAML pins `worktree.enabled: false` (`packages/core/src/orchestrator/orchestrator-agent.ts:254`).
**Do this instead:** Use default worktree isolation for mutating work, or pin `worktree.enabled: false` only for workflows deliberately designed to run in the live checkout.

### Mutating Lifecycle State at Startup

**What happens:** Startup code marks running workflow rows failed or performs cross-process lifecycle cleanup.
**Why it's wrong:** Server startup intentionally does not fail orphaned runs because it can kill legitimate parallel CLI/server runs (`packages/server/src/index.ts:206`); CLI startup also avoids global orphan cleanup (`packages/cli/src/cli.ts:252`).
**Do this instead:** Route cleanup through explicit commands such as `archon workflow cleanup`, `archon workflow abandon`, and isolation cleanup operations.

### Writing Web API File Operations Without Registered-Root Validation

**What happens:** API endpoints accept arbitrary `cwd` or artifact paths.
**Why it's wrong:** `validateCwd` exists to ensure caller-supplied CWD values stay under registered codebase roots (`packages/server/src/routes/api.ts:894`), and artifact route code rejects path traversal (`packages/server/src/routes/api.ts:2454`).
**Do this instead:** Reuse `validateCwd`, command-name validation, and path-validation helpers before reading/writing files from API routes.

## Error Handling

**Strategy:** Fail fast for configuration, provider, DB, isolation, and workflow execution errors that make state unsafe; degrade only for non-critical notification, logging, status, and observability paths.

**Patterns:**

- Entry points print actionable CLI/server errors and return non-zero or exit for fatal setup failures (`packages/cli/src/cli.ts`, `packages/server/src/index.ts`).
- Workflow execution sends critical user-visible failure messages with retry before recording failed run state (`packages/workflows/src/executor.ts:113`).
- Workflow events are best-effort and non-throwing at the store boundary (`packages/core/src/workflows/store-adapter.ts:50`).
- Isolation resolver returns typed blocked/stale/none/resolved results for expected isolation failures and throws unexpected failures (`packages/isolation/src/resolver.ts:68`).
- Web API returns structured JSON errors through `apiError` and OpenAPI error schemas (`packages/server/src/routes/api.ts:882`).
- Config loading returns empty config for missing files but logs parse/permission errors (`packages/core/src/config/config-loader.ts:145`).

## Cross-Cutting Concerns

**Logging:** Use `createLogger` from `@archon/paths` with lazy module-local caches. Workflow execution also writes JSONL logs through `packages/workflows/src/logger.ts`.

**Validation:** Use Zod/OpenAPI schemas for API and workflow definitions, command-name validation for prompt files, path validation for filesystem operations, and explicit worktree policy checks.

**Authentication:** AI credentials are environment/config based. Server startup accepts Claude global auth, Claude explicit keys, or Codex tokens; platform adapters start only when their env variables are present (`packages/server/src/index.ts:155`).

**Security:** Protect against CWD `.env` leakage, path traversal, unsafe CWD access, provider defaults leakage to web clients, and untrusted upload types. Safe web config fields are allowlisted in `packages/core/src/config/config-loader.ts:84`.

**Observability:** Workflow events persist in `remote_agent_workflow_events`, emit through `packages/workflows/src/event-emitter.ts`, and bridge to Web SSE through `packages/server/src/adapters/web/workflow-bridge.ts`.

**Fork Governance:** `AGENTS.md` protects fork-local skills, Codex/PIV workflow files, bundled skill install behavior, and design/plan docs. Sync changes must preserve fork-local paths unless explicitly scoped.

---

_Architecture analysis: 2026-05-04_
