import type { ChatConversation, Memory, Message } from '../domain';

export type AgentContext = {
  messages: Message[];
  memories: Memory[];
  tokenBudget: number;
};

const DEFAULT_TOKEN_BUDGET = 6000;
const CHARS_PER_TOKEN = 4;
const MESSAGE_OVERHEAD = 8;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function messageCost(message: Message): number {
  return estimateTokens(message.content) + MESSAGE_OVERHEAD;
}

export function buildAgentContext(
  conversation: ChatConversation,
  memories: Memory[] = [],
  tokenBudget = DEFAULT_TOKEN_BUDGET,
): AgentContext {
  const budget = Math.max(256, Math.floor(tokenBudget));
  const selected = new Set<string>();
  let used = 0;

  // System instructions are the least disposable context: keep them before
  // spending the remaining budget on conversational history.
  for (const message of conversation.messages) {
    if (message.role !== 'system' || selected.has(message.id)) continue;
    const cost = messageCost(message);
    if (used + cost > budget) continue;
    selected.add(message.id);
    used += cost;
  }

  // Walk newest-first, but skip an individual oversized message instead of
  // allowing it to hide every useful message that came before it.
  for (let index = conversation.messages.length - 1; index >= 0; index -= 1) {
    const message = conversation.messages[index];
    if (message.role === 'system' || selected.has(message.id)) continue;
    const cost = messageCost(message);
    if (used + cost > budget) continue;
    selected.add(message.id);
    used += cost;
  }

  const selectedMessages = conversation.messages.filter((message) => selected.has(message.id));

  const memoryBudget = Math.max(64, Math.floor(budget * 0.2));
  const selectedMemories: Memory[] = [];
  let memoryUsed = 0;
  for (const memory of memories) {
    const cost = estimateTokens(memory.content) + 6;
    if (memoryUsed + cost > memoryBudget) continue;
    selectedMemories.push(memory);
    memoryUsed += cost;
  }

  return { messages: selectedMessages, memories: selectedMemories, tokenBudget: budget };
}
