export type RequestTaskType =
  | 'explain' | 'solve' | 'create' | 'modify' | 'debug' | 'compare'
  | 'research' | 'execute' | 'continue' | 'plan' | 'unknown';

export interface RequestContract {
  taskType: RequestTaskType;
  goal: string;
  explicitConstraints: string[];
  protectedItems: string[];
  needsFreshKnowledge: boolean;
  needsExecution: boolean;
  needsClarification: boolean;
  continuation: boolean;
  executionRoute: 'answer' | 'web_research' | 'agent_plan' | 'external_execution';
  recommendedModelDepth: 'fast' | 'reasoning' | 'deep';
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

export function buildRequestContract(prompt: string, recentMessages: Array<{ role?: string; text?: string }>): RequestContract {
  const clean = String(prompt || '').trim();
  const continuation = CONTINUATION.test(clean);
  const context = recentMessages.slice(-8).map(m => String(m.text || '')).join('\n');
  const source = continuation ? context : clean;
  let taskType: RequestTaskType = 'unknown';
  for (const [type, pattern] of TYPE_PATTERNS) {
    if (pattern.test(source)) { taskType = type; break; }
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

  const needsClarification = clean.length > 0 && !continuation && clean.length < 8 && taskType === 'unknown' && context.trim().length === 0;

  const executionRoute =
    needsFreshKnowledge || taskType === 'research' ? 'web_research' :
    needsExecution ? 'external_execution' :
    ['create','modify','debug','plan','execute','continue'].includes(taskType) ? 'agent_plan' : 'answer';

  const recommendedModelDepth =
    clean.length > 2200 || ['debug','research','compare','plan','execute'].includes(taskType) ? 'deep' :
    clean.length > 700 || ['create','modify','solve','continue'].includes(taskType) ? 'reasoning' : 'fast';

  return {
    taskType,
    goal: (continuation ? (context.split('\n').filter(Boolean).slice(-1)[0] || clean) : clean).slice(0, 4000),
    explicitConstraints,
    protectedItems,
    needsFreshKnowledge,
    needsExecution,
    needsClarification,
    continuation,
    executionRoute,
    recommendedModelDepth,
  };
}

export function formatRequestContract(contract: RequestContract, language: 'ar' | 'en'): string {
  return language === 'ar'
    ? `\n=== عقد الطلب المحدد ===
نوع المهمة: ${contract.taskType}
الهدف: ${contract.goal || 'غير محدد'}
القيود: ${contract.explicitConstraints.join(' | ') || 'لا توجد'}
العناصر المحمية: ${contract.protectedItems.join(' | ') || 'لا توجد'}
معلومة حديثة مطلوبة: ${contract.needsFreshKnowledge ? 'نعم' : 'لا'}
تنفيذ فعلي مطلوب: ${contract.needsExecution ? 'نعم' : 'لا'}
استمرار لمهمة سابقة: ${contract.continuation ? 'نعم' : 'لا'}
المسار: ${contract.executionRoute}
عمق النموذج: ${contract.recommendedModelDepth}
قاعدة: لا تستبدل المهمة ولا تدّع تنفيذ شيء لم يتم تنفيذه بأداة فعلية.
=== نهاية عقد الطلب ===`
    : `\n=== REQUEST CONTRACT ===
Task type: ${contract.taskType}
Goal: ${contract.goal || 'unspecified'}
Constraints: ${contract.explicitConstraints.join(' | ') || 'none'}
Protected items: ${contract.protectedItems.join(' | ') || 'none'}
Fresh knowledge required: ${contract.needsFreshKnowledge ? 'yes' : 'no'}
Actual execution requested: ${contract.needsExecution ? 'yes' : 'no'}
Continuation: ${contract.continuation ? 'yes' : 'no'}
Route: ${contract.executionRoute}
Model depth: ${contract.recommendedModelDepth}
Rule: never substitute the task or claim execution without real tool evidence.
=== END REQUEST CONTRACT ===`;
}
