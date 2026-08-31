import test from 'node:test';
import assert from 'node:assert/strict';
import { FetchProviderAdapter } from '../src/core/models/modelProviders.ts';

const model = { id: 'test-model', provider: 'pollinations', displayName: 'Test', capabilities: ['general'], quality: 1, speed: 1, cost: 0, enabled: true };
const request = { prompt: 'hello', system: 'be concise', temperature: 0.2, maxTokens: 100 };

test('provider adapter extracts OpenAI-compatible content', async () => {
  const adapter = new FetchProviderAdapter(async (_url, init) => {
    assert.equal(init?.method, 'POST');
    assert.ok(init?.signal);
    return new Response(JSON.stringify({ choices: [{ message: { content: 'hello from provider' } }] }), { status: 200 });
  });
  assert.equal(await adapter.invoke(model, request), 'hello from provider');
});

test('provider adapter rejects empty responses', async () => {
  const adapter = new FetchProviderAdapter(async () => new Response(JSON.stringify({ choices: [{ message: { content: '' } }] }), { status: 200 }));
  await assert.rejects(() => adapter.invoke(model, request), /empty response/i);
});

test('provider adapter sends an abort signal to stalled providers', async () => {
  const adapter = new FetchProviderAdapter(async (_url, init) => {
    assert.ok(init?.signal);
    return new Promise(() => {});
  });
  const pending = adapter.invoke(model, request);
  assert.ok(pending instanceof Promise);
  await new Promise(resolve => setTimeout(resolve, 10));
});
