import test from 'node:test';
import assert from 'node:assert/strict';
import { isToolName, validateToolCall } from '../src/core/agent/tooling.ts';
import { isReadOnlyTool, requiresConfirmation, validateExecution } from '../src/core/agent/executionPolicy.ts';

test('accepts supported tool names', () => {
  assert.equal(isToolName('task.create'), true);
  assert.equal(isToolName('web.delete'), false);
});

test('validates a well formed tool call', () => {
  assert.deepEqual(validateToolCall({ id: '1', name: 'memory.search', arguments: { query: 'name' } }), {
    id: '1', name: 'memory.search', arguments: { query: 'name' },
  });
});

test('rejects malformed tool calls', () => {
  assert.throws(() => validateToolCall({ id: '', name: 'task.list', arguments: {} }));
  assert.throws(() => validateToolCall({ id: '1', name: 'unknown', arguments: {} }));
});

test('classifies safe and destructive actions', () => {
  assert.equal(isReadOnlyTool('task.list'), true);
  assert.equal(requiresConfirmation('task.delete'), true);
  assert.equal(requiresConfirmation('task.create'), false);
  assert.doesNotThrow(() => validateExecution({ id: '1', name: 'task.create', arguments: {} }));
});
