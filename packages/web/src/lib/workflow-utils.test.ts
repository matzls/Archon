import { describe, test, expect } from 'bun:test';
import { approvalsEqual, isTerminalStatus, parseWorkflowApproval } from './workflow-utils';

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
  test('parses valid approval metadata', () => {
    expect(
      parseWorkflowApproval({
        nodeId: 'refine-plan',
        message: 'Review the plan',
        lastOutput: 'Plan summary',
        lastOutputTruncated: false,
        finalAssistantOutput: 'Ready to approve',
        finalAssistantOutputTruncated: true,
      })
    ).toEqual({
      nodeId: 'refine-plan',
      message: 'Review the plan',
      lastOutput: 'Plan summary',
      lastOutputTruncated: false,
      finalAssistantOutput: 'Ready to approve',
      finalAssistantOutputTruncated: true,
    });
  });

  test('returns undefined for invalid approval metadata', () => {
    expect(parseWorkflowApproval({ nodeId: 'refine-plan' })).toBeUndefined();
    expect(parseWorkflowApproval('refine-plan')).toBeUndefined();
  });
});

describe('approvalsEqual', () => {
  test('returns true for matching approvals', () => {
    expect(
      approvalsEqual(
        {
          nodeId: 'refine-plan',
          message: 'Review the plan',
          lastOutput: 'Summary',
          lastOutputTruncated: false,
          finalAssistantOutput: 'Ready to approve',
          finalAssistantOutputTruncated: false,
        },
        {
          nodeId: 'refine-plan',
          message: 'Review the plan',
          lastOutput: 'Summary',
          lastOutputTruncated: false,
          finalAssistantOutput: 'Ready to approve',
          finalAssistantOutputTruncated: false,
        }
      )
    ).toBe(true);
  });

  test('returns false when approval state changes', () => {
    expect(
      approvalsEqual(
        { nodeId: 'explore', message: 'Explore first' },
        { nodeId: 'refine-plan', message: 'Review the plan' }
      )
    ).toBe(false);
  });
});
