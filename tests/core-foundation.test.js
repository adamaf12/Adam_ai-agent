import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createAppEvent,
  createEventBus,
} from '../src/core/events.ts';
import {
  createExecutionPlan,
  canExecuteStep,
  completeExecutionStep,
  startExecutionStep,
  failExecutionStep,
  cancelExecutionStep,
  getExecutionPlanStatus,
} from '../src/core/agent/executionPlan.ts';
import {
  createVersionedEnvelope,
  migrateEnvelope,
} from '../src/core/storage/envelope.ts';
import {
  parseStreamLines,
} from '../src/core/ai/streamParser.ts';
import { classifyChatError, toUserFacingChatError } from '../src/core/ai/errors.ts';
import { getRetryDelayMs, shouldRetryChatError } from '../src/core/ai/retry.ts';
import { normalizeMessage, isMessage } from '../src/core/domain.ts';
import { createAssistantMessage, createUserMessage } from '../src/features/chat/chatModel.ts';
import { normalizeToolInput } from '../src/core/agent/toolExecutor.ts';

test('event bus publishes typed events to subscribers and supports unsubscribe', () => {
  const bus = createEventBus();
  const received = [];
  const unsubscribe = bus.subscribe('chat.message.created', (event) => received.push(event));

  bus.publish(createAppEvent('chat.message.created', { messageId: 'm1' }));
  unsubscribe();
  bus.publish(createAppEvent('chat.message.created', { messageId: 'm2' }));

  assert.equal(received.length, 1);
  assert.equal(received[0].payload.messageId, 'm1');
});

test('execution plan only advances when dependencies are complete', () => {
  const plan = createExecutionPlan([
    { id: 'context', kind: 'context', label: 'Build context' },
    { id: 'answer', kind: 'response', label: 'Write answer', dependsOn: ['context'] },
  ]);

  assert.deepEqual(canExecuteStep(plan, 'context'), { ok: true });
  assert.deepEqual(canExecuteStep(plan, 'answer'), { ok: false, reason: 'DEPENDENCIES_PENDING' });

  const next = completeExecutionStep(plan, 'context');
  assert.deepEqual(canExecuteStep(next, 'answer'), { ok: true });
});

test('execution plan supports explicit running, failed, cancelled and terminal states', () => {
  const plan = createExecutionPlan([{ id: 'work', kind: 'tool', label: 'Work' }]);
  const running = startExecutionStep(plan, 'work');
  assert.equal(running.steps[0].status, 'running');
  assert.throws(() => startExecutionStep(running, 'work'));
  const failed = failExecutionStep(running, 'work');
  assert.equal(failed.steps[0].status, 'failed');
  assert.deepEqual(getExecutionPlanStatus(failed), 'failed');

  const cancelled = cancelExecutionStep(createExecutionPlan([{ id: 'work', kind: 'tool', label: 'Work' }]), 'work');
  assert.equal(cancelled.steps[0].status, 'cancelled');
  assert.equal(getExecutionPlanStatus(cancelled), 'cancelled');
});

test('storage envelopes migrate older versions without losing payload', () => {
  const v1 = createVersionedEnvelope(1, { agentName: 'Adam', language: 'ar' });
  const migrated = migrateEnvelope(v1, 2, (version, payload) =>
    version === 1 ? { ...payload, theme: 'system' } : payload,
  );

  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.payload, { agentName: 'Adam', language: 'ar', theme: 'system' });
});

test('stream parser handles fragmented JSONL and reports terminal events', () => {
  const parsed = parseStreamLines([
    '{"type":"delta","text":"Hel',
    'lo"}\n{"type":"done"}\n',
  ].join(''));

  assert.deepEqual(parsed.events, [
    { type: 'delta', text: 'Hello' },
    { type: 'done' },
  ]);
  assert.equal(parsed.remainder, '');
});

test('chat errors are classified without retrying billing or auth failures', () => {
  assert.equal(classifyChatError({ status: 403, code: 'BILLING_REQUIRED' }), 'billing');
  assert.equal(classifyChatError({ status: 401 }), 'auth');
  assert.equal(classifyChatError({ status: 429 }), 'rate_limit');
  assert.equal(classifyChatError({ status: 503 }), 'server');
  assert.equal(classifyChatError(new TypeError('Failed to fetch')), 'network');
  assert.equal(shouldRetryChatError('billing', 0), false);
  assert.equal(shouldRetryChatError('auth', 0), false);
  assert.equal(shouldRetryChatError('rate_limit', 0), true);
  assert.equal(shouldRetryChatError('server', 1), true);
  assert.equal(getRetryDelayMs(0), 250);
  assert.equal(getRetryDelayMs(2), 1000);
  assert.match(toUserFacingChatError({ status: 403, code: 'BILLING_REQUIRED' }).message, /billing|credit|payment/i);
});

test('message factories reject empty user input and produce canonical assistant messages', () => {
  assert.throws(() => createUserMessage('   '));
  const assistant = createAssistantMessage('Hello');
  assert.equal(isMessage(assistant), true);
  assert.equal(assistant.role, 'assistant');
});

test('tool input normalization rejects malformed payloads and bounds text', () => {
  assert.throws(() => normalizeToolInput('task.create', {}));
  const task = normalizeToolInput('task.create', { title: '  Buy milk  ', notes: '  today  ', priority: 'high' });
  assert.deepEqual(task, { title: 'Buy milk', notes: 'today', priority: 'high' });
  assert.throws(() => normalizeToolInput('memory.remember', { content: 'x'.repeat(10001) }));
});

test('message normalization creates safe canonical messages and rejects malformed values', () => {
  const message = normalizeMessage({ role: 'user', content: '  Hello Adam  ', createdAt: 10 });
  assert.equal(message.role, 'user');
  assert.equal(message.content, 'Hello Adam');
  assert.equal(typeof message.id, 'string');
  assert.equal(isMessage(message), true);
  assert.equal(isMessage({ role: 'user', content: '', createdAt: 'bad' }), false);
});
