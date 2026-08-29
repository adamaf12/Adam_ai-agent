import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyRetryReason, retryDecision } from './retryPolicy.ts';

test('retry classification separates transient and permanent failures', () => {
  assert.equal(classifyRetryReason(new Error('HTTP 503 unavailable')), 'server');
  assert.equal(classifyRetryReason(new Error('429 rate limit')), 'rate_limit');
  assert.equal(classifyRetryReason(new Error('HTTP 401 unauthorized')), 'auth');
  assert.equal(classifyRetryReason(new Error('HTTP 404 not found')), 'client');
});

test('retry policy stops after max attempts', () => {
  assert.equal(retryDecision(1, new Error('network error')), 'retry');
  assert.equal(retryDecision(3, new Error('network error')), 'fail');
  assert.equal(retryDecision(1, new Error('HTTP 400 bad request')), 'fail');
});
