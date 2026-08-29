export type ChatErrorKind = 'auth' | 'billing' | 'rate_limit' | 'server' | 'network' | 'aborted' | 'invalid' | 'unknown';

export interface ChatFailure {
  status?: number;
  code?: string;
  message?: string;
  name?: string;
}

export interface UserFacingChatError {
  kind: ChatErrorKind;
  code: string;
  message: string;
  retryable: boolean;
}

export function classifyChatError(error: unknown): ChatErrorKind {
  const value = (error && typeof error === 'object' ? error : {}) as ChatFailure;
  if (value.name === 'AbortError' || value.code === 'ABORTED') return 'aborted';
  if (value.status === 401 || value.code === 'UNAUTHORIZED') return 'auth';
  if (value.status === 403 || value.code === 'BILLING_REQUIRED' || value.code === 'PAYMENT_REQUIRED') return 'billing';
  if (value.status === 429 || value.code === 'RATE_LIMITED') return 'rate_limit';
  if (typeof value.status === 'number' && value.status >= 500) return 'server';
  if (value.code === 'INVALID_REQUEST' || value.status === 400 || value.status === 422) return 'invalid';
  if (error instanceof TypeError || value.code === 'NETWORK_ERROR') return 'network';
  return 'unknown';
}

export function toUserFacingChatError(error: unknown): UserFacingChatError {
  const value = (error && typeof error === 'object' ? error : {}) as ChatFailure;
  const kind = classifyChatError(error);
  switch (kind) {
    case 'auth': return { kind, code: value.code ?? 'UNAUTHORIZED', message: 'Your AI connection is not authorized. Check the configured credentials.', retryable: false };
    case 'billing': return { kind, code: value.code ?? 'BILLING_REQUIRED', message: 'AI service billing or credits are required before Adam can send this request.', retryable: false };
    case 'rate_limit': return { kind, code: value.code ?? 'RATE_LIMITED', message: 'The AI service is busy right now. Adam will retry shortly.', retryable: true };
    case 'server': return { kind, code: value.code ?? 'AI_SERVER_ERROR', message: 'The AI service is temporarily unavailable. Please try again.', retryable: true };
    case 'network': return { kind, code: 'NETWORK_ERROR', message: 'Adam could not reach the AI service. Check your connection and try again.', retryable: true };
    case 'aborted': return { kind, code: 'ABORTED', message: 'The request was cancelled.', retryable: false };
    case 'invalid': return { kind, code: value.code ?? 'INVALID_REQUEST', message: value.message ?? 'The request could not be accepted by the AI service.', retryable: false };
    default: return { kind, code: value.code ?? 'AI_ERROR', message: value.message ?? 'Adam could not complete the AI request.', retryable: false };
  }
}
