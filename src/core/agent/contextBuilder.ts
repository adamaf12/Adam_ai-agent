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
  const messages: AgentMessage[] = input.history
    .filter((item): item is AgentMessage => {
      if (!item || typeof item !== 'object') return false;
      const value = item as Partial<AgentMessage>;
      return (value.role === 'user' || value.role === 'assistant' || value.role === 'system') && typeof value.content === 'string';
    })
    .slice(-MAX_MESSAGES)
    .map(message => ({ ...message, content: message.content.trim().slice(0, MAX_MESSAGE_CHARS) }));

  let used = 0;
  const boundedMessages = [...messages].reverse().filter(message => {
    const next = used + message.content.length;
    if (next > MAX_CONTEXT_CHARS) return false;
    used = next;
    return true;
  }).reverse();

  const userText = input.userText.trim().slice(0, MAX_MESSAGE_CHARS);
  return {
    locale: input.locale,
    userText,
    messages: boundedMessages,
    recentUserMessages: boundedMessages.filter(message => message.role === 'user').slice(-8).map(message => message.content),
    charBudget: Math.max(0, MAX_CONTEXT_CHARS - used),
  };
}
