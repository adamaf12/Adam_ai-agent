import type { Message } from '../domain';
import { createAssistantMessage } from '../../features/chat/chatModel';
import { ChatError, type ChatClient, type ChatRequest } from './types';
import { parseStreamLines, type StreamEvent } from './streamParser';
import { classifyChatError, toUserFacingChatError } from './errors';
import { getRetryDelayMs, shouldRetryChatError } from './retry';

const apiBase = (import.meta.env.VITE_ADAM_API_URL ?? '').replace(/\/$/, '');
const wait = (ms: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => { if (signal.aborted) { reject(new DOMException('The request was cancelled.', 'AbortError')); return; } const timer = setTimeout(resolve, ms); signal.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('The request was cancelled.', 'AbortError')); }, { once: true }); });

async function streamRequestOnce(url: string, request: ChatRequest, signal: AbortSignal, onDelta: (text: string) => void) {
  const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/x-ndjson' }, body: JSON.stringify(request), signal });
  if (!response.ok) { let payload: { code?: string; message?: string } = {}; try { payload = await response.json(); } catch {} const userError = toUserFacingChatError({ status: response.status, code: payload.code, message: payload.message }); throw new ChatError(userError.code, userError.message, response.status); }
  if (!response.body) throw new ChatError('NO_STREAM', 'The AI stream is unavailable.');
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let text = ''; let completed = false;
  const consume = (input: string) => { const parsed = parseStreamLines(input); buffer = parsed.remainder; for (const event of parsed.events) { const streamEvent: StreamEvent = event; if (streamEvent.type === 'delta') { text += streamEvent.text; onDelta(text); } else if (streamEvent.type === 'error') throw new ChatError(streamEvent.code, streamEvent.message); else if (streamEvent.type === 'done') completed = true; } };
  while (true) { const { value, done } = await reader.read(); if (done) break; consume(buffer + decoder.decode(value, { stream: true })); }
  consume(buffer + decoder.decode());
  if (buffer.trim() || !completed || !text.trim()) throw new ChatError('INCOMPLETE_STREAM', 'Adam did not receive a usable completion.');
  return createAssistantMessage(text) as Message;
}

async function streamRequest(url: string, request: ChatRequest, signal: AbortSignal, onDelta: (text: string) => void) {
  for (let retryCount = 0; ; retryCount += 1) {
    try { return await streamRequestOnce(url, request, signal, onDelta); }
    catch (error) { const kind = classifyChatError(error); const canRetry = shouldRetryChatError(kind, retryCount) && !(error instanceof ChatError && error.status === undefined && kind === 'unknown'); if (!canRetry) { if (error instanceof ChatError) throw error; const normalized = toUserFacingChatError(error); throw new ChatError(normalized.code, normalized.message); } await wait(getRetryDelayMs(retryCount), signal); }
  }
}

export const httpChatClient: ChatClient = { send: (request, signal, onDelta) => streamRequest(`${apiBase}/api/chat`, request, signal, onDelta) };

export const httpAgentClient: ChatClient = {
  send: async (request, signal, onDelta) => {
    try { return await streamRequest(`${apiBase}/api/agent`, request, signal, onDelta); }
    catch (error) {
      if (signal.aborted) throw error;
      if (error instanceof ChatError && [400, 409].includes(error.status ?? 0)) throw error;
      // Agent is an enhancement over the reliable chat path: if routing/swarm fails,
      // transparently fall back so ordinary questions never end with a blank response.
      return streamRequest(`${apiBase}/api/chat`, request, signal, onDelta);
    }
  },
};
