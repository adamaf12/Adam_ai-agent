import { sanitizePrompt } from './requestGuard';

export type AgentMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export type AgentContext = {
  locale: 'ar' | 'en';
  messages: AgentMessage[];
  userText: string;
  recentUserMessages: string[];
  charBudget: number;
};

const MAX_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 8000;
const MAX_CONTEXT_CHARS = 48000;

export function buildAgentContext(input: {
  locale: 'ar' | 'en';
  userText: string;
  history: unknown[];
}): AgentContext {
  const userText = sanitizePrompt(input.userText).slice(0, MAX_MESSAGE_CHARS);
  const normalized = input.history
    .filter((item): item is AgentMessage => {
      if (!item || typeof item !== 'object') return false;
      const value = item as Partial<AgentMessage>;
      return (value.role === 'user' || value.role === 'assistant' || value.role === 'system') && typeof value.content === 'string';
    })
    .slice(-MAX_MESSAGES)
    .map(message => ({ ...message, content: sanitizePrompt(message.content).slice(0, MAX_MESSAGE_CHARS) }));

  const reservedForUser = userText.length;
  const availableForHistory = Math.max(0, MAX_CONTEXT_CHARS - reservedForUser);
  let used = 0;
  const selected: AgentMessage[] = [];
  const addIfFits = (message: AgentMessage) => {
    if (!message.content || used + message.content.length > availableForHistory) return false;
    used += message.content.length;
    selected.push(message);
    return true;
  };

  // System instructions are highest-value context and must survive history pressure.
  for (const message of normalized.filter(item => item.role === 'system')) addIfFits(message);
  // Fill the remaining budget from newest non-system messages while preserving chronology.
  const recent = normalized.filter(item => item.role !== 'system');
  const recentSelected: AgentMessage[] = [];
  for (const message of [...recent].reverse()) {
    if (!message.content || used + message.content.length > availableForHistory) continue;
    used += message.content.length;
    recentSelected.push(message);
  }
  selected.push(...recentSelected.reverse());

  const messages = selected;
  return {
    locale: input.locale,
    userText,
    messages,
    recentUserMessages: messages.filter(message => message.role === 'user').slice(-8).map(message => message.content),
    charBudget: Math.max(0, MAX_CONTEXT_CHARS - used - reservedForUser),
  };
}
