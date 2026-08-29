export type AgentIntent = 'chat' | 'web' | 'task' | 'memory' | 'creative';

export type AgentRoute = {
  intent: AgentIntent;
  reason: string;
  confidence: number;
};

const hasEnglishToken = (value: string, terms: string[]) => terms.some((term) => new RegExp(`\\b${term}\\b`, 'i').test(value));
const hasArabicPhrase = (value: string, terms: string[]) => terms.some((term) => value.includes(term));

export function routePrompt(text: string): AgentRoute {
  const value = text.trim().toLowerCase();
  if (
    hasEnglishToken(value, ['latest', 'today', 'current', 'news', 'weather', 'price', 'recent', 'search', 'who is', 'what happened']) ||
    hasArabicPhrase(value, ['اليوم', 'الآن', 'حالي', 'حالية', 'آخر', 'اخر', 'أخبار', 'اخبار', 'سعر', 'ابحث', 'الطقس', 'مؤخرًا', 'مؤخرا'])
  ) {
    return { intent: 'web', reason: 'The request depends on current or externally verifiable information.', confidence: 0.88 };
  }
  if (
    hasEnglishToken(value, ['task', 'todo', 'remind', 'schedule', 'deadline', 'finish']) ||
    hasArabicPhrase(value, ['مهمة', 'مهام', 'ذكرني', 'تذكير', 'موعد', 'أنجز', 'انجز'])
  ) {
    return { intent: 'task', reason: 'The request is action-oriented and related to task management.', confidence: 0.86 };
  }
  if (
    hasEnglishToken(value, ['remember', 'forget', 'memory', 'save this']) ||
    hasArabicPhrase(value, ['تذكر', 'تذكّر', 'انس', 'انسى', 'ذاكرة', 'احفظ هذا'])
  ) {
    return { intent: 'memory', reason: 'The user is asking to manage persistent memory.', confidence: 0.9 };
  }
  if (
    hasEnglishToken(value, ['image', 'video', 'draw', 'generate', 'design']) ||
    hasArabicPhrase(value, ['صورة', 'فيديو', 'ارسم', 'أنشئ', 'انشئ', 'صمم', 'صمّم'])
  ) {
    return { intent: 'creative', reason: 'The request is a creative generation request.', confidence: 0.82 };
  }
  return { intent: 'chat', reason: 'General conversation or reasoning.', confidence: 0.8 };
}
