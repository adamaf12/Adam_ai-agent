export type AgentIntent = 'chat' | 'web' | 'task' | 'memory' | 'creative';

export type AgentRoute = {
  intent: AgentIntent;
  reason: string;
  confidence: number;
};

export function routePrompt(text: string): AgentRoute {
  const value = text.trim().toLowerCase();
  if (/\b(latest|today|current|news|weather|price|recent|search|who is|what happened)\b/.test(value) || /\b(اليوم|الآن|حالي|آخر|اخر|أخبار|اخبار|سعر|ابحث|الطقس)\b/.test(value)) {
    return { intent: 'web', reason: 'The request depends on current or externally verifiable information.', confidence: 0.88 };
  }
  if (/\b(task|todo|remind|schedule|deadline|finish)\b/.test(value) || /\b(مهمة|مهام|ذكرني|تذكير|موعد|أنجز)\b/.test(value)) {
    return { intent: 'task', reason: 'The request is action-oriented and related to task management.', confidence: 0.86 };
  }
  if (/\b(remember|forget|memory|save this)\b/.test(value) || /\b(تذكر|انس|ذاكرة|احفظ هذا)\b/.test(value)) {
    return { intent: 'memory', reason: 'The user is asking to manage persistent memory.', confidence: 0.9 };
  }
  if (/\b(image|video|draw|generate|design)\b/.test(value) || /\b(صورة|فيديو|ارسم|أنشئ|صمم)\b/.test(value)) {
    return { intent: 'creative', reason: 'The request is a creative generation request.', confidence: 0.82 };
  }
  return { intent: 'chat', reason: 'General conversation or reasoning.', confidence: 0.8 };
}
