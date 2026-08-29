import test from 'node:test';
import assert from 'node:assert/strict';
import { createResponseOrchestrator, normalizeResponseError } from '../src/core/agent/responseOrchestrator.ts';

test('orchestrator runs plan, tool execution, verification, and response composition in order', async () => {
  const events = [];
  const orchestrator = createResponseOrchestrator({
    plan: async () => { events.push('plan'); return { needsTool: true, tool: 'tasks.list', input: {} }; },
    executeTool: async () => { events.push('tool'); return { ok: true, data: [{ title: 'Study' }] }; },
    verify: async result => { events.push('verify'); return { ok: result.ok, facts: result.data }; },
    compose: async verified => { events.push('compose'); return `You have ${verified.facts.length} task.`; },
  });
  const result = await orchestrator.run({ text: 'what is my task?', history: [] });
  assert.equal(result.text, 'You have 1 task.');
  assert.deepEqual(events, ['plan', 'tool', 'verify', 'compose']);
});

test('orchestrator can answer directly without a tool', async () => {
  const orchestrator = createResponseOrchestrator({
    plan: async () => ({ needsTool: false }),
    executeTool: async () => { throw new Error('should not run'); },
    verify: async () => { throw new Error('should not run'); },
    compose: async () => 'Direct answer',
  });
  assert.equal((await orchestrator.run({ text: 'hello', history: [] })).text, 'Direct answer');
});

test('orchestrator stops before executing a tool when the run is cancelled', async () => {
  const controller = new AbortController();
  let executed = false;
  const orchestrator = createResponseOrchestrator({
    plan: async () => { controller.abort(); return { needsTool: true, tool: 'tasks.list', input: {} }; },
    executeTool: async () => { executed = true; return { ok: true }; },
    verify: async () => ({ ok: true, facts: null }),
    compose: async () => 'should not compose',
  });
  await assert.rejects(() => orchestrator.run({ text: 'cancel me', history: [], signal: controller.signal }), /aborted/i);
  assert.equal(executed, false);
});

test('provider errors become safe user-facing errors', () => {
  assert.deepEqual(normalizeResponseError(Object.assign(new Error('quota exceeded'), { status: 429 })), {
    code: 'AI_RATE_LIMIT',
    message: 'Adam is temporarily rate-limited. Please try again in a moment.',
  });
});
