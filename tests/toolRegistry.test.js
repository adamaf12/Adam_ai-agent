import test from 'node:test';
import assert from 'node:assert/strict';
import { ToolRegistry } from '../src/core/agent/toolRegistry.ts';

test('registers, lists and executes tools', async () => {
  const registry = new ToolRegistry();
  registry.register({
    name: 'read_task',
    description: 'Read a task by id',
    risk: 'read',
    execute: async (args) => ({ ok: true, args }),
  });

  assert.equal(registry.list().length, 1);
  assert.deepEqual(await registry.execute('read_task', { id: '1' }), { ok: true, args: { id: '1' } });
});

test('rejects duplicate and unknown tools', async () => {
  const registry = new ToolRegistry();
  registry.register({ name: 'ping_tool', description: 'Ping', risk: 'read', execute: async () => 'pong' });
  assert.throws(() => registry.register({ name: 'ping_tool', description: 'Duplicate', risk: 'read', execute: async () => 'pong' }));
  await assert.rejects(() => registry.execute('missing_tool', {}), /Unknown tool/);
});
