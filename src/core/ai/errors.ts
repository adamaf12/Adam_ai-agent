export type ChatErrorKind = 'config' | 'auth' | 'billing' | 'rate_limit' | 'server' | 'timeout' | 'network' | 'aborted' | 'invalid' | 'unknown';
export interface ChatFailure { status?: number; code?: string; message?: string; name?: string; }
export interface UserFacingChatError { kind: ChatErrorKind; code: string; message: string; retryable: boolean; }

export function classifyChatError(error: unknown): ChatErrorKind {
  const value = (error && typeof error === 'object' ? error : {}) as ChatFailure;
  if (value.name === 'AbortError' || value.code === 'ABORTED') return 'aborted';
  if (value.code === 'REQUEST_TIMEOUT' || value.code === 'STREAM_TIMEOUT' || /timeout|timed out/i.test(value.message ?? '')) return 'timeout';
  if (value.code === 'AI_NOT_CONFIGURED' || value.code === 'SERVER_BOOT_ERROR') return 'config';
  if (value.status === 401 || value.code === 'UNAUTHORIZED' || value.code === 'AI_AUTH' || value.code === 'PROVIDER_AUTH_ERROR') return 'auth';
  if (value.status === 403 || value.code === 'BILLING_REQUIRED' || value.code === 'PAYMENT_REQUIRED') return 'billing';
  if (value.status === 429 || value.code === 'RATE_LIMITED' || value.code === 'AI_RATE_LIMIT' || value.code === 'PROVIDER_RATE_LIMITED') return 'rate_limit';
  if ((typeof value.status === 'number' && value.status >= 500) || ['INCOMPLETE_STREAM','NO_STREAM','AI_PROVIDER','PROVIDER_ERROR'].includes(value.code ?? '')) return 'server';
  if (value.code === 'INVALID_REQUEST' || value.status === 400 || value.status === 422) return 'invalid';
  if (error instanceof TypeError || value.code === 'NETWORK_ERROR') return 'network';
  return 'unknown';
}

export function toUserFacingChatError(error: unknown, lang: 'ar' | 'en' = 'ar'): UserFacingChatError {
  const value = (error && typeof error === 'object' ? error : {}) as ChatFailure;
  const kind = classifyChatError(error);
  const isAr = lang === 'ar';

  switch (kind) {
    case 'config':
      return {
        kind,
        code: value.code ?? 'AI_NOT_CONFIGURED',
        message: isAr
          ? 'محرك الذكاء الاصطناعي غير مهيأ في خادم الإنتاج. يجب ضبط GEMINI_API_KEY على Vercel أو المتغيرات البيئية.'
          : 'AI engine is not configured on production server. Please configure GEMINI_API_KEY.',
        retryable: false,
      };
    case 'auth':
      return {
        kind,
        code: value.code ?? 'UNAUTHORIZED',
        message: isAr
          ? 'اتصال الذكاء الاصطناعي غير مصادق عليه. جاري التبديل للمحرك الاحتياطي التلقائي.'
          : 'AI service authorization expired or invalid. Switching to fallback provider.',
        retryable: true,
      };
    case 'billing':
      return {
        kind,
        code: value.code ?? 'BILLING_REQUIRED',
        message: isAr
          ? 'تعذر إتمام العملية بسبب متطلبات الفوترة أو نفاد الرصيد/الدفع. جاري التبديل للمسار المجاني التلقائي.'
          : 'Billing or credit limit reached on upstream provider. Switching to complimentary neural model.',
        retryable: true,
      };
    case 'rate_limit':
      return {
        kind,
        code: value.code ?? 'RATE_LIMITED',
        message: isAr
          ? 'الخدمة مشغولة الآن بسبب تجاوز الحد المسموح. يرجى الانتظار ثوانٍ معدودة قبل إعادة المحاولة.'
          : 'Service rate limit reached. Please wait a few moments before retrying.',
        retryable: true,
      };
    case 'server':
      return {
        kind,
        code: value.code ?? 'AI_SERVER_ERROR',
        message: isAr
          ? 'حدث خطأ مؤقت في خادم ADEM أثناء معالجة الطلب. يمكنك النقر على إعادة المحاولة.'
          : 'A temporary error occurred on the ADEM server. Click retry to run again.',
        retryable: true,
      };
    case 'timeout':
      return {
        kind,
        code: value.code ?? 'REQUEST_TIMEOUT',
        message: isAr
          ? 'انتهت مهلة انتظار استجابة النموذج (Timeout). يمكنك إعادة المحاولة فورياً.'
          : 'The request timed out while waiting for model response. Click retry to proceed.',
        retryable: true,
      };
    case 'network':
      return {
        kind,
        code: 'NETWORK_ERROR',
        message: isAr
          ? 'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت ثم أعد المحاولة.'
          : 'Could not connect to server. Check your network connection and retry.',
        retryable: true,
      };
    case 'aborted':
      return {
        kind,
        code: 'ABORTED',
        message: isAr ? 'تم إلغاء الطلب بناءً على رغبتك.' : 'Request was cancelled.',
        retryable: false,
      };
    case 'invalid':
      return {
        kind,
        code: value.code ?? 'INVALID_REQUEST',
        message: value.message ?? (isAr ? 'الطلب غير صالح أو لم يتم قبوله.' : 'Invalid request parameters.'),
        retryable: false,
      };
    default:
      return {
        kind,
        code: value.code ?? 'AI_ERROR',
        message: isAr
          ? 'لم تصل إجابة صالحة من المحرك. سيتم تجربة مسار بديل عند إعادة الإرسال.'
          : 'No valid response received from engine. Retry will attempt a fallback route.',
        retryable: true,
      };
  }
}
