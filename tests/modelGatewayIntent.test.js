import test from 'node:test';
import assert from 'node:assert/strict';
import { inferCapabilities } from '../src/core/models/agentModelGateway.ts';

test('agent routing detects coding and reasoning tasks', () => {
  const capabilities = inferCapabilities('حلل هذا الكود وأعد تصميم architecture');
  assert.ok(capabilities.includes('coding'));
  assert.ok(capabilities.includes('reasoning'));
});

test('simple prompts stay on the general path', () => {
  assert.deepEqual(inferCapabilities('مرحبا'), ['general']);
});
