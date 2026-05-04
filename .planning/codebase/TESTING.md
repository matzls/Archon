# Testing Patterns

**Analysis Date:** 2026-05-04

## Test Framework

**Runner:**

- Bun test via `bun:test`.
- Root config: `package.json`.
- Package scripts: `packages/core/package.json`, `packages/workflows/package.json`, `packages/adapters/package.json`, `packages/isolation/package.json`, `packages/providers/package.json`, `packages/server/package.json`, `packages/web/package.json`, `packages/git/package.json`, `packages/cli/package.json`, `packages/paths/package.json`.

**Assertion Library:**

- Bun’s built-in `expect` from `bun:test`.
- Mocking uses Bun’s `mock`, `mock.module`, and `spyOn` from `bun:test`.

**Run Commands:**

```bash
bun run test
bun test --watch
bun run validate
```

- Use `bun run test` for the full repo because it executes package scripts through `bun --filter '*' --parallel test` in `package.json`.
- Do not run root `bun test` across the whole repo; `CLAUDE.md` documents process-wide `mock.module()` cache pollution that causes cross-file failures.
- Use package scripts or single-file commands for focused validation: `bun test packages/core/src/handlers/command-handler.test.ts`, `bun --filter @archon/web test`, `bun --filter @archon/workflows test`.

## Test File Organization

**Location:**

- Tests are colocated with implementation files under each package’s `src/` directory.
- Examples: `packages/core/src/handlers/command-handler.test.ts`, `packages/workflows/src/loader.test.ts`, `packages/server/src/routes/api.codebases.test.ts`, `packages/web/src/lib/workflow-metadata.test.ts`, `packages/providers/src/codex/provider.test.ts`.

**Naming:**

- Use `<module>.test.ts` for TypeScript tests: `packages/git/src/git.test.ts`, `packages/paths/src/logger.test.ts`.
- Web tests for pure logic and hooks are also `.test.ts`: `packages/web/src/hooks/useBuilderKeyboard.test.ts`, `packages/web/src/stores/workflow-store.test.ts`.
- No `.spec.ts` files are detected in the repo.

**Structure:**

```text
packages/<package>/src/
├── feature-or-module.ts
├── feature-or-module.test.ts
└── test/
    └── mocks/
```

- Test helpers live under `src/test/` when shared inside a package: `packages/providers/src/test/mocks/logger.ts`.
- Cross-package workflow test factories live in `packages/workflows/src/test-utils.ts` and are exported as `@archon/workflows/test-utils`.

## Test Structure

**Suite Organization:**

```typescript
import { describe, test, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';

describe('module behavior', () => {
  beforeEach(() => {
    // reset mocks or module-visible state
  });

  test('does the expected behavior', async () => {
    await expect(operation()).resolves.toBeUndefined();
  });
});
```

**Patterns:**

- Group behavior with nested `describe` blocks where a module has several surfaces: `packages/web/src/lib/workflow-metadata.test.ts`, `packages/adapters/src/community/forge/gitea/adapter.test.ts`.
- Use `beforeEach` to reset mock calls, temp directories, environment variables, and module-visible state: `packages/core/src/handlers/command-handler.test.ts`, `packages/workflows/src/loader.test.ts`, `packages/web/src/lib/message-cache.test.ts`.
- Use `afterEach` or `afterAll` to restore filesystem and process state: `packages/workflows/src/loader.test.ts`, `packages/core/src/handlers/command-handler.test.ts`.
- For async expectations, use `await expect(...).resolves` and `await expect(...).rejects`: `packages/adapters/src/community/forge/gitea/adapter.test.ts`, `packages/workflows/src/loader.test.ts`.

## Mocking

**Framework:** Bun `mock`, `mock.module`, and `spyOn` from `bun:test`.

**Patterns:**

```typescript
const mockLogger = createMockLogger();
mock.module('@archon/paths', () => ({
  createLogger: mock(() => mockLogger),
}));

let spyExecFileAsync: ReturnType<typeof spyOn>;
beforeEach(() => {
  spyExecFileAsync = spyOn(gitUtils, 'execFileAsync');
});
```

- Mock package boundaries and database modules when they do not have standalone tests in the same process: `packages/core/src/handlers/command-handler.test.ts`.
- Prefer `spyOn` for internal modules that have their own tests, because Bun’s `mock.module()` persists globally in the process cache: `packages/core/src/handlers/command-handler.test.ts`.
- Mock `@archon/paths` logger creation in tests to suppress output and make logging assertions possible: `packages/core/src/orchestrator/orchestrator.test.ts`, `packages/isolation/src/pr-state.test.ts`, `packages/providers/src/community/pi/provider.test.ts`.
- Import the module under test after `mock.module(...)` setup so lazy imports observe the mocks: `packages/core/src/handlers/command-handler.test.ts`, `packages/workflows/src/loader.test.ts`.

**What to Mock:**

- External platform SDKs, network calls, database modules, filesystem wrappers, git command wrappers, provider SDKs, and logger creation.
- Example mock-heavy adapters: `packages/adapters/src/community/forge/gitea/adapter.test.ts`, `packages/server/src/routes/api.codebases.test.ts`.
- Use wrapper functions to avoid globally mocking core Node modules when practical. `readCommandFile` and `commandFileExists` in `packages/core/src/orchestrator/orchestrator.ts` exist so tests can avoid broad `fs/promises` cache pollution.

**What NOT to Mock:**

- Do not mock internal modules with independent test files when a `spyOn` is enough: documented in `packages/core/src/handlers/command-handler.test.ts`.
- Do not rely on `mock.restore()` to reverse `mock.module()` pollution across files; root `CLAUDE.md` documents that Bun keeps module replacements in the process-wide cache.
- Do not hide schema/parser behavior behind hand-built fixtures where a test factory exists. Use `makeTestWorkflow` and `makeTestWorkflowWithSource` from `packages/workflows/src/test-utils.ts`.

## Fixtures and Factories

**Test Data:**

```typescript
export function makeTestWorkflow(overrides: TestWorkflowOverrides): WorkflowDefinition {
  return workflowDefinitionSchema.parse({
    description: `${overrides.name} test workflow`,
    nodes: [DEFAULT_NODE],
    ...overrides,
  });
}
```

- Use schema-backed factories in `packages/workflows/src/test-utils.ts` for workflow definitions.
- Use local minimal builders for UI/domain data when no shared factory exists: `makeMsg` in `packages/web/src/lib/message-cache.test.ts`.
- Inline YAML strings are used for workflow loader behavior because the YAML text is the input under test: `packages/workflows/src/loader.test.ts`.
- Mock logger factories are either shared (`packages/providers/src/test/mocks/logger.ts`, `packages/core/src/test/mocks/logger.ts`) or defined inline for package-local tests (`packages/workflows/src/loader.test.ts`).

**Location:**

- Shared test factories: `packages/workflows/src/test-utils.ts`.
- Package-local mocks: `packages/providers/src/test/mocks/logger.ts`, `packages/core/src/test/mocks/logger.ts`.
- Inline fixtures are acceptable inside colocated tests when they are short and domain-specific: `packages/web/src/lib/workflow-metadata.test.ts`, `packages/workflows/src/loader.test.ts`.

## Coverage

**Requirements:** No explicit numeric coverage threshold is configured in `package.json` or package scripts.

**View Coverage:**

```bash
bun test --coverage packages/core/src/handlers/command-handler.test.ts
```

- Coverage is not part of `bun run validate`; validation is based on bundled-default drift checks, TypeScript, ESLint, Prettier, and package test scripts in `package.json`.

## Test Types

**Unit Tests:**

- Primary test type. Covers parsers, reducers, config parsing, route handlers, stores, provider event mapping, git helpers, isolation resolver behavior, and workflow execution logic.
- Examples: `packages/web/src/lib/chat-message-reducer.test.ts`, `packages/providers/src/community/pi/options-translator.test.ts`, `packages/workflows/src/condition-evaluator.test.ts`, `packages/core/src/utils/error-formatter.test.ts`.

**Integration Tests:**

- Local integration tests exercise filesystem, temporary directories, route modules, database adapters, and command wrappers without requiring real external services.
- Examples: workflow discovery with temp directories in `packages/workflows/src/loader.test.ts`, database adapter tests in `packages/core/src/db/adapters/sqlite.test.ts` and `packages/core/src/db/adapters/postgres.test.ts`, Git command behavior in `packages/git/src/git.test.ts`.

**E2E Tests:**

- A Codex live workflow smoke script exists as `bun run test:e2e:codex-live` in root `package.json`, implemented by `scripts/e2e/codex-live-workflow-smoke.ts`.
- UI/browser validation is skill/tool driven rather than part of the normal package test scripts: `.agents/skills/agent-browser/SKILL.md`, `.agents/skills/validate-ui/SKILL.md`, `.agents/skills/replicate-issue/SKILL.md`.

## Common Patterns

**Async Testing:**

```typescript
test('starts without errors', async () => {
  await expect(adapter.start()).resolves.toBeUndefined();
});
```

- Use `async` tests for filesystem, route, database, provider, workflow, and adapter behavior.
- Use unique temp directories with `tmpdir()`, `Date.now()`, and random suffixes for filesystem tests: `packages/workflows/src/loader.test.ts`.
- Preserve and restore environment variables around tests that mutate process env: `ARCHON_HOME` handling in `packages/workflows/src/loader.test.ts`.

**Error Testing:**

```typescript
await expect(adapter.sendMessage('owner/repo#123', message)).rejects.toThrow(
  'Failed to post comment'
);
```

- Assert expected error messages or status classifications directly: `packages/adapters/src/community/forge/gitea/adapter.test.ts`, `packages/server/src/routes/api.codebases.test.ts`, `packages/git/src/git.test.ts`.
- Use explicit mock rejection values to cover retry and failure paths: `packages/adapters/src/community/forge/gitea/adapter.test.ts`, `packages/providers/src/codex/provider.test.ts`.
- Validate parser and schema errors with invalid input cases rather than snapshot-only tests: `packages/workflows/src/loader.test.ts`, `packages/workflows/src/schemas.test.ts`, `packages/web/src/lib/workflow-metadata.test.ts`.

---

_Testing analysis: 2026-05-04_
