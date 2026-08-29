import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_RUN_POLICY, assertRunBudget, mergeRunPolicy } from '../src/core/agent/runPolicy.ts';
import { chooseResponseDecision, capResponse } from '../src/core/agent/responsePolicy.ts';
import { RequestDeduplicator } from '../src/core/agent/requestDedup.ts';

test('run policy rejects exhausted budgets', () => {
  assert.throws(() => assertRunBudget(DEFAULT_RUN_POLICY, { steps: 9, toolCalls: 0, elapsedMs: 0, responseChars: 0 }), /step budget/);
});

test('run policy floors fractional overrides and rejects sub-unit limits', () => {
  assert.deepEqual(mergeRunPolicy(DEFAULT_RUN_POLICY, { maxSteps: 3.9 }), { ...DEFAULT_RUN_POLICY, maxSteps: 3 });
  assert.throws(() => mergeRunPolicy(DEFAULT_RUN_POLICY, { maxSteps: 0.5 }), /at least 1/);
});

test('response policy qualifies weak evidence instead of overstating certainty', () => {
  assert.equal(chooseResponseDecision({ hasEvidence: true, evidenceStrength: 0.5, executionSucceeded: true, consistency: 0.6, requestedActionCompleted: true }), 'qualify');
  assert.equal(chooseResponseDecision({ hasEvidence: false, evidenceStrength: 0, executionSucceeded: false, consistency: 0, requestedActionCompleted: false }), 'qualify');
});

test('response cap preserves a bounded output', () => {
  assert.equal(capResponse('abcdefghij', 6), 'abcde…');
  assert.equal(capResponse('abcdefghij', 1), '…');
  assert.equal(capResponse('abc', 3), 'abc');
});

test('request deduplicator blocks concurrent duplicate ids and expires stale entries', () => {
  const dedupe = new RequestDeduplicator(100);
  assert.equal(dedupe.begin('r1', 1_000), true);
  assert.equal(dedupe.begin('r1', 1_050), false);
  assert.equal(dedupe.has('r1', 1_099), true);
  assert.equal(dedupe.has('r1', 1_100), false);
  assert.equal(dedupe.begin('r1', 1_101), true);
  dedupe.finish('r1');
  assert.equal(dedupe.size(), 0);
});
