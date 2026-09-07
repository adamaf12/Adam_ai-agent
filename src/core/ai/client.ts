import type { Message } from '../domain';
import { createAssistantMessage } from '../../features/chat/chatModel';
import { ChatError, type ChatClient, type ChatRequest } from './types';
import { parseStreamLines, type StreamEvent } from './streamParser';
import { classifyChatError, toUserFacingChatError } from './errors';
import { getRetryDelayMs, shouldRetryChatError } from './retry';
import { generateLocalFallbackResponse } from './localFallback';

function getResolvedApiBase(): string {
  if (typeof window === 'undefined') return '';
  
  // 1. Custom user-specified endpoint in settings/storage
  const customUrl = localStorage.getItem('adam_custom_api_url')?.trim();
  if (customUrl) return customUrl.replace(/\/$/, '');

  // 2. Environment variable
  const envUrl = (import.meta.env.VITE_ADAM_API_URL ?? '').trim();
  if (envUrl) return envUrl.replace(/\/$/, '');

  // 3. Detect Native Mobile APK / WebView (Capacitor, Cordova, Ionic, file://, or localhost in standalone APK)
  const isNativeApk =
    /^(capacitor|ionic|file|content):$/i.test(window.location.protocol) ||
    (window.location.hostname === 'localhost' && window.location.port !== '3000') ||
    window.location.protocol === 'file:';

  if (isNativeApk) {
    // Production Cloud Run deployment endpoint for APKs
    return 'https://ais-pre-npzesm6asflyef75cic2a6-263913895850.asia-southeast1.run.app';
  }

  // 4. Default browser origin
  return '';
}

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('The request was cancelled.', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('The request was cancelled.', 'AbortError'));
      },
      { once: true }
    );
  });

async function streamRequestOnce(
  url: string,
  request: ChatRequest,
  signal: AbortSignal,
  onDelta: (text: string) => void
) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/x-ndjson' },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    let payload: { code?: string; message?: string } = {};
    try {
      payload = await response.json();
    } catch {}
    const userError = toUserFacingChatError({
      status: response.status,
      code: payload.code,
      message: payload.message,
    });
    throw new ChatError(userError.code, userError.message, response.status);
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
  if (buffer.trim() || !completed || !text.trim()) {
    throw new ChatError('INCOMPLETE_STREAM', 'Adam did not receive a usable completion.');
  }

  return createAssistantMessage(text) as Message;
}

async function streamRequest(
  path: string,
  request: ChatRequest,
  signal: AbortSignal,
  onDelta: (text: string) => void
) {
  const apiBase = getResolvedApiBase();
  const primaryUrl = `${apiBase}${path}`;

  for (let retryCount = 0; retryCount < 2; retryCount += 1) {
    try {
      return await streamRequestOnce(primaryUrl, request, signal, onDelta);
    } catch (error) {
      if (signal.aborted) throw error;
      const kind = classifyChatError(error);
      const canRetry =
        shouldRetryChatError(kind, retryCount) &&
        !(error instanceof ChatError && error.status === undefined && kind === 'unknown');

      if (!canRetry) {
        // If network failed in APK / offline mode, gracefully provide intelligent local fallback
        if (kind === 'network' || kind === 'server' || error instanceof TypeError) {
          const userPrompt =
            request.messages[request.messages.length - 1]?.content || '';
          const fallback = generateLocalFallbackResponse({
            prompt: userPrompt,
            language: request.language,
            agentName: request.agentName || 'Adam',
            messages: request.messages,
          });

          // Simulate brief natural streaming
          for (let i = 1; i <= fallback.length; i += 6) {
            if (signal.aborted) break;
            onDelta(fallback.slice(0, i));
            await new Promise((r) => setTimeout(r, 15));
          }
          onDelta(fallback);
          return createAssistantMessage(fallback) as Message;
        }

        if (error instanceof ChatError) throw error;
        const normalized = toUserFacingChatError(error);
        throw new ChatError(normalized.code, normalized.message);
      }

      await wait(getRetryDelayMs(retryCount), signal);
    }
  }

  // Final fallback
  const userPrompt = request.messages[request.messages.length - 1]?.content || '';
  const fallback = generateLocalFallbackResponse({
    prompt: userPrompt,
    language: request.language,
    agentName: request.agentName || 'Adam',
    messages: request.messages,
  });
  onDelta(fallback);
  return createAssistantMessage(fallback) as Message;
}

export const httpChatClient: ChatClient = {
  send: (request, signal, onDelta) => streamRequest('/api/chat', request, signal, onDelta),
};

export const httpAgentClient: ChatClient = {
  send: async (request, signal, onDelta) => {
    try {
      return await streamRequest('/api/agent', request, signal, onDelta);
    } catch (error) {
      if (signal.aborted) throw error;
      if (error instanceof ChatError && [400, 409].includes(error.status ?? 0)) throw error;
      return streamRequest('/api/chat', request, signal, onDelta);
    }
  },
};

