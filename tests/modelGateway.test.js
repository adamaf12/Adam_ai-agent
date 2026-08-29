import { describe, expect, it } from 'vitest';
import { ModelGateway } from '../src/core/models/modelGateway.ts';

describe('ModelGateway', () => {
  it('falls back through the selected model swarm', async () => {
    const calls = [];
    const gateway = new ModelGateway(async (model) => {
      calls.push(model.id);
      if (calls.length === 1) throw new Error('temporary failure');
      return 'ok';
    });
    const result = await gateway.complete({ prompt: 'test', capabilities: ['coding'], maxModels: 2 }, { prompt: 'test' });
    expect(result.response.text).toBe('ok');
    expect(result.attempts).toHaveLength(2);
  });
});
