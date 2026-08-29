export type RetryReason = 'timeout' | 'network' | 'rate_limit' | 'server' | 'client' | 'auth' | 'unknown';
export type RetryDecision = 'retry' | 'fail';

export interface RetryPolicy { maxAttempts: number; baseDelayMs: number; maxDelayMs: number; }
export const DEFAULT_RETRY_POLICY: Readonly<RetryPolicy> = Object.freeze({ maxAttempts: 3, baseDelayMs: 350, maxDelayMs: 4_000 });

export function classifyRetryReason(error: unknown): RetryReason {
  const message = (error instanceof Error ? error.message : String(error ?? '')).toLowerCase();
  if (/timeout|timed out/.test(message)) return 'timeout';
  if (/429|rate limit/.test(message)) return 'rate_limit';
  if (/\b(500|502|503|504)\b|temporar|unavailable/.test(message)) return 'server';
  if (/network|fetch|econnreset|eai_again|connection/.test(message)) return 'network';
  if (/\b(401|403)\b/.test(message)) return 'auth';
  if (/\b(400|404|422)\b/.test(message)) return 'client';
  return 'unknown';
}

export function isRetryableError(error: unknown): boolean {
  const reason = classifyRetryReason(error);
  return reason === 'timeout' || reason === 'network' || reason === 'rate_limit' || reason === 'server';
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
