import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeModelCatalog } from './modelCatalog.ts';
import { ModelGateway } from './modelGateway.ts';
import { EnsembleScheduler } from './ensembleScheduler.ts';

test('model catalog normalizes safe defaults and rejects duplicates', () => {
  const models = normalizeModelCatalog([{ id: 'qwen-local', provider: 'local', capabilities: ['general'] }]);
  assert.equal(models[0].enabled, true);
  assert.equal(models[0].quality, 5);
  assert.throws(() => normalizeModelCatalog([
    { id: 'x', provider: 'local' }, { id: 'x', provider: 'local' },
  ]), /Duplicate model id/);
});

test('ensemble scheduler executes selected members concurrently with bounded workers', async () => {
  const models = [
    { id: 'a', provider: 'local' as const, displayName: 'A', capabilities: ['general'] as const, quality: 9, speed: 9, cost: 0, enabled: true, endpoint: 'http://a' },
    { id: 'b', provider: 'local' as const, displayName: 'B', capabilities: ['general'] as const, quality: 8, speed: 8, cost: 0, enabled: true, endpoint: 'http://b' },
  ];
  let active = 0; let peak = 0;
  const gateway = new ModelGateway(async (model) => {
    active += 1; peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 20));
    active -= 1;
    return model.id;
  });
  const scheduler = new EnsembleScheduler(gateway);
  const result = await scheduler.run('hello', ['general'], 2, undefined, 2);
  assert.equal(result.answers.length, 2);
  assert.equal(peak, 2);
});
