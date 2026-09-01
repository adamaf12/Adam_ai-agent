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

test('provider adapter aborts stalled providers', async () => {
  const previous = process.env.ADAM_PROVIDER_TIMEOUT_MS;
  process.env.ADAM_PROVIDER_TIMEOUT_MS = '5000';
  try {
    const adapter = new FetchProviderAdapter(async (_url, init) => await new Promise((_, reject) => {
      init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    }));
    await assert.rejects(() => adapter.invoke(model, request), /timed out/i);
  } finally {
    if (previous === undefined) delete process.env.ADAM_PROVIDER_TIMEOUT_MS;
    else process.env.ADAM_PROVIDER_TIMEOUT_MS = previous;
  }
});
