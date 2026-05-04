# Technology Stack

**Analysis Date:** 2026-05-04

## Languages

**Primary:**

- TypeScript ES2022 - Monorepo application code in `packages/*/src`, with Bun executing TypeScript directly from files such as `packages/server/src/index.ts` and `packages/cli/src/cli.ts`.
- TSX/React - Web UI in `packages/web/src`, entry points `packages/web/src/main.tsx` and `packages/web/src/App.tsx`.

**Secondary:**

- JavaScript/CommonJS - Cookie auth sidecar in `auth-service/server.js`.
- Shell - Release/build/container scripts referenced from `package.json`, including `scripts/build-binaries.sh` and `scripts/checksums.sh`.
- SQL - PostgreSQL migration chain in `migrations/`, with combined schema in `migrations/000_combined.sql`.
- Python - Repo-local workflow helper script `/.archon/scripts/echo-py.py` for Archon workflow testing.

## Runtime

**Environment:**

- Bun `^1.3.0` - Declared in root `package.json`; CI, Docker, and releases pin Bun `1.3.11` in `.github/workflows/test.yml`, `.github/workflows/release.yml`, and `Dockerfile`.
- Node.js 22 - Used by the standalone auth sidecar in `auth-service/Dockerfile` and docs deployment setup in `.github/workflows/deploy-docs.yml`.

**Package Manager:**

- Bun - Workspace package manager for root and `packages/*`, lockfile present at `bun.lock`.
- npm - Auth sidecar install path only, used inside `auth-service/Dockerfile` for `auth-service/package.json`.
- Lockfile: present for Bun at `bun.lock`; separate sidecar lockfile present at `auth-service/bun.lock`.

## Frameworks

**Core:**

- Hono `^4.11.4` - HTTP server and API routing in `packages/server/src/index.ts` and `packages/server/src/routes/api.ts`.
- `@hono/zod-openapi` `^0.19.6` - OpenAPI route definitions and request/response schemas in `packages/server/src/routes/api.ts` and `packages/server/src/routes/schemas/*.ts`.
- React `^19.0.0` - Web UI in `packages/web/src`.
- Vite `^6.0.0` - Web UI build/dev server configured in `packages/web/vite.config.ts`.
- Astro `^6.1.0` + Starlight `^0.38.0` - Documentation site in `packages/docs-web/astro.config.mjs` and `packages/docs-web/src`.
- Bun SQLite (`bun:sqlite`) - Default local database adapter in `packages/core/src/db/adapters/sqlite.ts`.
- PostgreSQL via `pg` `^8.11.0` - Optional/shared database adapter in `packages/core/src/db/adapters/postgres.ts`.

**Testing:**

- Bun test - All packages expose `test` scripts in `packages/*/package.json`; root `bun run test` runs `bun --filter '*' --parallel test`.
- Package-level isolated test batches - Required by `CLAUDE.md` to avoid Bun `mock.module()` pollution; encoded in package scripts such as `packages/core/package.json`, `packages/workflows/package.json`, and `packages/adapters/package.json`.

**Build/Dev:**

- TypeScript `^5.3.0` - Strict root config in `tsconfig.json`, package configs in `packages/*/tsconfig.json`.
- ESLint `^9.39.1` + `typescript-eslint` `^8.48.0` - Zero-warning linting configured in `eslint.config.mjs`.
- Prettier `^3.7.4` - Formatting via root `format` and `format:check` scripts in `package.json`.
- Docker Buildx - CI Docker image build in `.github/workflows/test.yml` and multi-arch publish in `.github/workflows/publish.yml`.
- Bun compile - Release binaries built by `scripts/build-binaries.sh` through `.github/workflows/release.yml`.

## Key Dependencies

**Critical:**

- `@anthropic-ai/claude-agent-sdk` `^0.2.121` - Built-in Claude provider implementation in `packages/providers/src/claude/provider.ts`.
- `@openai/codex-sdk` `^0.128.0` - Built-in Codex provider implementation in `packages/providers/src/codex/provider.ts`.
- `@mariozechner/pi-ai` / `@mariozechner/pi-coding-agent` `^0.67.5` - Community PI provider under `packages/providers/src/community/pi`.
- `@slack/bolt` `^4.6.0` - Slack Socket Mode adapter in `packages/adapters/src/chat/slack/adapter.ts`.
- `grammy` `^1.36.0` - Telegram polling adapter in `packages/adapters/src/chat/telegram/adapter.ts`.
- `discord.js` `^14.16.0` - Discord adapter in `packages/adapters/src/community/chat/discord/adapter.ts`.
- `@octokit/rest` `^22.0.0` - GitHub issue/PR comment adapter in `packages/adapters/src/forge/github/adapter.ts`.
- `zod` `^3.25.28` - Runtime validation in `packages/server/src/routes/schemas/*` and `packages/workflows/src/schemas/*`.

**Infrastructure:**

- `dotenv` `^17.2.3` / `^17` - Archon-owned env loading in `packages/server/src/index.ts`, `packages/cli/src/cli.ts`, and `packages/paths/src/env-loader.ts`.
- `pino` `^9` + `pino-pretty` `^13` - Structured logging in `packages/paths/src/logger.ts`.
- `@tanstack/react-query` `^5.0.0` - Web UI server-state client in `packages/web/src`.
- `@xyflow/react` `^12.10.1` + `@dagrejs/dagre` `^2.0.4` - Workflow DAG visualization in `packages/web/src/components/workflows`.
- Radix UI packages, `lucide-react`, `tailwindcss` `^4.0.0`, and `@tailwindcss/vite` - Web UI component and styling stack in `packages/web/package.json`.
- `bcryptjs` `^2.4.3` - Password verification in `auth-service/server.js`.

## Configuration

**Environment:**

- Repo-local secret examples exist at `.env.example` and `deploy/.env.example`; do not read or commit real values from `.env` files.
- Archon-owned env is loaded from `~/.archon/.env` and `<cwd>/.archon/.env` by `packages/paths/src/env-loader.ts`; plain target-repo `<cwd>/.env` is stripped at boot by `packages/paths/src/strip-cwd-env.ts`.
- Runtime env names used by the app include `DATABASE_URL`, `PORT`, `HOST`, `WEB_UI_DEV`, `WEB_UI_ORIGIN`, `LOG_LEVEL`, `ARCHON_HOME`, `ARCHON_DOCKER`, `MAX_CONCURRENT_CONVERSATIONS`, `DEFAULT_AI_ASSISTANT`, and provider/platform credentials listed in `INTEGRATIONS.md`.
- Non-secret YAML config is loaded from `~/.archon/config.yaml` and `.archon/config.yaml` by `packages/core/src/config/config-loader.ts`.

**Build:**

- Root workspace manifest: `package.json`.
- Package manifests: `packages/core/package.json`, `packages/server/package.json`, `packages/web/package.json`, `packages/providers/package.json`, `packages/adapters/package.json`, `packages/workflows/package.json`, `packages/cli/package.json`, `packages/git/package.json`, `packages/isolation/package.json`, `packages/paths/package.json`, `packages/docs-web/package.json`.
- TypeScript config: `tsconfig.json` plus `packages/*/tsconfig.json`.
- Web config: `packages/web/vite.config.ts`, `packages/web/components.json`, `packages/web/src/index.css`.
- Docs config: `packages/docs-web/astro.config.mjs`, `packages/docs-web/src/content.config.ts`.
- Lint config: `eslint.config.mjs`.
- Container config: `Dockerfile`, `docker-compose.yml`, `deploy/docker-compose.yml`, `auth-service/Dockerfile`.

## Platform Requirements

**Development:**

- Bun `1.3.x` with frozen lockfile support; use `bun install --frozen-lockfile`.
- Git and GitHub CLI are first-class runtime tools; GitHub CLI auth is checked from `packages/server/src/index.ts`.
- Optional Docker profile `with-db` provides PostgreSQL; without `DATABASE_URL`, SQLite at `~/.archon/archon.db` is the default.
- Validation command is `bun run validate`, which runs bundled-default checks, type-check, lint, format check, and tests.

**Production:**

- Docker image based on `oven/bun:1.3.11-slim` with Git, GitHub CLI, PostgreSQL client, Chromium, and `agent-browser` installed by `Dockerfile`.
- Multi-arch images publish to GitHub Container Registry through `.github/workflows/publish.yml`.
- CLI binaries build for Linux, macOS, and Windows targets through `.github/workflows/release.yml`.
- Static docs deploy to GitHub Pages from `packages/docs-web/dist` through `.github/workflows/deploy-docs.yml`.

---

_Stack analysis: 2026-05-04_
