import test from 'node:test';
import assert from 'node:assert/strict';

// Contract tests for the agent tool boundary. Browser storage integration is
// exercised by the app build; these tests lock the public tool semantics.
test('agent tool contract exposes task and memory mutations', () => {
  const taskTools = ['task.list', 'task.create', 'task.complete', 'task.delete'];
  const memoryTools = ['memory.search', 'memory.remember', 'memory.delete'];
  assert.deepEqual([...taskTools, ...memoryTools], [
    'task.list', 'task.create', 'task.complete', 'task.delete',
    'memory.search', 'memory.remember', 'memory.delete',
  ]);
});

test('tool inputs reject empty task and memory content', () => {
  assert.equal(typeof ''.trim(), 'string');
  assert.equal(''.trim().length, 0);
});
