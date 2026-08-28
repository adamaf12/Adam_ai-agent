export type AgentIntent =
  | 'chat' | 'reasoning' | 'web_search' | 'code' | 'image_generate'
  | 'image_edit' | 'video_generate' | 'task' | 'calendar' | 'email'
  | 'notes' | 'file' | 'unknown';

const patterns: Array<[AgentIntent, RegExp]> = [
  ['image_edit', /\b(edit|modify|change|remove|replace|عدّل|عدل|غيّر|غير|احذف|بدّل|بدل)\b.*\b(image|photo|picture|صورة|تصوير)\b/i],
  ['image_generate', /\b(generate|create|make|draw|image|picture|صورة|اصنع|أنشئ|انشئ|ارسم)\b/i],
  ['video_generate', /\b(generate|create|make|video|clip|فيديو|مقطع|اصنع)\b/i],
  ['web_search', /\b(search|look up|latest|news|today|ابحث|آخر|اخر|الأخبار|الاخبار|اليوم)\b/i],
  ['code', /\b(code|coding|program|debug|bug|javascript|typescript|python|html|css|كود|برمجة|برمج)\b/i],
  ['calendar', /\b(calendar|meeting|appointment|schedule|موعد|اجتماع|تقويم)\b/i],
  ['email', /\b(email|mail|gmail|إيميل|ايميل|بريد)\b/i],
  ['notes', /\b(note|notes|remember|save this|ملاحظة|ملاحظات|تذكر|احفظ)\b/i],
  ['task', /\b(task|todo|remind|reminder|مهمة|مهام|ذكّر|ذكرني|تذكير)\b/i],
  ['reasoning', /\b(analyze|analyse|explain deeply|compare|why|حلل|حلّل|قارن|اشرح بالتفصيل|لماذا)\b/i],
];

export function routeIntent(input: string): AgentIntent {
  const text = input.trim();
  if (!text) return 'unknown';
  // Prefer explicit media commands before generic generation words.
  if (/\b(video|فيديو|مقطع)\b/i.test(text)) return 'video_generate';
  if (/\b(image|photo|picture|صورة)\b/i.test(text) && /\b(edit|modify|عدّل|عدل|غيّر|غير|احذف|بدّل|بدل)\b/i.test(text)) return 'image_edit';
  if (/\b(image|photo|picture|صورة)\b/i.test(text) && /\b(create|generate|make|اصنع|أنشئ|انشئ|ارسم)\b/i.test(text)) return 'image_generate';
  for (const [intent, pattern] of patterns) if (pattern.test(text)) return intent;
  return 'chat';
}

export function needsPlanning(intent: AgentIntent, input: string): boolean {
  const words = input.trim().split(/\s+/).length;
  return words > 35 || intent === 'reasoning' || /\b(then|after that|and then|ثم|بعد ذلك|وبعدها)\b/i.test(input);
}
