import test from 'node:test';
import assert from 'node:assert/strict';
import { ModelGateway } from '../src/core/models/modelGateway.ts';

test('ModelGateway falls back through the selected model swarm', async () => {
  const calls = [];
  const gateway = new ModelGateway(async (model) => {
    calls.push(model.id);
    if (calls.length === 1) throw new Error('temporary failure');
    return 'ok';
  });
  const result = await gateway.complete(
    { prompt: 'test', capabilities: ['coding'], maxModels: 2 },
    { prompt: 'test' },
  );
  assert.equal(result.response.text, 'ok');
  assert.equal(result.attempts.length, 2);
});
