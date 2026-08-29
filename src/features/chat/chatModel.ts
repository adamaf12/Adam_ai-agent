import type { Message } from '../../core/domain';
import { createId } from '../../core/storage';
import { normalizeMessage } from '../../core/domain';

export interface ChatEvent { type: 'delta' | 'done' | 'error'; text?: string; message?: string; code?: string; }

export function createUserMessage(content: string): Message {
  return normalizeMessage({ id: createId('msg'), role: 'user', content, createdAt: Date.now() });
}

export function createAssistantMessage(content = ''): Message {
  return { id: createId('msg'), role: 'assistant', content, createdAt: Date.now() };
}

export function parseChatEvent(line: string): ChatEvent | null {
  if (!line.trim()) return null;
  try {
    const event = JSON.parse(line) as ChatEvent;
    if (!event || !['delta', 'done', 'error'].includes(event.type)) return null;
    if (event.type === 'delta' && typeof event.text !== 'string') return null;
    if (event.type === 'error' && typeof event.message !== 'string') return null;
    return event;
  } catch {
    return null;
  }
}
