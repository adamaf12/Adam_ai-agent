import type { Message } from '../domain';
import { createAssistantMessage } from '../../features/chat/chatModel';
import { ChatError, type ChatClient, type ChatRequest } from './types';

export const httpChatClient: ChatClient = {
  async send(request: ChatRequest, signal: AbortSignal, onDelta) {
    const response = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request), signal });
    if (!response.ok) {
      let payload: { code?: string; message?: string } = {};
      try { payload = await response.json(); } catch { /* keep generic */ }
      throw new ChatError(payload.code ?? `HTTP_${response.status}`, payload.message ?? 'The AI service is temporarily unavailable.');
    }
    if (!response.body) throw new ChatError('NO_STREAM', 'The AI stream is unavailable.');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        const event = JSON.parse(line) as { type: string; text?: string; message?: string; code?: string };
        if (event.type === 'delta') { text += event.text ?? ''; onDelta(text); }
        if (event.type === 'error') throw new ChatError(event.code ?? 'AI_ERROR', event.message ?? 'The AI service failed.');
      }
    }
    if (buffer.trim()) {
      const event = JSON.parse(buffer) as { type: string; text?: string; message?: string; code?: string };
      if (event.type === 'delta') { text += event.text ?? ''; onDelta(text); }
      if (event.type === 'error') throw new ChatError(event.code ?? 'AI_ERROR', event.message ?? 'The AI service failed.');
    }
    const message: Message = createAssistantMessage(text);
    return message;
  },
};
