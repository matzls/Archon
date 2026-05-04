# Coding Conventions

**Analysis Date:** 2026-05-04

## Naming Patterns

**Files:**

- Use kebab-case for multi-word implementation and test files: `packages/core/src/utils/workflow-input-preflight.ts`, `packages/server/src/routes/schemas/workflow.schemas.ts`, `packages/web/src/lib/workflow-event-derivations.ts`.
- Keep tests colocated beside the source file with `.test.ts` suffix: `packages/core/src/handlers/command-handler.test.ts`, `packages/workflows/src/loader.test.ts`, `packages/web/src/lib/message-cache.test.ts`.
- Use `index.ts` as a package or folder export surface, not as the primary implementation file: `packages/core/src/index.ts`, `packages/providers/src/index.ts`, `packages/workflows/src/schemas/index.ts`.
- Use generated suffixes for generated source and declarations: `packages/workflows/src/defaults/bundled-defaults.generated.ts`, `packages/web/src/lib/api.generated.d.ts`. ESLint ignores `**/*.generated.ts` and `**/*.generated.d.ts` in `eslint.config.mjs`.

**Functions:**

- Use `camelCase` for functions and hooks; exported React components use `PascalCase`: `parseCommand` in `packages/core/src/handlers/command-handler.ts`, `buildThreadOptions` in `packages/providers/src/codex/provider.ts`, `WorkflowBuilderInner` in `packages/web/src/components/workflows/WorkflowBuilder.tsx`.
- Add explicit return types on all functions. ESLint enforces `@typescript-eslint/explicit-function-return-type` in `eslint.config.mjs`.
- Use `is*` names for boolean predicates and type guards: `isWorkflowRunNotFoundError` in `packages/server/src/routes/api.ts`, `isRegisteredProvider` in `packages/providers/src/registry.ts`, `isInputTarget` in `packages/web/src/hooks/useBuilderKeyboard.ts`.
- Use `make*` for test factories: `makeTestWorkflow`, `makeTestWorkflowList`, and `makeTestWorkflowWithSource` in `packages/workflows/src/test-utils.ts`.

**Variables:**

- Use `camelCase` for local variables and module-level state: `cachedLog` in `packages/core/src/orchestrator/orchestrator.ts`, `codexInstance` in `packages/providers/src/codex/provider.ts`, `validationIssues` in `packages/web/src/components/workflows/WorkflowBuilder.tsx`.
- Use `UPPER_CASE` for constants and configuration-like values: `NODE_LIBRARY_WIDTH_KEY` in `packages/web/src/components/workflows/WorkflowBuilder.tsx`, `MAX_SUBPROCESS_RETRIES` in `packages/providers/src/codex/provider.ts`, `TERMINAL_WORKFLOW_STATUSES` in `packages/workflows/src/schemas/workflow-run.ts`.
- Prefix intentionally unused parameters and variables with `_`: `_isRetry` in `packages/core/src/orchestrator/orchestrator.ts`. ESLint permits `_` through `argsIgnorePattern`, `varsIgnorePattern`, and `caughtErrorsIgnorePattern` in `eslint.config.mjs`.

**Types:**

- Use `PascalCase` for type aliases, interfaces, and classes: `WorkflowRoutingContext` in `packages/core/src/orchestrator/orchestrator.ts`, `WorkflowValidationResult` in `packages/workflows/src/validator.ts`, `CodexProvider` in `packages/providers/src/codex/provider.ts`.
- Prefix interface names with `I` only where the abstraction is intentionally interface-shaped and already follows that convention: `IAgentProvider` in `packages/providers/src/types.ts`, `IWorkflowStore` in `packages/workflows/src/store.ts`, `IWorkflowPlatform` in `packages/workflows/src/deps.ts`.
- Derive schema-backed types with `z.infer<typeof schema>` instead of maintaining parallel interfaces: `WorkflowRun` in `packages/workflows/src/schemas/workflow-run.ts`, `StepRetryConfig` in `packages/workflows/src/schemas/retry.ts`, `ErrorResponse` in `packages/server/src/routes/schemas/common.schemas.ts`.

## Code Style

**Formatting:**

- Use Prettier from `.prettierrc`.
- Settings: `semi: true`, `singleQuote: true`, `trailingComma: "es5"`, `tabWidth: 2`, `printWidth: 100`, `arrowParens: "avoid"`, `endOfLine: "auto"`.
- Run formatting through root scripts in `package.json`: `bun run format` to write and `bun run format:check` to verify.

**Linting:**

- Use ESLint flat config in `eslint.config.mjs` with `@eslint/js`, `typescript-eslint` recommended/strict/stylistic type-checked configs, and `eslint-config-prettier`.
- CI expects zero warnings: `bun run validate` runs `bun run lint --max-warnings 0` from `package.json`.
- Lint applies to `packages/*/src/**/*.{ts,tsx}`, `.archon/scripts/**/*.{ts,tsx}`, and `scripts/**/*.ts`; tests, generated files, `.agents/skills/**`, `.claude/skills/**`, `.archon/**`, shadcn UI components, and `packages/docs-web/**` are intentionally ignored in `eslint.config.mjs`.
- Do not use `any`; `@typescript-eslint/no-explicit-any` is an error in `eslint.config.mjs`.
- Do not use non-null assertions; `@typescript-eslint/no-non-null-assertion` is an error in `eslint.config.mjs`.
- Avoid file-level ESLint disables. The accepted local pattern is a narrow inline disable with a reason, as in `packages/web/src/components/workflows/WorkflowBuilder.tsx` for a ReactFlow generic inference edge case.

## Import Organization

**Order:**

1. Runtime imports from Node, Bun, React, Hono, SDKs, and workspace packages: `fs/promises`, `path`, `@hono/zod-openapi`, `@openai/codex-sdk`, `@archon/*`.
2. Type-only imports using `import type` where the import is type-only: `type WorkflowDefinition` in `packages/server/src/routes/api.ts`, `type Edge` in `packages/web/src/components/workflows/WorkflowBuilder.tsx`.
3. Relative domain imports from the same package: `../db/conversations`, `./schemas/workflow`, `./WorkflowCanvas`.
4. Test-only imports from `bun:test`, local test factories, mocks, and the module under test: `packages/core/src/handlers/command-handler.test.ts`, `packages/workflows/src/loader.test.ts`.

**Path Aliases:**

- Use workspace package aliases for cross-package dependencies: `@archon/core`, `@archon/workflows`, `@archon/paths`, `@archon/git`, `@archon/providers`. Package alias wiring lives in package `tsconfig.json` files such as `packages/server/tsconfig.json`, `packages/cli/tsconfig.json`, and `packages/adapters/tsconfig.json`.
- Use `@/*` only inside `@archon/web` for web-local source imports: `packages/web/src/components/workflows/WorkflowBuilder.tsx`; the alias is defined in `packages/web/tsconfig.json`.
- Use direct subpath exports when a package exposes them intentionally: `@archon/workflows/schemas/workflow`, `@archon/workflows/workflow-discovery`, `@archon/core/db/conversations`.
- Keep public package exports curated through `index.ts` barrel files: `packages/providers/src/index.ts`, `packages/core/src/index.ts`, `packages/git/src/index.ts`.

## Error Handling

**Patterns:**

- Fail fast for unsupported or unsafe states with explicit `throw new Error(...)`: `packages/core/src/orchestrator/orchestrator.ts`, `packages/providers/src/codex/provider.ts`, `packages/workflows/src/loader.ts`.
- Convert `unknown` caught errors with `toError` when logging or surfacing operational failures: `packages/core/src/orchestrator/orchestrator.ts`, `packages/core/src/orchestrator/orchestrator-agent.ts`, `packages/adapters/src/community/forge/gitea/adapter.ts`.
- Classify expected errors into user-facing status or messages before returning HTTP responses: `classifyWorkflowActionError` in `packages/server/src/routes/api.ts`.
- Return structured failure results where the caller expects deterministic command/API output: `CommandResult` returns in `packages/core/src/handlers/command-handler.ts`, parse failure objects in `packages/workflows/src/loader.ts`.
- Treat benign cleanup errors narrowly and document why they are ignored: temp directory cleanup in `packages/workflows/src/loader.test.ts`, unavailable localStorage fallback in `packages/web/src/components/workflows/WorkflowBuilder.tsx`.
- Do not swallow unexpected I/O, permission, or data-integrity errors. `commandFileExists` in `packages/core/src/orchestrator/orchestrator.ts` ignores only `ENOENT` and rethrows other access failures.

## Logging

**Framework:** `pino` via `createLogger` from `@archon/paths`.

**Patterns:**

- Use lazy module-level logger initialization so tests can mock `createLogger` before first use:

```typescript
let cachedLog: ReturnType<typeof createLogger> | undefined;
function getLog(): ReturnType<typeof createLogger> {
  if (!cachedLog) cachedLog = createLogger('module-name');
  return cachedLog;
}
```

- Existing examples: `packages/core/src/handlers/command-handler.ts`, `packages/core/src/orchestrator/orchestrator.ts`, `packages/workflows/src/loader.ts`, `packages/providers/src/codex/provider.ts`.
- Use structured log objects with stable event names: `getLog().error({ err, conversationId }, 'isolation_link_failed')` in `packages/core/src/orchestrator/orchestrator.ts`.
- Use `console.*` mainly in CLI commands and browser-only code where that is the local interface: `packages/cli/src/commands/skill.ts`, `packages/web/src/hooks/useSSE.ts`, `packages/web/src/lib/dag-layout.ts`.

## Comments

**When to Comment:**

- Add comments for intentional testability seams, non-obvious platform behavior, or defensive fallback rationale: lazy logger comments in `packages/core/src/orchestrator/orchestrator.ts`, Bun `mock.module` pollution notes in `packages/core/src/handlers/command-handler.test.ts`, storage fallback in `packages/web/src/components/workflows/WorkflowBuilder.tsx`.
- Keep comments operational and specific; avoid restating syntax.
- Use comments to mark generated or intentionally external surfaces: generated defaults in `packages/workflows/src/defaults/bundled-defaults.generated.ts`, OpenAPI route config section markers in `packages/server/src/routes/api.ts`.

**JSDoc/TSDoc:**

- Use short JSDoc above exported helpers, interfaces, and complex internal helpers: `parseWorkflow` in `packages/workflows/src/loader.ts`, `WorkflowRoutingContext` in `packages/core/src/orchestrator/orchestrator.ts`, `makeTestWorkflowWithSource` in `packages/workflows/src/test-utils.ts`.
- Include behavior guarantees in JSDoc when callers rely on them, such as “Never throws” in `getCurrentBranch` and `formatRepoContext` in `packages/core/src/handlers/command-handler.ts`.

## Function Design

**Size:** Prefer small pure helpers for validation, formatting, classification, and option building. Examples: `classifyWorkflowActionError` in `packages/server/src/routes/api.ts`, `formatNodeIssue` in `packages/workflows/src/loader.ts`, `buildThreadOptions` in `packages/providers/src/codex/provider.ts`.

**Parameters:** Use typed object parameters when a function crosses module boundaries or would otherwise need many positional values: `validateAndResolveIsolation` still carries multiple contextual parameters in `packages/core/src/orchestrator/orchestrator.ts`, but related workflow routing data is grouped in `WorkflowRoutingContext` in the same file.

**Return Values:** Prefer explicit domain unions or result objects over implicit exceptions for parse/validation surfaces. Examples: `ParseResult` in `packages/workflows/src/loader.ts`, `IsolationResolution` in `packages/core/src/orchestrator/orchestrator.ts`, `WorkflowValidationResult` in `packages/workflows/src/validator.ts`.

## Module Design

**Exports:** Export package public API through `index.ts` files and keep implementation details local unless tests or package boundaries need them. Examples: `packages/core/src/index.ts`, `packages/providers/src/index.ts`, `packages/isolation/src/index.ts`.

**Barrel Files:** Barrel files are used for package-level and schema-level surfaces. Use them for curated exports (`packages/workflows/src/schemas/index.ts`) and avoid making feature folders depend on wide barrels when direct subpath exports are clearer (`@archon/workflows/schemas/workflow` in `packages/server/src/routes/schemas/workflow.schemas.ts`).

---

_Convention analysis: 2026-05-04_
