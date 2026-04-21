import { describe, test, expect } from 'bun:test';
import {
  buildWorkflowExecutionPath,
  getPausedOutputPreview,
  isPausedOutputFocus,
  isTerminalStatus,
  normalizeWorkflowExecutionView,
  parseWorkflowApproval,
  shouldShowFullPausedOutputAction,
} from './workflow-utils';

describe('isTerminalStatus', () => {
  test('completed is terminal', () => {
    expect(isTerminalStatus('completed')).toBe(true);
  });

  test('failed is terminal', () => {
    expect(isTerminalStatus('failed')).toBe(true);
  });

  test('cancelled is terminal', () => {
    expect(isTerminalStatus('cancelled')).toBe(true);
  });

  test('running is not terminal', () => {
    expect(isTerminalStatus('running')).toBe(false);
  });

  test('pending is not terminal', () => {
    expect(isTerminalStatus('pending')).toBe(false);
  });

  test('undefined is not terminal', () => {
    expect(isTerminalStatus(undefined)).toBe(false);
  });

  test('empty string is not terminal', () => {
    expect(isTerminalStatus('')).toBe(false);
  });
});

describe('parseWorkflowApproval', () => {
  test('returns approval when required fields are present', () => {
    expect(
      parseWorkflowApproval({
        nodeId: 'review',
        message: 'Waiting for approval',
        lastOutput: 'latest output',
        lastOutputTruncated: true,
      })
    ).toEqual({
      nodeId: 'review',
      message: 'Waiting for approval',
      lastOutput: 'latest output',
      lastOutputTruncated: true,
      finalAssistantOutput: undefined,
      finalAssistantOutputTruncated: undefined,
    });
  });

  test('falls back to an empty node id for legacy payloads', () => {
    expect(parseWorkflowApproval({ message: 'Missing node id' })).toEqual({
      nodeId: '',
      message: 'Missing node id',
      lastOutput: undefined,
      lastOutputTruncated: undefined,
      finalAssistantOutput: undefined,
      finalAssistantOutputTruncated: undefined,
    });
  });

  test('returns null for invalid approval payloads', () => {
    expect(parseWorkflowApproval(null)).toBeNull();
  });
});

describe('getPausedOutputPreview', () => {
  test('prefers final assistant output when present', () => {
    expect(
      getPausedOutputPreview({
        nodeId: 'review',
        message: 'Paused',
        lastOutput: 'older output',
        finalAssistantOutput: 'newer output',
        finalAssistantOutputTruncated: true,
      })
    ).toEqual({
      text: 'newer output',
      truncated: true,
    });
  });

  test('falls back to last output and derives truncation from suffix', () => {
    expect(
      getPausedOutputPreview({
        nodeId: 'review',
        message: 'Paused',
        lastOutput: 'partial result [truncated]',
      })
    ).toEqual({
      text: 'partial result [truncated]',
      truncated: true,
    });
  });

  test('returns null when no preview text is available', () => {
    expect(
      getPausedOutputPreview({
        nodeId: 'review',
        message: 'Paused',
      })
    ).toBeNull();
  });
});

describe('shouldShowFullPausedOutputAction', () => {
  const truncatedApproval = {
    nodeId: 'review',
    message: 'Paused',
    lastOutput: 'partial output',
    lastOutputTruncated: true,
  };

  test('returns true only for paused runs with a clipped preview and run id', () => {
    expect(shouldShowFullPausedOutputAction('paused', 'run-123', truncatedApproval)).toBe(true);
  });

  test('returns false when preview is not clipped, missing, or run id is absent', () => {
    expect(
      shouldShowFullPausedOutputAction('paused', 'run-123', {
        ...truncatedApproval,
        lastOutputTruncated: false,
      })
    ).toBe(false);
    expect(shouldShowFullPausedOutputAction('paused', null, truncatedApproval)).toBe(false);
    expect(shouldShowFullPausedOutputAction('running', 'run-123', truncatedApproval)).toBe(false);
  });
});

describe('normalizeWorkflowExecutionView', () => {
  test('accepts valid views', () => {
    expect(normalizeWorkflowExecutionView('logs', true)).toBe('logs');
    expect(normalizeWorkflowExecutionView('chat', true)).toBe('chat');
  });

  test('falls back to graph for invalid values or unavailable chat', () => {
    expect(normalizeWorkflowExecutionView('invalid', true)).toBe('graph');
    expect(normalizeWorkflowExecutionView('chat', false)).toBe('graph');
    expect(normalizeWorkflowExecutionView(null, true)).toBe('graph');
  });
});

describe('isPausedOutputFocus', () => {
  test('accepts the paused-output focus token only', () => {
    expect(isPausedOutputFocus('paused-output')).toBe(true);
    expect(isPausedOutputFocus('logs')).toBe(false);
    expect(isPausedOutputFocus(null)).toBe(false);
  });
});

describe('buildWorkflowExecutionPath', () => {
  test('builds the paused-output deeplink', () => {
    expect(buildWorkflowExecutionPath('run-123', 'logs', true)).toBe(
      '/workflows/runs/run-123?view=logs&focus=paused-output'
    );
  });

  test('builds plain run-detail paths without extra params by default', () => {
    expect(buildWorkflowExecutionPath('run-123')).toBe('/workflows/runs/run-123');
  });
});
