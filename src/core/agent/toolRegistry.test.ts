import { describe, expect, it } from 'vitest';
import { ToolRegistry } from './toolRegistry';

describe('ToolRegistry', () => {
  it('rejects duplicate tools and exposes definitions without executors', () => {
    const registry = new ToolRegistry();
    registry.register({ name: 'echo', description: 'Echo input', risk: 'read', execute: async (args) => args });
    expect(() => registry.register({ name: 'echo', description: 'Duplicate', risk: 'read', execute: async () => null })).toThrow();
    expect(registry.list()[0]).toMatchObject({ name: 'echo', risk: 'read' });
    expect(registry.list()[0]).not.toHaveProperty('execute');
  });

  it('cancels execution when the parent signal is aborted', async () => {
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
    await expect(promise).rejects.toThrow('aborted');
  });
});
