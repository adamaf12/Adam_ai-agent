export type RequestTaskType =
  | 'explain'
  | 'solve'
  | 'create'
  | 'modify'
  | 'debug'
  | 'compare'
  | 'research'
  | 'execute'
  | 'continue'
  | 'plan'
  | 'unknown';

export interface RequestContract {
  taskType: RequestTaskType;
  goal: string;
  explicitConstraints: string[];
  protectedItems: string[];
  needsFreshKnowledge: boolean;
  needsExecution: boolean;
  needsClarification: boolean;
  continuation: boolean;
}

const TYPE_PATTERNS: Array<[RequestTaskType, RegExp]> = [
  ['debug', /\b(debug|fix|error|bug|broken|issue|مشكل|خطأ|صلح|حل المشكلة|لا يعمل)\b/i],
  ['create', /\b(create|build|make|develop|generate|implement|أنشئ|اصنع|ابني|طور|صمم|اعمل)\b/i],
  ['modify', /\b(change|modify|edit|update|improve|upgrade|عدّل|غير|غيّر|عدل|طور|حسّن|طوّر)\b/i],
  ['research', /\b(search|research|find|latest|current|ابحث|بحث|تعمق|آخر|حالي|جديد)\b/i],
  ['compare', /\b(compare|difference|vs|versus|قارن|الفرق|مقارنة)\b/i],
  ['solve', /\b(solve|calculate|حل|احسب|استخرج|برهن)\b/i],
  ['explain', /\b(explain|what is|how does|اشرح|ما هو|كيف يعمل|لماذا)\b/i],
  ['execute', /\b(run|execute|install|deploy|push|commit|شغل|نفذ|ثبت|انشر|ارفع)\b/i],
  ['plan', /\b(plan|roadmap|steps|خطة|مخطط|خطوات)\b/i],
];

const CONTINUATION = /^(yes|yeah|ok|okay|continue|go on|proceed|do it|same|this one|نعم|اي|أيوه|واصل|كمل|تابع|ابدأ|نفذ|نفسه|هذا|هكذا|تمام|اكمل)\s*[.!؟…]*$/i;

function unique(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean).map(s => s.trim()).filter(Boolean)));
}

export function buildRequestContract(
  prompt: string,
  recentMessages: Array<{ role?: string; text?: string }>,
): RequestContract {
  const clean = String(prompt || '').trim();
  const continuation = CONTINUATION.test(clean);
  const context = recentMessages.slice(-8).map(m => String(m.text || '')).join('\n');
  const source = continuation ? context : clean;

  let taskType: RequestTaskType = 'unknown';
  for (const [type, pattern] of TYPE_PATTERNS) {
    if (pattern.test(source)) {
      taskType = type;
      break;
    }
  }
  if (continuation) taskType = 'continue';

  const explicitConstraints = unique([
    ...clean.match(/(?:without|don't|do not|keep|preserve|leave|لا|بدون|من دون|خليه|خلي|لا تغير|لا تغيّر)[^.!?؟\n]{0,180}/gi) || [],
    ...clean.match(/(?:exactly|unchanged|same|كما هو|مثل ما هو|نفس|بالضبط)[^.!?؟\n]{0,140}/gi) || [],
  ]).slice(0, 8);

  const protectedItems = unique([
    ...clean.match(/(?:https?:\/\/[^\s)]+|[A-Za-z0-9_.-]+\.(?:ts|tsx|js|jsx|json|java|kt|gradle|xml|md))/g) || [],
    ...clean.match(/(?:gemini-[0-9.]+-[a-z-]+|Android|GitHub|Linux|Windows|macOS|iOS|Stremio)/gi) || [],
  ]).slice(0, 12);

  const needsFreshKnowledge = /\b(latest|today|now|current|recent|newest|آخر|اليوم|الآن|حالي|حديث|جديد|ابحث|بحث)\b/i.test(clean);
  const needsExecution = /\b(run|execute|install|deploy|push|commit|build|fix it|نفذ|شغل|ثبت|انشر|ارفع|صلح|عدّل الملف|غيّر الملف)\b/i.test(clean);

  const needsClarification = clean.length > 0
    && !continuation
    && clean.length < 8
    && taskType === 'unknown'
    && context.trim().length === 0;

  return {
    taskType,
    goal: continuation
      ? (context.split('\n').filter(Boolean).slice(-1)[0] || clean).slice(0, 4000)
      : clean.slice(0, 4000),
    explicitConstraints,
    protectedItems,
    needsFreshKnowledge,
    needsExecution,
    needsClarification,
    continuation,
  };
}

export function formatRequestContract(contract: RequestContract, language: 'ar' | 'en'): string {
  if (language === 'ar') {
    return `\n=== عقد الطلب المحدد ===
نوع المهمة: ${contract.taskType}
الهدف: ${contract.goal || 'غير محدد'}
القيود الصريحة: ${contract.explicitConstraints.join(' | ') || 'لا توجد قيود إضافية مكتشفة'}
العناصر التي يجب الحفاظ عليها حرفياً: ${contract.protectedItems.join(' | ') || 'لا توجد'}
معلومة حديثة مطلوبة: ${contract.needsFreshKnowledge ? 'نعم' : 'لا'}
تنفيذ فعلي مطلوب: ${contract.needsExecution ? 'نعم' : 'لا'}
هذه الرسالة استمرار لمهمة سابقة: ${contract.continuation ? 'نعم' : 'لا'}
قاعدة القرار: لا تستبدل المهمة. نفذ المطلوب فقط، واحترم القيود، ولا تدّع تنفيذ شيء لم يتم تنفيذه بأداة فعلية.
=== نهاية عقد الطلب ===`;
  }

  return `\n=== REQUEST CONTRACT ===
Task type: ${contract.taskType}
Goal: ${contract.goal || 'unspecified'}
Explicit constraints: ${contract.explicitConstraints.join(' | ') || 'none detected'}
Protected exact items: ${contract.protectedItems.join(' | ') || 'none'}
Fresh knowledge required: ${contract.needsFreshKnowledge ? 'yes' : 'no'}
Actual execution requested: ${contract.needsExecution ? 'yes' : 'no'}
Continuation of previous task: ${contract.continuation ? 'yes' : 'no'}
Decision rule: do not substitute the task; preserve constraints; never claim execution that was not performed by a real tool.
=== END REQUEST CONTRACT ===`;
}
