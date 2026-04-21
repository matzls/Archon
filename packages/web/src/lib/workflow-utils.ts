import type { WorkflowApproval, WorkflowRunStatus } from './types';

export type WorkflowExecutionView = 'graph' | 'logs' | 'chat';

/**
 * Check if a workflow status represents a terminal (finished) state.
 */
export function isTerminalStatus(status: string | undefined): boolean {
  return status === 'completed' || status === 'failed' || status === 'cancelled';
}

export function parseWorkflowApproval(value: unknown): WorkflowApproval | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.message !== 'string') {
    return null;
  }

  return {
    nodeId: typeof candidate.nodeId === 'string' ? candidate.nodeId : '',
    message: candidate.message,
    lastOutput: typeof candidate.lastOutput === 'string' ? candidate.lastOutput : undefined,
    lastOutputTruncated:
      typeof candidate.lastOutput === 'string' && typeof candidate.lastOutputTruncated === 'boolean'
        ? candidate.lastOutputTruncated
        : undefined,
    finalAssistantOutput:
      typeof candidate.finalAssistantOutput === 'string'
        ? candidate.finalAssistantOutput
        : undefined,
    finalAssistantOutputTruncated:
      typeof candidate.finalAssistantOutput === 'string' &&
      typeof candidate.finalAssistantOutputTruncated === 'boolean'
        ? candidate.finalAssistantOutputTruncated
        : undefined,
  };
}

export function getPausedOutputPreview(
  approval: WorkflowApproval | null
): { text: string; truncated: boolean } | null {
  if (!approval) {
    return null;
  }

  const finalAssistantOutput = approval.finalAssistantOutput?.trim() ?? '';
  if (finalAssistantOutput.length > 0) {
    return {
      text: finalAssistantOutput,
      truncated:
        approval.finalAssistantOutputTruncated ??
        finalAssistantOutput.trimEnd().endsWith('[truncated]'),
    };
  }

  const lastOutput = approval.lastOutput?.trim() ?? '';
  if (lastOutput.length === 0) {
    return null;
  }

  return {
    text: lastOutput,
    truncated: approval.lastOutputTruncated ?? lastOutput.trimEnd().endsWith('[truncated]'),
  };
}

export function shouldShowFullPausedOutputAction(
  status: WorkflowRunStatus | undefined,
  runId: string | null | undefined,
  approval: WorkflowApproval | null
): boolean {
  return status === 'paused' && typeof runId === 'string' && runId.length > 0
    ? (getPausedOutputPreview(approval)?.truncated ?? false)
    : false;
}

export function normalizeWorkflowExecutionView(
  value: string | null | undefined,
  hasChatView: boolean
): WorkflowExecutionView {
  if (value === 'logs' || value === 'graph') {
    return value;
  }
  if (value === 'chat' && hasChatView) {
    return value;
  }
  return 'graph';
}

export function isPausedOutputFocus(value: string | null | undefined): boolean {
  return value === 'paused-output';
}

export function buildWorkflowExecutionPath(
  runId: string,
  view?: WorkflowExecutionView,
  focusPausedOutput = false
): string {
  const params = new URLSearchParams();

  if (focusPausedOutput) {
    params.set('view', 'logs');
    params.set('focus', 'paused-output');
  } else if (view) {
    params.set('view', view);
  }

  const query = params.toString();
  return query.length > 0 ? `/workflows/runs/${runId}?${query}` : `/workflows/runs/${runId}`;
}
