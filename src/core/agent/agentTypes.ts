export type AgentIntent = 'chat' | 'web' | 'task' | 'memory' | 'creative';

export type AgentRoute = {
  intent: AgentIntent;
  reason: string;
  confidence: number;
};

const hasEnglishToken = (value: string, terms: string[]) => terms.some((term) => new RegExp(`\\b${term}\\b`, 'i').test(value));
const hasArabicPhrase = (value: string, terms: string[]) => terms.some((term) => value.includes(term));
const route = (intent: AgentIntent, reason: string, confidence: number): AgentRoute => ({ intent, reason, confidence: Math.max(0, Math.min(1, confidence)) });

export function routePrompt(text: string): AgentRoute {
  const value = text.trim().toLowerCase();
  if (!value) return route('chat', 'Empty input falls back to the conversational route.', 0.5);
  if (hasEnglishToken(value, ['image', 'video', 'draw', 'generate', 'design']) || hasArabicPhrase(value, ['صورة', 'فيديو', 'ارسم', 'أنشئ', 'انشئ', 'صمم', 'صمّم'])) return route('creative', 'The request explicitly asks for creative generation.', 0.92);
  if (hasEnglishToken(value, ['remember', 'forget', 'memory', 'save this']) || hasArabicPhrase(value, ['تذكر', 'تذكّر', 'انس', 'انسى', 'ذاكرة', 'احفظ هذا'])) return route('memory', 'The user is asking to manage persistent memory.', 0.9);
  if (hasEnglishToken(value, ['task', 'todo', 'remind', 'schedule', 'deadline', 'finish']) || hasArabicPhrase(value, ['مهمة', 'مهام', 'ذكرني', 'تذكير', 'موعد', 'أنجز', 'انجز'])) return route('task', 'The request is action-oriented and related to task management.', 0.86);
  if (hasEnglishToken(value, ['latest', 'today', 'current', 'news', 'weather', 'price', 'recent', 'search', 'who is', 'what happened']) || hasArabicPhrase(value, ['اليوم', 'الآن', 'حالي', 'حالية', 'آخر', 'اخر', 'أخبار', 'اخبار', 'سعر', 'ابحث', 'الطقس', 'مؤخرًا', 'مؤخرا'])) return route('web', 'The request depends on current or externally verifiable information.', 0.88);
  return route('chat', 'General conversation or reasoning.', 0.8);
}
