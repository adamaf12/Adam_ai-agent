import type { Message } from '../../core/domain';
import { createId } from '../../core/storage';

export interface ChatEvent { type: 'delta' | 'done' | 'error'; text?: string; message?: string; }
export function createUserMessage(content: string): Message { return { id: createId('msg'), role: 'user', content: content.trim(), createdAt: Date.now() }; }
export function createAssistantMessage(content = ''): Message { return { id: createId('msg'), role: 'assistant', content, createdAt: Date.now() }; }
export function parseChatEvent(line: string): ChatEvent | null { if (!line.trim()) return null; try { const event = JSON.parse(line) as ChatEvent; return event.type ? event : null; } catch { return null; } }
