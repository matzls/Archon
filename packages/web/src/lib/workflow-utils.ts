import type { WorkflowApproval } from '@/lib/types';

/**
 * Check if a workflow status represents a terminal (finished) state.
 */
export function isTerminalStatus(status: string | undefined): boolean {
  return status === 'completed' || status === 'failed' || status === 'cancelled';
}

export function parseWorkflowApproval(raw: unknown): WorkflowApproval | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const record = raw as Record<string, unknown>;
  if (typeof record.nodeId !== 'string' || typeof record.message !== 'string') {
    return undefined;
  }

  return {
    nodeId: record.nodeId,
    message: record.message,
    ...(typeof record.lastOutput === 'string' ? { lastOutput: record.lastOutput } : {}),
    ...(typeof record.lastOutputTruncated === 'boolean'
      ? { lastOutputTruncated: record.lastOutputTruncated }
      : {}),
    ...(typeof record.finalAssistantOutput === 'string'
      ? { finalAssistantOutput: record.finalAssistantOutput }
      : {}),
    ...(typeof record.finalAssistantOutputTruncated === 'boolean'
      ? { finalAssistantOutputTruncated: record.finalAssistantOutputTruncated }
      : {}),
  };
}

export function approvalsEqual(
  left: WorkflowApproval | undefined,
  right: WorkflowApproval | undefined
): boolean {
  return (
    left?.nodeId === right?.nodeId &&
    left?.message === right?.message &&
    left?.lastOutput === right?.lastOutput &&
    left?.lastOutputTruncated === right?.lastOutputTruncated &&
    left?.finalAssistantOutput === right?.finalAssistantOutput &&
    left?.finalAssistantOutputTruncated === right?.finalAssistantOutputTruncated
  );
}
