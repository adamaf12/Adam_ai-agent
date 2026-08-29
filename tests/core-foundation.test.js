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
} from '../src/core/agent/executionPlan.ts';
import {
  createVersionedEnvelope,
  migrateEnvelope,
} from '../src/core/storage/envelope.ts';
import {
  parseStreamLines,
} from '../src/core/ai/streamParser.ts';

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
