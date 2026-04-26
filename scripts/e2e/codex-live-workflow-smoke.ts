#!/usr/bin/env bun
/**
 * Opt-in live Codex workflow smoke.
 *
 * This intentionally drives the real CLI against a temporary git repo and a
 * temporary ARCHON_HOME. It uses the real Codex provider, so it requires
 * credentials/network and may spend model credits.
 */
import { spawn } from 'child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

const ENABLED = process.env.ARCHON_LIVE_E2E === '1';
const ASSIST_TOKEN = 'ARCHON_CODEX_ASSIST_SMOKE_OK';
const PIV_FILE = 'archon-codex-live-smoke.txt';
const PIV_CONTENT = 'ARCHON_CODEX_PIV_SMOKE_OK';
const REPO_ROOT = resolve(import.meta.dir, '..', '..');
const CLI_CWD = join(REPO_ROOT, 'packages', 'cli');

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface WorkflowListOutput {
  workflows: { name: string }[];
  errors: { filename: string; error: string }[];
}

interface WorkflowRunStatus {
  id: string;
  workflow_name: string;
  status: string;
  working_path?: string | null;
  metadata?: {
    approval?: {
      nodeId?: string;
      message?: string;
      iteration?: number;
      lastOutput?: string;
    };
  };
}

interface WorkflowStatusOutput {
  runs: WorkflowRunStatus[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseJson(raw: string, label: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${label} did not produce parseable JSON: ${message}\nstdout:\n${raw}`);
  }
}

function assertWorkflowList(value: unknown): asserts value is WorkflowListOutput {
  if (!isRecord(value) || !Array.isArray(value.workflows) || !Array.isArray(value.errors)) {
    throw new Error('workflow list JSON did not match expected shape');
  }
}

function assertWorkflowStatus(value: unknown): asserts value is WorkflowStatusOutput {
  if (!isRecord(value) || !Array.isArray(value.runs)) {
    throw new Error('workflow status JSON did not match expected shape');
  }
}

async function runCommand(
  command: string,
  args: string[],
  options: {
    cwd: string;
    env?: NodeJS.ProcessEnv;
    timeoutMs?: number;
    allowFailure?: boolean;
  }
): Promise<CommandResult> {
  const timeoutMs = options.timeoutMs ?? 120_000;

  return await new Promise<CommandResult>((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Timed out after ${timeoutMs}ms: ${command} ${args.join(' ')}`));
    }, timeoutMs);

    child.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));
    child.on('error', error => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', code => {
      clearTimeout(timer);
      const stdout = Buffer.concat(stdoutChunks).toString('utf-8');
      const stderr = Buffer.concat(stderrChunks).toString('utf-8');
      const exitCode = code ?? 1;
      if (exitCode !== 0 && !options.allowFailure) {
        reject(
          new Error(
            `Command failed (${exitCode}): ${command} ${args.join(' ')}\nstdout:\n${stdout}\nstderr:\n${stderr}`
          )
        );
        return;
      }
      resolvePromise({ stdout, stderr, exitCode });
    });
  });
}

async function runCli(
  repoDir: string,
  archonHome: string,
  args: string[],
  timeoutMs = 120_000
): Promise<CommandResult> {
  return await runCommand('bun', ['--cwd', CLI_CWD, 'src/cli.ts', '--cwd', repoDir, ...args], {
    cwd: REPO_ROOT,
    env: {
      ARCHON_HOME: archonHome,
      LOG_LEVEL: process.env.LOG_LEVEL ?? 'warn',
    },
    timeoutMs,
  });
}

async function initializeRepo(repoDir: string): Promise<void> {
  await mkdir(repoDir, { recursive: true });
  await runCommand('git', ['init'], { cwd: repoDir });
  await runCommand('git', ['config', 'user.email', 'archon-e2e@example.invalid'], { cwd: repoDir });
  await runCommand('git', ['config', 'user.name', 'Archon E2E'], { cwd: repoDir });
  await writeFile(join(repoDir, 'README.md'), '# Archon live Codex smoke\n', 'utf-8');
  await runCommand('git', ['add', 'README.md'], { cwd: repoDir });
  await runCommand('git', ['commit', '-m', 'Initial smoke repo'], { cwd: repoDir });
}

async function getActiveRun(
  repoDir: string,
  archonHome: string,
  workflowName: string
): Promise<WorkflowRunStatus | undefined> {
  const result = await runCli(repoDir, archonHome, ['workflow', 'status', '--json']);
  const parsed = parseJson(result.stdout, 'workflow status');
  assertWorkflowStatus(parsed);
  return parsed.runs.find(run => run.workflow_name === workflowName);
}

function responseForPause(run: WorkflowRunStatus): string {
  const nodeId = run.metadata?.approval?.nodeId ?? '';
  const message = run.metadata?.approval?.message ?? '';

  if (nodeId.includes('explore') || message.toLowerCase().includes('ready')) {
    return 'ready, create the plan';
  }
  if (nodeId.includes('refine') || nodeId.includes('review') || nodeId.includes('validate')) {
    return 'approved';
  }
  return 'approved';
}

async function drivePivToCompletion(repoDir: string, archonHome: string): Promise<string> {
  const prompt = [
    'Live E2E smoke for Archon Codex PIV.',
    `Create exactly one repo file named ${PIV_FILE}.`,
    `The file content must be exactly ${PIV_CONTENT} followed by a newline.`,
    'Do not modify any other tracked file.',
    'Keep the plan minimal and approve-ready.',
  ].join(' ');

  await runCli(
    repoDir,
    archonHome,
    ['workflow', 'run', 'archon-piv-loop-codex', '--branch', 'e2e-codex-piv-smoke', prompt],
    900_000
  );

  let latestWorkingPath = repoDir;
  for (let step = 0; step < 8; step += 1) {
    const activeRun = await getActiveRun(repoDir, archonHome, 'archon-piv-loop-codex');
    if (!activeRun) {
      return latestWorkingPath;
    }
    if (activeRun.working_path) {
      latestWorkingPath = activeRun.working_path;
    }
    if (activeRun.status !== 'paused') {
      throw new Error(
        `Expected archon-piv-loop-codex to pause or complete; got ${activeRun.status}`
      );
    }

    const response = responseForPause(activeRun);
    await runCli(repoDir, archonHome, ['workflow', 'approve', activeRun.id, response]);
    await runCli(repoDir, archonHome, ['workflow', 'resume', activeRun.id], 900_000);
  }

  throw new Error('PIV smoke exceeded the maximum number of approval checkpoints');
}

async function assertOnlyExpectedPivChange(workingPath: string): Promise<void> {
  const status = await runCommand('git', ['status', '--short'], { cwd: workingPath });
  const lines = status.stdout
    .split('\n')
    .map(line => line.trimEnd())
    .filter(line => line.length > 0);

  if (lines.length !== 1 || !lines[0].endsWith(` ${PIV_FILE}`)) {
    throw new Error(`Unexpected git status after PIV smoke:\n${status.stdout}`);
  }

  const content = await Bun.file(join(workingPath, PIV_FILE)).text();
  if (content !== `${PIV_CONTENT}\n`) {
    throw new Error(`Unexpected ${PIV_FILE} content: ${JSON.stringify(content)}`);
  }
}

async function main(): Promise<void> {
  if (!ENABLED) {
    console.log('Skipping live Codex E2E smoke. Set ARCHON_LIVE_E2E=1 to run it.');
    return;
  }

  const tempRoot = await mkdtemp(join(tmpdir(), 'archon-codex-live-'));
  const repoDir = join(tempRoot, 'repo');
  const archonHome = join(tempRoot, 'archon-home');
  let success = false;

  try {
    await initializeRepo(repoDir);
    await mkdir(archonHome, { recursive: true });

    const listResult = await runCli(repoDir, archonHome, ['workflow', 'list', '--json']);
    const workflowList = parseJson(listResult.stdout, 'workflow list');
    assertWorkflowList(workflowList);
    const workflowNames = new Set(workflowList.workflows.map(workflow => workflow.name));
    for (const expected of ['archon-assist-codex', 'archon-piv-loop-codex']) {
      if (!workflowNames.has(expected)) {
        throw new Error(`workflow list did not include ${expected}`);
      }
    }

    await runCli(repoDir, archonHome, ['validate', 'workflows', 'archon-assist-codex']);
    await runCli(repoDir, archonHome, ['validate', 'workflows', 'archon-piv-loop-codex']);

    const assistResult = await runCli(
      repoDir,
      archonHome,
      [
        'workflow',
        'run',
        'archon-assist-codex',
        '--no-worktree',
        `Read-only live smoke. Make no file changes. Reply with exactly ${ASSIST_TOKEN}.`,
      ],
      600_000
    );
    if (!assistResult.stdout.includes(ASSIST_TOKEN)) {
      throw new Error(`archon-assist-codex did not emit ${ASSIST_TOKEN}`);
    }
    const assistStatus = await runCommand('git', ['status', '--short'], { cwd: repoDir });
    if (assistStatus.stdout.trim() !== '') {
      throw new Error(`archon-assist-codex changed the repo unexpectedly:\n${assistStatus.stdout}`);
    }

    const pivWorkingPath = await drivePivToCompletion(repoDir, archonHome);
    await assertOnlyExpectedPivChange(pivWorkingPath);

    success = true;
    console.log('Live Codex workflow smoke passed.');
  } finally {
    if (success) {
      await rm(tempRoot, { recursive: true, force: true });
    } else {
      console.error(`Live smoke failed. Preserved temp directory: ${tempRoot}`);
    }
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
