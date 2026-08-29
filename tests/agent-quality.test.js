import test from 'node:test';
import assert from 'node:assert/strict';
import { ToolRegistry } from '../src/core/agent/toolRegistry.ts';
import { buildAgentContext } from '../src/core/agent/context.ts';
import { parseStreamLines } from '../src/core/ai/streamParser.ts';
import { createExecutionPlan } from '../src/core/agent/executionPlan.ts';
import { authorizeTool } from '../src/core/agent/agentPolicy.ts';

test('tool registry accepts namespaced tool names used by the agent', () => {
  const registry = new ToolRegistry();
  registry.register({
    name: 'task.create',
    description: 'Create a task',
    risk: 'write',
    execute: async () => ({ ok: true }),
  });
  assert.equal(registry.get('task.create')?.name, 'task.create');
});

test('context keeps system instructions while skipping an oversized older message', () => {
  const conversation = {
    id: 'c1', title: 'Context', updatedAt: 1,
    messages: [
      { id: 'system', role: 'system', content: 'Always answer accurately.', createdAt: 1 },
      { id: 'huge', role: 'user', content: 'x'.repeat(5000), createdAt: 2 },
      { id: 'latest', role: 'user', content: 'Keep this request.', createdAt: 3 },
    ],
  };
  const context = buildAgentContext(conversation, [], 100);
  assert.deepEqual(context.messages.map((message) => message.id), ['system', 'latest']);
});

test('stream parser accepts a complete final event without a trailing newline', () => {
  const parsed = parseStreamLines('{"type":"delta","text":"hello"}');
  assert.deepEqual(parsed.events, [{ type: 'delta', text: 'hello' }]);
  assert.equal(parsed.remainder, '');
});

test('execution plans normalize duplicate dependency references', () => {
  const plan = createExecutionPlan([
    { id: 'a', kind: 'context', label: 'Context' },
    { id: 'b', kind: 'response', label: 'Response', dependsOn: ['a', 'a'] },
  ], 1);
  assert.deepEqual(plan.steps[1].dependsOn, ['a']);
});

test('agent policy safely rejects non-object tool input', () => {
  assert.deepEqual(authorizeTool('task.create', null), { allowed: false, reason: 'missing-input' });
});
