import type { Message } from '../domain';
import { createAssistantMessage } from '../../features/chat/chatModel';
import { ChatError, type ChatClient, type ChatRequest } from './types';
import { parseStreamLines, type StreamEvent } from './streamParser';
import { classifyChatError, toUserFacingChatError } from './errors';
import { getRetryDelayMs, shouldRetryChatError } from './retry';
import { generateLocalFallbackResponse } from './localFallback';
import {
  hasDirectClientAi,
  getClientGeminiApiKey,
  getClientHuggingFaceToken,
  executeDirectGemini,
  executeDirectHuggingFace,
} from './directAiClient';

function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  if (cap?.isNativePlatform?.() || cap?.getPlatform?.() === 'android') return true;
  const origin = window.location.origin || '';
  return origin === 'https://localhost' || origin.startsWith('capacitor://') || origin.startsWith('ionic://');
}

function getResolvedApiBase(): string {
  if (typeof window === 'undefined') return '';

  // Explicit endpoint remains supported for self-hosted deployments.
  const customUrl = localStorage.getItem('adam_custom_api_url')?.trim();
  if (customUrl && /^https?:\/\//i.test(customUrl)) {
    const isLegacyCloudRun = /\.run\.app\/?$/i.test(customUrl);
    if (!(isNativeApp() && isLegacyCloudRun)) return customUrl.replace(/\/$/, '');
    localStorage.removeItem('adam_custom_api_url');
  }

  // Build-time endpoint.
  const envUrl = (import.meta.env.VITE_ADAM_API_URL ?? '').trim();
  if (envUrl && /^https?:\/\//i.test(envUrl)) return envUrl.replace(/\/$/, '');

  // IMPORTANT: Capacitor APKs do not have the Express server running at
  // https://localhost. Use the same production API as the working browser.
  if (isNativeApp()) return 'https://adam-ai-agent.vercel.app';

  // Browser deployment is same-origin.
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
  const requestController = new AbortController();
  let startupTimedOut = false;
  const abortFromCaller = () => requestController.abort();
  signal.addEventListener('abort', abortFromCaller, { once: true });

  const startupTimeoutId = setTimeout(() => {
    startupTimedOut = true;
    requestController.abort();
  }, 55_000);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/x-ndjson' },
      body: JSON.stringify(request),
      signal: requestController.signal,
    });
  } catch (error) {
    if (startupTimedOut && !signal.aborted) {
      throw new ChatError('REQUEST_TIMEOUT', 'The AI service took too long to start responding.');
    }
    throw error;
  } finally {
    clearTimeout(startupTimeoutId);
  }

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
    signal.removeEventListener('abort', abortFromCaller);
    throw new ChatError(userError.code, userError.message, response.status);
  }

  if (!response.body) {
    signal.removeEventListener('abort', abortFromCaller);
    throw new ChatError('NO_STREAM', 'The AI stream is unavailable.');
  }

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

  const readWithTimeout = async () => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        reader.read(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reject(new ChatError('STREAM_TIMEOUT', 'The AI stream stopped responding.'));
          }, 35_000);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  try {
    while (true) {
      const { value, done } = await readWithTimeout();
      if (done) break;
      consume(buffer + decoder.decode(value, { stream: true }));
      if (completed) break;
    }

    consume(buffer + decoder.decode());
    if (buffer.trim() || !completed || !text.trim()) {
      throw new ChatError('INCOMPLETE_STREAM', 'Adam did not receive a usable completion.');
    }

    return createAssistantMessage(text) as Message;
  } finally {
    signal.removeEventListener('abort', abortFromCaller);
    try { reader.releaseLock(); } catch {}
  }
}

async function streamRequest(
  path: string,
  request: ChatRequest,
  signal: AbortSignal,
  onDelta: (text: string) => void
): Promise<Message> {
  const userPrompt = request.messages[request.messages.length - 1]?.content || '';

  // 1. Direct Client AI (Gemini or Hugging Face)
  if (hasDirectClientAi()) {
    try {
      if (getClientGeminiApiKey()) {
        const text = await executeDirectGemini({
          prompt: userPrompt,
          history: request.messages.slice(0, -1),
          language: request.language,
          agentName: request.agentName || 'Adam',
          signal,
          onDelta,
        });
        return createAssistantMessage(text) as Message;
      }

      if (getClientHuggingFaceToken()) {
        const text = await executeDirectHuggingFace({
          prompt: userPrompt,
          history: request.messages.slice(0, -1),
          language: request.language,
          agentName: request.agentName || 'Adam',
          signal,
          onDelta,
        });
        return createAssistantMessage(text) as Message;
      }
    } catch (directAiErr) {
      console.warn('[Adam Client] Direct AI failed, attempting server or fallback:', directAiErr);
    }
  }

  // 2. HTTP Server Endpoint
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
        break;
      }

      await wait(getRetryDelayMs(retryCount), signal);
    }
  }

  // 3. Intelligent Local Cognitive Fallback
  const fallback = generateLocalFallbackResponse({
    prompt: userPrompt,
    language: request.language,
    agentName: request.agentName || 'Adam',
    messages: request.messages,
  });

  // Brief natural streaming effect
  for (let i = 1; i <= fallback.length; i += 8) {
    if (signal.aborted) break;
    onDelta(fallback.slice(0, i));
    await new Promise((r) => setTimeout(r, 12));
  }
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

