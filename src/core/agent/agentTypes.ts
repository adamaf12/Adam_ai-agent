export type AgentIntent = 'chat' | 'web' | 'task' | 'memory' | 'creative';

export type AgentRoute = {
  intent: AgentIntent;
  reason: string;
  confidence: number;
};

const hasEnglishToken = (value: string, terms: string[]) => terms.some((term) => new RegExp(`\\b${term}\\b`, 'i').test(value));
const hasArabicPhrase = (value: string, terms: string[]) => terms.some((term) => value.includes(term));
const route = (intent: AgentIntent, reason: string, confidence: number): AgentRoute => ({ intent, reason, confidence: Math.max(0, Math.min(1, confidence)) });

const signals: Record<Exclude<AgentIntent, 'chat'>, { en: string[]; ar: string[]; reason: string }> = {
  creative: { en: ['image', 'video', 'draw', 'generate', 'design'], ar: ['صورة', 'فيديو', 'ارسم', 'أنشئ', 'انشئ', 'صمم', 'صمّم'], reason: 'The request explicitly asks for creative generation.' },
  memory: { en: ['remember', 'forget', 'memory', 'save this'], ar: ['تذكر', 'تذكّر', 'انس', 'انسى', 'ذاكرة', 'احفظ هذا'], reason: 'The user is asking to manage persistent memory.' },
  task: { en: ['task', 'todo', 'remind', 'schedule', 'deadline', 'finish'], ar: ['مهمة', 'مهام', 'ذكرني', 'تذكير', 'موعد', 'أنجز', 'انجز'], reason: 'The request is action-oriented and related to task management.' },
  web: { en: ['latest', 'today', 'current', 'news', 'weather', 'price', 'recent', 'search', 'who is', 'what happened'], ar: ['اليوم', 'الآن', 'حالي', 'حالية', 'آخر', 'اخر', 'أخبار', 'اخبار', 'سعر', 'ابحث', 'الطقس', 'مؤخرًا', 'مؤخرا'], reason: 'The request depends on current or externally verifiable information.' },
};

export function routePrompt(text: string): AgentRoute {
  const value = text.trim().toLowerCase();
  if (!value) return route('chat', 'Empty input falls back to the conversational route.', 0.5);

  const ranked = (Object.entries(signals) as Array<[Exclude<AgentIntent, 'chat'>, typeof signals[Exclude<AgentIntent, 'chat'>]]>)
    .map(([intent, signal]) => {
      const englishHits = signal.en.filter(term => hasEnglishToken(value, [term])).length;
      const arabicHits = signal.ar.filter(term => hasArabicPhrase(value, [term])).length;
      return { intent, score: englishHits + arabicHits, englishHits, arabicHits, reason: signal.reason };
    })
    .filter(candidate => candidate.score > 0)
    .sort((a, b) => b.score - a.score || b.arabicHits - a.arabicHits);

  const winner = ranked[0];
  if (!winner) return route('chat', 'General conversation or reasoning.', 0.8);

  const confidence = Math.min(0.97, 0.76 + winner.score * 0.07 + (winner.score > (ranked[1]?.score ?? 0) ? 0.05 : 0));
  return route(winner.intent, winner.reason, confidence);
}
