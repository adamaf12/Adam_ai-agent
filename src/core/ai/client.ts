import type { Message } from '../domain';
import { createAssistantMessage } from '../../features/chat/chatModel';
import { ChatError, type ChatClient, type ChatRequest } from './types';
import { parseStreamLines, type StreamEvent } from './streamParser';

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
  let completed = false;

  const consume = (input: string) => {
    const parsed = parseStreamLines(input);
    buffer = parsed.remainder;
    for (const event of parsed.events) {
      const streamEvent: StreamEvent = event;
      if (streamEvent.type === 'delta') {
        text += streamEvent.text;
        onDelta(text);
      } else if (streamEvent.type === 'error') {
        throw new ChatError(streamEvent.code, streamEvent.message);
      } else if (streamEvent.type === 'done') {
        completed = true;
      }
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    consume(buffer + decoder.decode(value, { stream: true }));
  }

  consume(buffer + decoder.decode());
  if (buffer.trim()) throw new ChatError('INCOMPLETE_STREAM', 'Adam received an incomplete response stream.');
  if (!completed) throw new ChatError('INCOMPLETE_STREAM', 'Adam did not receive a completion signal.');
  return createAssistantMessage(text) as Message;
}

export const httpChatClient: ChatClient = {
  send: (request, signal, onDelta) => streamRequest(`${apiBase}/api/chat`, request, signal, onDelta),
};

export const httpAgentClient: ChatClient = {
  send: (request, signal, onDelta) => streamRequest(`${apiBase}/api/agent`, request, signal, onDelta),
};
