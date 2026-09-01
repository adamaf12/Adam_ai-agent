import test from 'node:test';
import assert from 'node:assert/strict';
import { EnsembleScheduler } from '../src/core/models/ensembleScheduler.ts';

test('ensemble scheduler returns usable answers', async () => {
  const gateway = {
    invokeSelected: async (model) => ({ modelId: model.id, provider: model.provider, latencyMs: 1, text: 'answer' }),
  };
  const result = await new EnsembleScheduler(gateway).run('حلل الكود', ['coding'], 2);
  assert.equal(result.answers.length, 2);
  assert.match(result.consensus, /answer/);
});
