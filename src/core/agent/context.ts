import type { ChatConversation, Memory, Message } from '../domain';

export type AgentContext = {
  messages: Message[];
  memories: Memory[];
  tokenBudget: number;
};

const DEFAULT_TOKEN_BUDGET = 6000;
const CHARS_PER_TOKEN = 4;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function buildAgentContext(
  conversation: ChatConversation,
  memories: Memory[] = [],
  tokenBudget = DEFAULT_TOKEN_BUDGET,
): AgentContext {
  const budget = Math.max(256, Math.floor(tokenBudget));
  const selected: Message[] = [];
  let used = 0;

  for (let index = conversation.messages.length - 1; index >= 0; index -= 1) {
    const message = conversation.messages[index];
    const cost = estimateTokens(message.content) + 8;
    if (selected.length > 0 && used + cost > budget) break;
    selected.unshift(message);
    used += cost;
  }

  const memoryBudget = Math.max(64, Math.floor(budget * 0.2));
  const selectedMemories: Memory[] = [];
  let memoryUsed = 0;
  for (const memory of memories) {
    const cost = estimateTokens(memory.content) + 6;
    if (memoryUsed + cost > memoryBudget) break;
    selectedMemories.push(memory);
    memoryUsed += cost;
  }

  return { messages: selected, memories: selectedMemories, tokenBudget: budget };
}
