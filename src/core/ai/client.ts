import type { Message } from '../domain';
import { createAssistantMessage } from '../../features/chat/chatModel';
import { ChatError, type ChatClient, type ChatRequest } from './types';

const apiBase = (import.meta.env.VITE_ADAM_API_URL ?? '').replace(/\/$/, '');

async function streamRequest(url: string, request: ChatRequest, signal: AbortSignal, onDelta: (text: string) => void) {
  const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request), signal });
  if (!response.ok) {
    let payload: { code?: string; message?: string } = {};
    try { payload = await response.json(); } catch { /* preserve status */ }
    throw new ChatError(payload.code ?? `HTTP_${response.status}`, payload.message ?? 'The AI service is temporarily unavailable.');
  }
  if (!response.body) throw new ChatError('NO_STREAM', 'The AI stream is unavailable.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  const consume = (line: string) => {
    if (!line.trim()) return;
    let event: { type: string; text?: string; message?: string; code?: string };
    try { event = JSON.parse(line); } catch { throw new ChatError('INVALID_STREAM', 'Adam received an invalid response stream.'); }
    if (event.type === 'delta') { text += event.text ?? ''; onDelta(text); }
    if (event.type === 'error') throw new ChatError(event.code ?? 'AI_ERROR', event.message ?? 'The AI service failed.');
  };
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    lines.forEach(consume);
  }
  buffer += decoder.decode();
  consume(buffer);
  return createAssistantMessage(text) as Message;
}

export const httpChatClient: ChatClient = {
  send: (request, signal, onDelta) => streamRequest(`${apiBase}/api/chat`, request, signal, onDelta),
};

export const httpAgentClient: ChatClient = {
  send: (request, signal, onDelta) => streamRequest(`${apiBase}/api/agent`, request, signal, onDelta),
};
