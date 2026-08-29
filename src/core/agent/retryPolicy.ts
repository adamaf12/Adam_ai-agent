export type RetryDecision = 'retry' | 'fail';

export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export const DEFAULT_RETRY_POLICY: Readonly<RetryPolicy> = Object.freeze({
  maxAttempts: 3,
  baseDelayMs: 350,
  maxDelayMs: 4_000,
});

export function isRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalized = message.toLowerCase();
  if (/(^|\b)(400|401|403|404)(\b|$)/.test(normalized)) return false;
  return /timeout|timed out|network|fetch|econnreset|eai_again|429|rate limit|temporar|unavailable|503|502|504/i.test(message);
}

export function retryDecision(attempt: number, error: unknown, policy: RetryPolicy = DEFAULT_RETRY_POLICY): RetryDecision {
  if (attempt < 1 || attempt >= policy.maxAttempts) return 'fail';
  return isRetryableError(error) ? 'retry' : 'fail';
}

export function retryDelayMs(attempt: number, policy: RetryPolicy = DEFAULT_RETRY_POLICY): number {
  const safeAttempt = Math.max(1, Math.floor(attempt));
  const exponential = policy.baseDelayMs * (2 ** (safeAttempt - 1));
  const jitter = Math.floor(Math.random() * Math.max(1, policy.baseDelayMs));
  return Math.min(policy.maxDelayMs, exponential + jitter);
}
