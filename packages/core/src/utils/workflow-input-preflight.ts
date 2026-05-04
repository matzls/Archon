import { stat } from 'fs/promises';
import { isAbsolute, relative, resolve } from 'path';
import { promisify } from 'util';
import { execFile } from 'child_process';

const execFileAsync = promisify(execFile);

export interface WorkflowInputPreflightOptions {
  originalCwd: string;
  repoRoot: string;
  userMessage: string;
  workflowName: string;
  wantsIsolation: boolean;
  startRef?: string;
}

export interface WorkflowInputPreflightResult {
  blocked: boolean;
  checkedPaths: string[];
  message?: string;
}

interface BlockedInput {
  displayPath: string;
  repoRelativePath: string;
  reasons: string[];
}

const LOCAL_PATH_HINT = /^(?:\.{1,2}[\\/]|[~\\/]|[A-Za-z]:[\\/])|[\\/]|\.md$/i;

export async function preflightWorkflowInputFiles(
  options: WorkflowInputPreflightOptions
): Promise<WorkflowInputPreflightResult> {
  if (!options.wantsIsolation) {
    return { blocked: false, checkedPaths: [] };
  }

  const candidates = extractLocalPathCandidates(options.userMessage);
  const blockedInputs: BlockedInput[] = [];
  const checkedPaths: string[] = [];

  for (const candidate of candidates) {
    const resolvedPath = isAbsolute(candidate)
      ? resolve(candidate)
      : resolve(options.originalCwd, candidate);

    let fileStat;
    try {
      fileStat = await stat(resolvedPath);
    } catch {
      continue;
    }

    if (!fileStat.isFile()) {
      continue;
    }

    const repoRelativePath = relative(options.repoRoot, resolvedPath);
    if (repoRelativePath.startsWith('..') || isAbsolute(repoRelativePath)) {
      blockedInputs.push({
        displayPath: candidate,
        repoRelativePath: resolvedPath,
        reasons: ['the file is outside the registered repository'],
      });
      checkedPaths.push(candidate);
      continue;
    }

    checkedPaths.push(repoRelativePath);
    const reasons: string[] = [];

    const status = await gitStatusForPath(options.repoRoot, repoRelativePath);
    if (status.length > 0) {
      reasons.push('it has uncommitted changes in the launch checkout');
    }

    if (options.startRef) {
      const existsAtStartRef = await gitPathExistsAtRef(
        options.repoRoot,
        options.startRef,
        repoRelativePath
      );
      if (!existsAtStartRef) {
        reasons.push(`it is not present at the worktree start point (${options.startRef})`);
      }
    }

    if (reasons.length > 0) {
      blockedInputs.push({
        displayPath: candidate,
        repoRelativePath,
        reasons,
      });
    }
  }

  if (blockedInputs.length === 0) {
    return { blocked: false, checkedPaths };
  }

  return {
    blocked: true,
    checkedPaths,
    message: formatBlockedMessage(options.workflowName, blockedInputs),
  };
}

function extractLocalPathCandidates(message: string): string[] {
  const tokens = tokenizeMessage(message);
  const candidates: string[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    const cleaned = stripPathTokenPunctuation(token);
    if (!cleaned || cleaned.includes('\0') || !LOCAL_PATH_HINT.test(cleaned)) {
      continue;
    }
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(cleaned)) {
      continue;
    }
    if (!seen.has(cleaned)) {
      seen.add(cleaned);
      candidates.push(cleaned);
    }
  }

  return candidates;
}

function tokenizeMessage(message: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;

  for (const char of message) {
    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

function stripPathTokenPunctuation(token: string): string {
  return token.replace(/^[`([{<]+/, '').replace(/[`.,;:!?)}>\]]+$/, '');
}

async function gitStatusForPath(repoRoot: string, repoRelativePath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['-C', repoRoot, 'status', '--porcelain=v1', '--', repoRelativePath],
      { timeout: 10000 }
    );
    return stdout.trim();
  } catch {
    return '';
  }
}

async function gitPathExistsAtRef(
  repoRoot: string,
  startRef: string,
  repoRelativePath: string
): Promise<boolean> {
  try {
    await execFileAsync(
      'git',
      ['-C', repoRoot, 'cat-file', '-e', `${startRef}:${repoRelativePath}`],
      {
        timeout: 10000,
      }
    );
    return true;
  } catch {
    return false;
  }
}

function formatBlockedMessage(workflowName: string, blockedInputs: BlockedInput[]): string {
  const details = blockedInputs
    .map(input => {
      const reasons = input.reasons.map(reason => `    - ${reason}`).join('\n');
      return `  - ${input.displayPath} (${input.repoRelativePath})\n${reasons}`;
    })
    .join('\n');

  return (
    `Cannot launch workflow '${workflowName}' in an isolated worktree because local input files would not be available there.\n\n` +
    `${details}\n\n` +
    'Archon worktrees start from committed git state, not from the live checkout index or untracked files.\n\n' +
    'Choose one:\n' +
    '- Commit the input file to the branch/start point used for this run.\n' +
    '- Rerun with --no-worktree to use the live checkout.\n' +
    '- Use an explicit artifact/content handoff when available.\n\n' +
    'Archon did not copy these files automatically.'
  );
}
