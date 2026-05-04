# External Integrations

**Analysis Date:** 2026-05-04

## APIs & External Services

**AI Providers:**

- Anthropic Claude - Built-in agent provider for message handling and workflow nodes.
  - SDK/Client: `@anthropic-ai/claude-agent-sdk`
  - Implementation: `packages/providers/src/claude/provider.ts`, `packages/providers/src/claude/binary-resolver.ts`
  - Auth: `CLAUDE_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN`, or `CLAUDE_USE_GLOBAL_AUTH`
- OpenAI Codex - Built-in agent provider for Codex workflow execution.
  - SDK/Client: `@openai/codex-sdk`
  - Implementation: `packages/providers/src/codex/provider.ts`, `packages/providers/src/codex/binary-resolver.ts`
  - Auth: `CODEX_ID_TOKEN`, `CODEX_ACCESS_TOKEN`, `CODEX_REFRESH_TOKEN`, `CODEX_ACCOUNT_ID`, optional `CODEX_BIN_PATH`
- PI community provider - Community provider using Mario Zechner's PI coding agent.
  - SDK/Client: `@mariozechner/pi-ai`, `@mariozechner/pi-coding-agent`
  - Implementation: `packages/providers/src/community/pi/provider.ts`
  - Auth: provider/model-dependent env, with `GEMINI_API_KEY` and `ANTHROPIC_API_KEY` referenced by tests and provider examples.

**Chat Platforms:**

- Slack - Socket Mode bot adapter for threaded remote coding conversations.
  - SDK/Client: `@slack/bolt`
  - Implementation: `packages/adapters/src/chat/slack/adapter.ts`
  - Auth: `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`; optional access control via `SLACK_ALLOWED_USER_IDS`; streaming via `SLACK_STREAMING_MODE`
- Telegram - Long-polling bot adapter.
  - SDK/Client: `grammy`
  - Implementation: `packages/adapters/src/chat/telegram/adapter.ts`
  - Auth: `TELEGRAM_BOT_TOKEN`; optional access control via `TELEGRAM_ALLOWED_USER_IDS` or `TELEGRAM_ALLOWED_USERS`; streaming via `TELEGRAM_STREAMING_MODE`
- Discord - Bot adapter with thread handling.
  - SDK/Client: `discord.js`
  - Implementation: `packages/adapters/src/community/chat/discord/adapter.ts`
  - Auth: `DISCORD_BOT_TOKEN`; optional access control via `DISCORD_ALLOWED_USER_IDS`; streaming via `DISCORD_STREAMING_MODE`

**Forge Platforms:**

- GitHub - Issue/PR comment adapter plus webhook endpoint.
  - SDK/Client: `@octokit/rest`; GitHub CLI via `packages/git/src/github-cli-auth.ts`
  - Implementation: `packages/adapters/src/forge/github/adapter.ts`
  - Auth: `GITHUB_TOKEN`, `WEBHOOK_SECRET`; optional `GITHUB_ALLOWED_USERS`, `GITHUB_BOT_MENTION`, `GH_TOKEN`
- Gitea - Community forge webhook/comment adapter.
  - SDK/Client: Fetch/API calls inside `packages/adapters/src/community/forge/gitea/adapter.ts`
  - Implementation: `packages/adapters/src/community/forge/gitea/adapter.ts`
  - Auth: `GITEA_URL`, `GITEA_TOKEN`, `GITEA_WEBHOOK_SECRET`; optional `GITEA_ALLOWED_USERS`, `GITEA_BOT_MENTION`
- GitLab - Community forge webhook/comment adapter.
  - SDK/Client: Fetch/API calls inside `packages/adapters/src/community/forge/gitlab/adapter.ts`
  - Implementation: `packages/adapters/src/community/forge/gitlab/adapter.ts`
  - Auth: `GITLAB_TOKEN`, `GITLAB_WEBHOOK_SECRET`; optional `GITLAB_URL`, `GITLAB_ALLOWED_USERS`, `GITLAB_BOT_MENTION`

**Browser Automation:**

- agent-browser - Optional browser automation tool for UI/E2E validation workflows.
  - SDK/Client: `agent-browser` CLI
  - Implementation/config: `.agents/skills/agent-browser/SKILL.md`, `.agents/skills/validate-ui/SKILL.md`, `Dockerfile`
  - Auth: Not applicable

**Release/Hosting Services:**

- GitHub Releases - CLI binary and web UI tarball distribution.
  - SDK/Client: GitHub Actions, GitHub API via release workflow
  - Implementation: `.github/workflows/release.yml`, `packages/cli/src/commands/serve.ts`
  - Auth: GitHub Actions `GITHUB_TOKEN`
- GitHub Container Registry - Docker image publishing.
  - SDK/Client: Docker Buildx and GitHub Actions
  - Implementation: `.github/workflows/publish.yml`
  - Auth: GitHub Actions `GITHUB_TOKEN`
- GitHub Pages - Documentation hosting for Astro/Starlight docs.
  - SDK/Client: GitHub Actions Pages deployment
  - Implementation: `.github/workflows/deploy-docs.yml`, `packages/docs-web/astro.config.mjs`
  - Auth: GitHub Actions Pages permissions

## Data Storage

**Databases:**

- SQLite (default local store)
  - Connection: no `DATABASE_URL`; path resolves to `~/.archon/archon.db` or `/.archon/archon.db` in Docker via `packages/core/src/db/connection.ts` and `packages/paths/src/archon-paths.ts`
  - Client: `bun:sqlite` adapter in `packages/core/src/db/adapters/sqlite.ts`
- PostgreSQL (optional/shared deployment store)
  - Connection: `DATABASE_URL`
  - Client: `pg` pool adapter in `packages/core/src/db/adapters/postgres.ts`
  - Migrations: `migrations/000_combined.sql` plus numbered migration files in `migrations/`

**File Storage:**

- Local filesystem only.
  - User/app home: `~/.archon` or `/.archon` from `packages/paths/src/archon-paths.ts`
  - Workspaces/worktrees: `~/.archon/workspaces`, `~/.archon/worktrees`
  - Workflow artifacts/logs: run artifacts under Archon home paths resolved by `packages/paths/src/archon-paths.ts`
  - Web UI binary cache: path resolved by `getWebDistDir()` and used in `packages/cli/src/commands/serve.ts`

**Caching:**

- No external cache detected.
- In-process singletons/caches include database connection state in `packages/core/src/db/connection.ts`, global config cache in `packages/core/src/config/config-loader.ts`, and query/server caches in the React web app through `packages/web/src/lib/query-client.ts`.

## Authentication & Identity

**Auth Provider:**

- Custom platform-token and webhook-secret model.
  - GitHub webhook signatures are verified by `packages/adapters/src/forge/github/adapter.ts` and registered at `/webhooks/github` in `packages/server/src/index.ts`.
  - Gitea webhook signatures are checked by `packages/adapters/src/community/forge/gitea/adapter.ts` and registered at `/webhooks/gitea` in `packages/server/src/index.ts`.
  - GitLab webhook tokens are timing-safe compared in `packages/adapters/src/community/forge/gitlab/auth.ts` and registered at `/webhooks/gitlab` in `packages/server/src/index.ts`.
- Optional whitelist authorization.
  - Slack: `packages/adapters/src/chat/slack/auth.ts`
  - Telegram: `packages/adapters/src/chat/telegram/auth.ts`
  - Discord: `packages/adapters/src/community/chat/discord/auth.ts`
  - GitHub: `packages/adapters/src/forge/github/auth.ts`
  - Gitea: `packages/adapters/src/community/forge/gitea/auth.ts`
  - GitLab: `packages/adapters/src/community/forge/gitlab/auth.ts`
- Optional Caddy `forward_auth` sidecar.
  - Implementation: `auth-service/server.js`
  - Auth env: `AUTH_USERNAME`, `AUTH_PASSWORD_HASH`, `COOKIE_SECRET`, optional `AUTH_PORT`, `COOKIE_MAX_AGE`
  - Container: `auth-service/Dockerfile`, root `docker-compose.yml` `auth-service` profile

## Monitoring & Observability

**Error Tracking:**

- None detected as an external service.

**Logs:**

- Structured Pino logging from `packages/paths/src/logger.ts`.
- Server logs use child loggers in `packages/server/src/index.ts`, `packages/server/src/routes/api.ts`, database adapters, and platform adapters.
- Docker health checks call `/api/health` via `docker-compose.yml` and `deploy/docker-compose.yml`.
- Runtime health endpoints are `/health`, `/health/db`, `/health/concurrency`, and `/api/health` in `packages/server/src/index.ts` and `packages/server/src/routes/api.ts`.

## CI/CD & Deployment

**Hosting:**

- Local/source mode: `bun run dev` or `bun run dev:server`/`bun run dev:web` from `package.json`.
- Docker source image: root `Dockerfile` and `docker-compose.yml`.
- Deploy image: `ghcr.io/coleam00/archon:latest` in `deploy/docker-compose.yml`.
- Docs: GitHub Pages from `packages/docs-web/dist`.

**CI Pipeline:**

- Test and Docker smoke: `.github/workflows/test.yml`.
- Docker publish: `.github/workflows/publish.yml`.
- CLI binary release: `.github/workflows/release.yml`.
- Docs deploy: `.github/workflows/deploy-docs.yml`.
- Live E2E smoke: `.github/workflows/e2e-smoke.yml`.
- Fork-local upstream drift issue check: `.github/workflows/my-achrchon-sync.yml`.

## Environment Configuration

**Required env vars:**

- Minimum AI credentials for server startup: one Claude path (`CLAUDE_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN`, or `CLAUDE_USE_GLOBAL_AUTH`) or Codex token pair (`CODEX_ID_TOKEN`, `CODEX_ACCESS_TOKEN`) checked in `packages/server/src/index.ts`.
- Database: optional `DATABASE_URL`; absence selects SQLite in `packages/core/src/db/connection.ts`.
- HTTP/runtime: `PORT`, `HOST`, `WEB_UI_ORIGIN`, `WEB_UI_DEV`, `LOG_LEVEL`.
- Platform activation: `TELEGRAM_BOT_TOKEN`, `DISCORD_BOT_TOKEN`, `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`, `GITHUB_TOKEN` + `WEBHOOK_SECRET`, `GITEA_URL` + `GITEA_TOKEN` + `GITEA_WEBHOOK_SECRET`, `GITLAB_TOKEN` + `GITLAB_WEBHOOK_SECRET`.
- Platform access control: `TELEGRAM_ALLOWED_USER_IDS`, `TELEGRAM_ALLOWED_USERS`, `DISCORD_ALLOWED_USER_IDS`, `SLACK_ALLOWED_USER_IDS`, `GITHUB_ALLOWED_USERS`, `GITEA_ALLOWED_USERS`, `GITLAB_ALLOWED_USERS`.
- Provider/runtime tuning: `DEFAULT_AI_ASSISTANT`, `CLAUDE_BIN_PATH`, `CODEX_BIN_PATH`, `ARCHON_CLAUDE_FIRST_EVENT_TIMEOUT_MS`, `MAX_CONCURRENT_CONVERSATIONS`, `TITLE_GENERATION_MODEL`.
- Archon paths/state: `ARCHON_HOME`, `ARCHON_DOCKER`, `WORKSPACE_PATH`.
- Auth sidecar: `AUTH_USERNAME`, `AUTH_PASSWORD_HASH`, `COOKIE_SECRET`, `AUTH_SERVICE_PORT`/`AUTH_PORT`, `COOKIE_MAX_AGE`.

**Secrets location:**

- Real runtime secrets belong in `~/.archon/.env` or `<repo>/.archon/.env`, loaded by `packages/paths/src/env-loader.ts`.
- Repo-root `.env.example` and `deploy/.env.example` are examples only; do not commit real `.env` files.
- Per-codebase env vars can also live in the database table managed by `packages/core/src/db/env-vars.ts` and exposed through `/api/codebases/{id}/env` in `packages/server/src/routes/api.ts`.
- `.archon/config.yaml` supports non-secret configuration and may contain `env` for project execution; do not commit sensitive values there.

## Webhooks & Callbacks

**Incoming:**

- `POST /webhooks/github` - GitHub issue/PR webhook endpoint in `packages/server/src/index.ts`.
- `POST /webhooks/gitea` - Gitea webhook endpoint in `packages/server/src/index.ts`.
- `POST /webhooks/gitlab` - GitLab webhook endpoint in `packages/server/src/index.ts`.
- `GET /api/stream/{conversationId}` and dashboard SSE endpoints - Web UI server-sent events in `packages/server/src/routes/api.ts`.
- `GET /verify`, `GET /login`, `POST /login`, `GET /logout` - Auth sidecar endpoints in `auth-service/server.js`.

**Outgoing:**

- Slack Web API calls via `@slack/bolt` in `packages/adapters/src/chat/slack/adapter.ts`.
- Telegram Bot API calls via `grammy` in `packages/adapters/src/chat/telegram/adapter.ts`.
- Discord API calls via `discord.js` in `packages/adapters/src/community/chat/discord/adapter.ts`.
- GitHub REST API calls via `@octokit/rest` in `packages/adapters/src/forge/github/adapter.ts`.
- Gitea and GitLab API calls from their community forge adapters in `packages/adapters/src/community/forge/gitea/adapter.ts` and `packages/adapters/src/community/forge/gitlab/adapter.ts`.
- AI provider subprocess/SDK calls from `packages/providers/src/claude/provider.ts`, `packages/providers/src/codex/provider.ts`, and `packages/providers/src/community/pi/provider.ts`.
- Release web UI download from GitHub Releases in `packages/cli/src/commands/serve.ts`.
- GitHub CLI auth/status checks from `packages/server/src/index.ts` through `packages/git/src/github-cli-auth.ts`.

---

_Integration audit: 2026-05-04_
