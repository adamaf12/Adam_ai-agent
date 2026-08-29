import type { ChatErrorKind } from './errors';

export const MAX_CHAT_RETRIES = 2;

export function shouldRetryChatError(kind: ChatErrorKind, retryCount: number): boolean {
  if (retryCount >= MAX_CHAT_RETRIES) return false;
  return kind === 'rate_limit' || kind === 'server' || kind === 'network';
}

export function getRetryDelayMs(retryCount: number): number {
  const safeCount = Math.max(0, Math.min(retryCount, MAX_CHAT_RETRIES));
  return 250 * (2 ** safeCount);
}
