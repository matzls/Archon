import { afterEach, describe, expect, it } from 'bun:test';
import { execFile } from 'child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';
import { preflightWorkflowInputFiles } from './workflow-input-preflight';

const execFileAsync = promisify(execFile);
const testDirs: string[] = [];

afterEach(async () => {
  await Promise.all(testDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('preflightWorkflowInputFiles', () => {
  it('blocks untracked local file inputs for isolated worktree runs', async () => {
    const repo = await createRepo();
    await mkdir(join(repo, 'docs/prd'), { recursive: true });
    await writeFile(join(repo, 'docs/prd/new.md'), '# New PRD\n');

    const result = await preflightWorkflowInputFiles({
      originalCwd: repo,
      repoRoot: repo,
      userMessage: 'docs/prd/new.md',
      workflowName: 'archon-piv-loop-codex-v2',
      wantsIsolation: true,
      startRef: 'HEAD',
    });

    expect(result.blocked).toBe(true);
    expect(result.message).toContain('docs/prd/new.md');
    expect(result.message).toContain('uncommitted changes');
    expect(result.message).toContain('did not copy');
  });

  it('blocks tracked files that are modified in the launch checkout', async () => {
    const repo = await createRepo();
    await mkdir(join(repo, 'docs/prd'), { recursive: true });
    await writeFile(join(repo, 'docs/prd/existing.md'), '# Existing\n');
    await git(repo, 'add', 'docs/prd/existing.md');
    await git(repo, 'commit', '-m', 'add prd');
    await writeFile(join(repo, 'docs/prd/existing.md'), '# Existing\n\nChanged\n');

    const result = await preflightWorkflowInputFiles({
      originalCwd: repo,
      repoRoot: repo,
      userMessage: 'docs/prd/existing.md',
      workflowName: 'archon-piv-loop-codex-v2',
      wantsIsolation: true,
      startRef: 'HEAD',
    });

    expect(result.blocked).toBe(true);
    expect(result.message).toContain('uncommitted changes');
  });

  it('blocks clean files that are not present at the worktree start point', async () => {
    const repo = await createRepo();
    const baseRef = await gitStdout(repo, 'rev-parse', 'HEAD');
    await mkdir(join(repo, 'docs/prd'), { recursive: true });
    await writeFile(join(repo, 'docs/prd/feature.md'), '# Feature\n');
    await git(repo, 'add', 'docs/prd/feature.md');
    await git(repo, 'commit', '-m', 'add feature prd');

    const result = await preflightWorkflowInputFiles({
      originalCwd: repo,
      repoRoot: repo,
      userMessage: 'docs/prd/feature.md',
      workflowName: 'archon-piv-loop-codex-v2',
      wantsIsolation: true,
      startRef: baseRef,
    });

    expect(result.blocked).toBe(true);
    expect(result.message).toContain('not present at the worktree start point');
  });

  it('allows clean files that are present at the worktree start point', async () => {
    const repo = await createRepo();
    await mkdir(join(repo, 'docs/prd'), { recursive: true });
    await writeFile(join(repo, 'docs/prd/ready.md'), '# Ready\n');
    await git(repo, 'add', 'docs/prd/ready.md');
    await git(repo, 'commit', '-m', 'add ready prd');

    const result = await preflightWorkflowInputFiles({
      originalCwd: repo,
      repoRoot: repo,
      userMessage: '"docs/prd/ready.md"',
      workflowName: 'archon-piv-loop-codex-v2',
      wantsIsolation: true,
      startRef: 'HEAD',
    });

    expect(result.blocked).toBe(false);
    expect(result.checkedPaths).toEqual(['docs/prd/ready.md']);
  });

  it('skips checks when isolation is disabled', async () => {
    const repo = await createRepo();
    await writeFile(join(repo, 'scratch.md'), '# Scratch\n');

    const result = await preflightWorkflowInputFiles({
      originalCwd: repo,
      repoRoot: repo,
      userMessage: 'scratch.md',
      workflowName: 'archon-piv-loop-codex-v2',
      wantsIsolation: false,
    });

    expect(result.blocked).toBe(false);
    expect(result.checkedPaths).toEqual([]);
  });
});

async function createRepo(): Promise<string> {
  const repo = await mkdtemp(join(tmpdir(), 'archon-input-preflight-'));
  testDirs.push(repo);
  await git(repo, 'init');
  await git(repo, 'config', 'user.email', 'test@example.com');
  await git(repo, 'config', 'user.name', 'Test User');
  await writeFile(join(repo, 'README.md'), '# Test\n');
  await git(repo, 'add', 'README.md');
  await git(repo, 'commit', '-m', 'initial');
  return repo;
}

async function git(repo: string, ...args: string[]): Promise<void> {
  await execFileAsync('git', ['-C', repo, ...args], { timeout: 10000 });
}

async function gitStdout(repo: string, ...args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', ['-C', repo, ...args], { timeout: 10000 });
  return stdout.trim();
}
