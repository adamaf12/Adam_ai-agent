import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_RUN_POLICY, assertRunBudget } from '../src/core/agent/runPolicy.ts';
import { chooseResponseDecision, capResponse } from '../src/core/agent/responsePolicy.ts';
import { RequestDeduplicator } from '../src/core/agent/requestDedup.ts';

test('run policy rejects exhausted budgets', () => {
  assert.throws(() => assertRunBudget(DEFAULT_RUN_POLICY, { steps: 9, toolCalls: 0, elapsedMs: 0, responseChars: 0 }), /step budget/);
});

test('response policy qualifies weak evidence instead of overstating certainty', () => {
  assert.equal(chooseResponseDecision({ hasEvidence: true, evidenceStrength: 0.5, executionSucceeded: true, consistency: 0.6, requestedActionCompleted: true }), 'qualify');
  assert.equal(chooseResponseDecision({ hasEvidence: false, evidenceStrength: 0, executionSucceeded: false, consistency: 0, requestedActionCompleted: false }), 'qualify');
});

test('response cap preserves a bounded output', () => {
  assert.equal(capResponse('abcdefghij', 6), 'abcde…');
});

test('request deduplicator blocks concurrent duplicate ids', () => {
  const dedupe = new RequestDeduplicator();
  assert.equal(dedupe.begin('r1'), true);
  assert.equal(dedupe.begin('r1'), false);
  dedupe.finish('r1');
  assert.equal(dedupe.begin('r1'), true);
});
