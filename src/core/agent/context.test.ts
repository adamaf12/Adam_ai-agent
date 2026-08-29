import { describe, expect, it } from 'vitest';
import { buildAgentContext } from './context';
import type { ChatConversation } from '../domain';

const conversation: ChatConversation = {
  id: 'c1', title: 'Test', updatedAt: 1,
  messages: [
    { id: '1', role: 'user', content: 'first '.repeat(200), createdAt: 1 },
    { id: '2', role: 'assistant', content: 'second', createdAt: 2 },
    { id: '3', role: 'user', content: 'third', createdAt: 3 },
  ],
};

describe('buildAgentContext', () => {
  it('keeps the newest messages within the budget', () => {
    const context = buildAgentContext(conversation, [], 80);
    expect(context.messages.at(-1)?.id).toBe('3');
    expect(context.messages).not.toHaveLength(0);
  });

  it('caps memory context separately', () => {
    const context = buildAgentContext(conversation, [
      { id: 'm1', content: 'a'.repeat(200), category: 'fact', createdAt: 1, updatedAt: 1 },
      { id: 'm2', content: 'short', category: 'preference', createdAt: 2, updatedAt: 2 },
    ], 256);
    expect(context.memories.length).toBeLessThanOrEqual(2);
    expect(context.tokenBudget).toBe(256);
  });
});
