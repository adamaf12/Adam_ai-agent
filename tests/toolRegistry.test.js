import test from 'node:test';
import assert from 'node:assert/strict';
import { ToolRegistry } from '../src/core/agent/toolRegistry.ts';

test('tool registry rejects duplicate tools and hides executors from definitions', () => {
  const registry = new ToolRegistry();
  registry.register({ name: 'echo', description: 'Echo input', risk: 'read', execute: async (args) => args });
  assert.throws(
    () => registry.register({ name: 'echo', description: 'Duplicate', risk: 'read', execute: async () => null }),
    /already registered/,
  );
  assert.deepEqual(registry.list()[0], { name: 'echo', description: 'Echo input', risk: 'read' });
});

test('tool registry propagates parent cancellation to the running tool', async () => {
  const registry = new ToolRegistry();
  const controller = new AbortController();
  registry.register({
    name: 'slow', description: 'Slow', risk: 'read',
    execute: async (_args, context) => new Promise((_resolve, reject) => {
      context.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    }),
  });
  const promise = registry.execute('slow', null, { signal: controller.signal });
  controller.abort();
  await assert.rejects(promise, /aborted/);
});

test('tool registry rejects when a tool ignores the execution timeout', async () => {
  const registry = new ToolRegistry();
  registry.register({
    name: 'hang', description: 'Never resolves', risk: 'read',
    execute: async () => new Promise(() => {}),
  });
  await assert.rejects(
    Promise.race([
      registry.execute('hang', null, { timeoutMs: 100 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('test timeout')), 500)),
    ]),
    /timed out/,
  );
});
