import test from 'node:test';
import assert from 'node:assert/strict';
import { EnsembleScheduler } from '../src/core/models/ensembleScheduler.ts';

test('ensemble scheduler returns usable answers', async () => {
  const gateway = { complete: async () => ({ response: { modelId: 'test-model', provider: 'test', latencyMs: 1, text: 'answer' }, plan: { primary: { id: 'test-model' }, ensemble: [{ id: 'test-model' }], strategy: 'single' }, attempts: ['test-model'] }) };
  const result = await new EnsembleScheduler(gateway).run('حلل الكود', ['coding'], 2);
  assert.equal(result.answers.length, 2);
  assert.match(result.consensus, /answer/);
});
