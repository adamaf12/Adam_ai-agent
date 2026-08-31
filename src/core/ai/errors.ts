export type ChatErrorKind = 'auth' | 'billing' | 'rate_limit' | 'server' | 'network' | 'aborted' | 'invalid' | 'unknown';
export interface ChatFailure { status?: number; code?: string; message?: string; name?: string; }
export interface UserFacingChatError { kind: ChatErrorKind; code: string; message: string; retryable: boolean; }

export function classifyChatError(error: unknown): ChatErrorKind {
  const value = (error && typeof error === 'object' ? error : {}) as ChatFailure;
  if (value.name === 'AbortError' || value.code === 'ABORTED') return 'aborted';
  if (value.status === 401 || value.code === 'UNAUTHORIZED' || value.code === 'AI_AUTH' || value.code === 'PROVIDER_AUTH_ERROR') return 'auth';
  if (value.status === 403 || value.code === 'BILLING_REQUIRED' || value.code === 'PAYMENT_REQUIRED') return 'billing';
  if (value.status === 429 || value.code === 'RATE_LIMITED' || value.code === 'AI_RATE_LIMIT' || value.code === 'PROVIDER_RATE_LIMITED') return 'rate_limit';
  if ((typeof value.status === 'number' && value.status >= 500) || ['INCOMPLETE_STREAM','NO_STREAM','AI_PROVIDER','PROVIDER_ERROR'].includes(value.code ?? '')) return 'server';
  if (value.code === 'INVALID_REQUEST' || value.status === 400 || value.status === 422) return 'invalid';
  if (error instanceof TypeError || value.code === 'NETWORK_ERROR') return 'network';
  return 'unknown';
}

export function toUserFacingChatError(error: unknown): UserFacingChatError {
  const value = (error && typeof error === 'object' ? error : {}) as ChatFailure;
  const kind = classifyChatError(error);
  switch (kind) {
    case 'auth': return { kind, code: value.code ?? 'UNAUTHORIZED', message: 'اتصال الذكاء الاصطناعي غير مصادق عليه. تحقق من الإعدادات.', retryable: false };
    case 'billing': return { kind, code: value.code ?? 'BILLING_REQUIRED', message: 'خدمة الذكاء الاصطناعي تحتاج إلى رصيد أو صلاحية إضافية.', retryable: false };
    case 'rate_limit': return { kind, code: value.code ?? 'RATE_LIMITED', message: 'الخدمة مشغولة الآن. سيحاول Adam مرة أخرى تلقائيًا.', retryable: true };
    case 'server': return { kind, code: value.code ?? 'AI_SERVER_ERROR', message: 'انقطع مسار الإجابة. جرّب مرة أخرى؛ سيستخدم Adam محركًا بديلًا عند الحاجة.', retryable: true };
    case 'network': return { kind, code: 'NETWORK_ERROR', message: 'تعذر الوصول إلى خدمة الذكاء الاصطناعي. تحقق من الاتصال وحاول مرة أخرى.', retryable: true };
    case 'aborted': return { kind, code: 'ABORTED', message: 'تم إلغاء الطلب.', retryable: false };
    case 'invalid': return { kind, code: value.code ?? 'INVALID_REQUEST', message: value.message ?? 'لم يتم قبول الطلب.', retryable: false };
    default: return { kind, code: value.code ?? 'AI_ERROR', message: 'لم تصل إجابة صالحة من المحرك. سيجرب Adam مسارًا آخر عند إعادة الإرسال.', retryable: true };
  }
}
