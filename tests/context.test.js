import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAgentContext } from '../src/core/agent/context.ts';

const conversation = {
  id: 'c1',
  title: 'Context',
  updatedAt: 1,
  messages: [
    { id: '1', role: 'user', content: 'first '.repeat(200), createdAt: 1 },
    { id: '2', role: 'assistant', content: 'second', createdAt: 2 },
    { id: '3', role: 'user', content: 'third', createdAt: 3 },
  ],
};

test('context keeps the newest message when older messages exceed the budget', () => {
  const context = buildAgentContext(conversation, [], 80);
  assert.equal(context.messages.at(-1)?.id, '3');
});

test('context skips an oversized memory instead of discarding later useful memories', () => {
  const context = buildAgentContext(conversation, [
    { id: 'large', content: 'x'.repeat(500), category: 'fact', createdAt: 1, updatedAt: 1 },
    { id: 'small', content: 'keep me', category: 'preference', createdAt: 2, updatedAt: 2 },
  ], 256);
  assert.deepEqual(context.memories.map((memory) => memory.id), ['small']);
});
