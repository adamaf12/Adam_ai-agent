import test from 'node:test';
import assert from 'node:assert/strict';
import { isModelRunnable, selectModels } from './modelSelection';

test('selection returns the router primary and ensemble', () => {
  const result = selectModels({ prompt: 'solve this', capabilities: ['reasoning'], maxModels: 2 });
  assert.ok(result.primary.model.id);
  assert.equal(result.ensemble.length, 2);
});

test('local and OpenAI-compatible models require an endpoint', () => {
  const local = { id: 'local', provider: 'local', displayName: 'Local', capabilities: ['general'], quality: 8, speed: 8, cost: 0, enabled: true } as const;
  assert.equal(isModelRunnable(local, new Set()), false);
  assert.equal(isModelRunnable({ ...local, endpoint: 'http://localhost:8000/v1' }, new Set()), true);
});

test('cloud models require a configured provider', () => {
  const gemini = { id: 'g', provider: 'gemini', displayName: 'Gemini', capabilities: ['general'], quality: 8, speed: 8, cost: 1, enabled: true } as const;
  assert.equal(isModelRunnable(gemini, new Set()), false);
  assert.equal(isModelRunnable(gemini, new Set(['gemini'])), true);
});
