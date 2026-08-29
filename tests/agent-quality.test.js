import test from 'node:test';
import assert from 'node:assert/strict';
import { ToolRegistry } from '../src/core/agent/toolRegistry.ts';
import { buildAgentContext } from '../src/core/agent/context.ts';
import { parseStreamLines } from '../src/core/ai/streamParser.ts';
import { createExecutionPlan } from '../src/core/agent/executionPlan.ts';
import { authorizeTool } from '../src/core/agent/agentPolicy.ts';
import { DEFAULT_AGENT_BUDGET, normalizeAgentBudget, canSpendStep, canSpendToolCall } from '../src/core/agent/agentBudget.ts';
import { retryDecision, isRetryableError } from '../src/core/agent/retryPolicy.ts';
import { calculateConfidence, confidenceLabel, shouldAskForClarification } from '../src/core/agent/confidence.ts';
import { validateToolInput } from '../src/core/agent/toolValidation.ts';
import { rankEvidence, hasSufficientGrounding } from '../src/core/agent/grounding.ts';

test('tool registry accepts namespaced tool names used by the agent', () => {
  const registry = new ToolRegistry();
  registry.register({ name: 'task.create', description: 'Create a task', risk: 'write', execute: async () => ({ ok: true }) });
  assert.equal(registry.get('task.create')?.name, 'task.create');
});

test('context keeps system instructions while skipping an oversized older message', () => {
  const conversation = { id: 'c1', title: 'Context', updatedAt: 1, messages: [
    { id: 'system', role: 'system', content: 'Always answer accurately.', createdAt: 1 },
    { id: 'huge', role: 'user', content: 'x'.repeat(5000), createdAt: 2 },
    { id: 'latest', role: 'user', content: 'Keep this request.', createdAt: 3 },
  ] };
  const context = buildAgentContext(conversation, [], 100);
  assert.deepEqual(context.messages.map((message) => message.id), ['system', 'latest']);
});

test('stream parser accepts a complete final event without a trailing newline', () => {
  const parsed = parseStreamLines('{"type":"delta","text":"hello"}');
  assert.deepEqual(parsed.events, [{ type: 'delta', text: 'hello' }]);
  assert.equal(parsed.remainder, '');
});

test('execution plans normalize duplicate dependency references', () => {
  const plan = createExecutionPlan([{ id: 'a', kind: 'context', label: 'Context' }, { id: 'b', kind: 'response', label: 'Response', dependsOn: ['a', 'a'] }], 1);
  assert.deepEqual(plan.steps[1].dependsOn, ['a']);
});

test('agent policy safely rejects non-object tool input', () => {
  assert.deepEqual(authorizeTool('task.create', null), { allowed: false, reason: 'missing-input' });
});

test('agent budgets clamp unsafe values and enforce limits', () => {
  const budget = normalizeAgentBudget({ maxSteps: 999, maxToolCalls: -4, timeoutMs: 1 });
  assert.equal(budget.maxSteps, 20); assert.equal(budget.maxToolCalls, 0); assert.equal(budget.timeoutMs, 2000);
  assert.equal(canSpendStep(DEFAULT_AGENT_BUDGET.maxSteps - 1, DEFAULT_AGENT_BUDGET), true);
  assert.equal(canSpendStep(DEFAULT_AGENT_BUDGET.maxSteps, DEFAULT_AGENT_BUDGET), false);
  assert.equal(canSpendToolCall(DEFAULT_AGENT_BUDGET.maxToolCalls, DEFAULT_AGENT_BUDGET), false);
});

test('retry policy retries transient failures but never auth/client failures', () => {
  assert.equal(isRetryableError(new Error('request timed out')), true);
  assert.equal(isRetryableError(new Error('503 unavailable')), true);
  assert.equal(isRetryableError(new Error('403 permission denied')), false);
  assert.equal(retryDecision(1, new Error('network timeout')), 'retry');
  assert.equal(retryDecision(3, new Error('network timeout')), 'fail');
});

test('confidence combines evidence and execution quality', () => {
  const score = calculateConfidence({ route: 0.9, evidence: 0.95, execution: 1, consistency: 0.9 });
  assert.equal(score >= 0.9, true); assert.equal(confidenceLabel(score), 'high');
  assert.equal(shouldAskForClarification(0.3, false), true); assert.equal(shouldAskForClarification(0.95, true), true);
});

test('tool validation rejects malformed and unknown input', () => {
  const schema = { required: ['query'], properties: { query: 'string', limit: 'number' }, allowUnknown: false };
  assert.deepEqual(validateToolInput({ query: 'hello', limit: 3 }, schema), { ok: true });
  assert.equal(validateToolInput({ limit: 3 }, schema).ok, false);
  assert.equal(validateToolInput({ query: 3 }, schema).ok, false);
  assert.equal(validateToolInput({ query: 'x', extra: true }, schema).ok, false);
});

test('grounding ranks evidence and requires a meaningful source', () => {
  const ranked = rankEvidence([{ source: 'weak', content: 'low', relevance: 0.2 }, { source: 'strong', content: 'high', relevance: 0.9 }, { source: '', content: 'invalid', relevance: 1 }]);
  assert.equal(ranked[0].source, 'strong'); assert.equal(ranked.length, 2); assert.equal(hasSufficientGrounding(ranked), true);
  assert.equal(hasSufficientGrounding([{ source: 'weak', content: 'low', relevance: 0.1 }]), false);
});
