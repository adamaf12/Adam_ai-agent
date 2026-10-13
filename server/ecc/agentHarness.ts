import { verifyAndCorrectResponse, type VerificationResult } from '../../src/core/agent/deterministicVerifier';
import { agentRegistry } from '../../src/core/swarm/agentRegistry';

export type HarnessPhase =
  | 'understand'
  | 'plan'
  | 'execute'
  | 'verify'
  | 'recover'
  | 'complete';

export interface HarnessSkill {
  id: string;
  description: string;
  capabilities: string[];
  risk: 'low' | 'medium' | 'high';
}

export interface HarnessAgent {
  id: string;
  purpose: string;
  capabilities: string[];
}

export interface HarnessPlan {
  taskType: string;
  phases: HarnessPhase[];
  skills: HarnessSkill[];
  agents: HarnessAgent[];
  requiresVerification: boolean;
  requiresToolEvidence: boolean;
  maxRecoveryPasses: number;
  contextPolicy: {
    preserveRecentTurns: number;
    preserveOpeningTurns: number;
    maxPromptChars: number;
  };
}

const SKILLS: HarnessSkill[] = [
  { id: 'request-understanding', description: 'Convert the request into an explicit goal, constraints and execution mode.', capabilities: ['understanding', 'planning'], risk: 'low' },
  { id: 'context-budget', description: 'Keep only task-relevant context and avoid prompt bloat.', capabilities: ['context', 'memory'], risk: 'low' },
  { id: 'agent-harness', description: 'Use typed tool contracts, deterministic observations and bounded recovery.', capabilities: ['tools', 'recovery'], risk: 'medium' },
  { id: 'architecture-audit', description: 'Trace failures through prompt, memory, tools, rendering and persistence layers.', capabilities: ['architecture', 'debugging'], risk: 'medium' },
  { id: 'security-review', description: 'Check permissions, secrets, input boundaries and sensitive operations.', capabilities: ['security', 'tools'], risk: 'high' },
  { id: 'regression-testing', description: 'Prefer deterministic checks and preserve known failure cases.', capabilities: ['testing', 'verification'], risk: 'medium' },
  { id: 'self-debugging', description: 'Capture failure state before retrying and recover with bounded steps.', capabilities: ['debugging', 'recovery'], risk: 'medium' },
  { id: 'continuous-improvement', description: 'Turn verified outcomes into reusable workflow knowledge without persisting raw model claims.', capabilities: ['memory', 'learning'], risk: 'low' },
  { id: 'api-integration', description: 'Trace API request and response contracts, authentication, streaming, timeouts, and provider failures end to end.', capabilities: ['api', 'integration', 'debugging'], risk: 'medium' },
  { id: 'database-reliability', description: 'Design durable persistence, migrations, access policies, and recovery rather than relying on ephemeral serverless disk.', capabilities: ['database', 'persistence', 'memory'], risk: 'high' },
  { id: 'mobile-app-debugging', description: 'Diagnose Android/WebView networking, Capacitor configuration, APK build and release behavior.', capabilities: ['android', 'mobile', 'debugging'], risk: 'medium' },
  { id: 'web-automation', description: 'Use available browser and web tools for grounded page inspection and user-authorized workflows.', capabilities: ['web', 'research', 'tools'], risk: 'medium' },
  { id: 'multimodal-media', description: 'Route image, audio, video, OCR and document requests to the appropriate available capability and verify output type.', capabilities: ['image', 'audio', 'video', 'multimodal'], risk: 'medium' },
  { id: 'skill-composition', description: 'Compose several specialized skills into a dependency-aware plan, execute in order, and validate deliverables.', capabilities: ['planning', 'tools', 'verification'], risk: 'medium' },
];

function has(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

export function buildHarnessPlan(prompt: string): HarnessPlan {
  const text = prompt.trim();
  const coding = has(text, /code|coding|debug|bug|github|repo|deploy|typescript|javascript|python|كود|برمج|خطأ|إصلاح|مستودع|نشر/i);
  const research = has(text, /research|search|latest|current|verify|ابحث|بحث|آخر|تحقق|مصدر|ويب|موقع|صفحة/i);
  const security = has(text, /security|auth|permission|secret|token|attack|أمان|حماية|صلاحيات|مفتاح|ثغرة/i);
  const api = has(text, /api|endpoint|http|stream|ndjson|webhook|oauth|integration|واجهة برمجية|طلب شبكة|استجابة/i);
  const database = has(text, /database|supabase|postgres|sql|storage|persistence|migration|قاعدة بيانات|تخزين|ذاكرة دائمة/i);
  const mobile = has(text, /android|apk|capacitor|webview|ios|mobile|هاتف|أندرويد|تطبيق الهاتف/i);
  const media = has(text, /image|photo|video|audio|voice|ocr|multimodal|صورة|فيديو|صوت|استخراج النص/i);
  const complex = text.length > 700 || coding || research || security || api || database || mobile || media;

  const requiredCapabilities = new Set<string>(['planning']);
  if (coding) { requiredCapabilities.add('coding'); requiredCapabilities.add('debugging'); }
  if (research) { requiredCapabilities.add('research'); requiredCapabilities.add('web'); }
  if (security) requiredCapabilities.add('security');
  if (api) { requiredCapabilities.add('api'); requiredCapabilities.add('integration'); }
  if (database) { requiredCapabilities.add('database'); requiredCapabilities.add('persistence'); }
  if (mobile) { requiredCapabilities.add('android'); requiredCapabilities.add('mobile'); }
  if (media) { requiredCapabilities.add('multimodal'); requiredCapabilities.add('image'); requiredCapabilities.add('audio'); requiredCapabilities.add('video'); }
  if (complex) requiredCapabilities.add('reasoning');

  const agents = agentRegistry.enabled()
    .filter(agent => agent.capabilities.some(cap => requiredCapabilities.has(cap)))
    .slice(0, complex ? 5 : 2)
    .map(agent => ({
      id: agent.id,
      purpose: agent.name,
      capabilities: [...agent.capabilities],
    }));

  const skills = SKILLS.filter(skill =>
    skill.capabilities.some(cap => requiredCapabilities.has(cap)) ||
    (complex && ['agent-harness', 'regression-testing', 'self-debugging'].includes(skill.id))
  );

  if (security && !skills.some(skill => skill.id === 'security-review')) {
    skills.push(SKILLS.find(skill => skill.id === 'security-review')!);
  }

  return {
    taskType: coding ? 'engineering' : research ? 'research' : complex ? 'complex' : 'conversation',
    phases: complex
      ? ['understand', 'plan', 'execute', 'verify', 'complete']
      : ['understand', 'execute', 'verify', 'complete'],
    skills,
    agents,
    requiresVerification: true,
    requiresToolEvidence: coding || security,
    maxRecoveryPasses: 2,
    contextPolicy: {
      preserveRecentTurns: 8,
      preserveOpeningTurns: 4,
      maxPromptChars: 120_000,
    },
  };
}

export function formatHarnessInstruction(plan: HarnessPlan, language: 'ar' | 'en' = 'ar'): string {
  const skillList = plan.skills.map(skill => skill.id).join(', ');
  const agentList = plan.agents.map(agent => agent.id).join(', ') || 'general';
  if (language === 'ar') {
    return `\n\n=== ADEM AGENT HARNESS ===
المسار: ${plan.taskType}
المراحل: ${plan.phases.join(' → ')}
المهارات النشطة: ${skillList}
الوكلاء المتاحون: ${agentList}
قواعد التشغيل:
- افهم الطلب أولاً ثم خطط قبل تنفيذ المهمة المركبة.
- لا تدّع تنفيذ أداة أو تعديل ملف أو نشر أو اختبار من دون دليل تنفيذ فعلي.
- استخدم أدوات صغيرة ومحددة، واعتبر نتيجة كل أداة observation موثوقاً فقط إذا كانت بحالة نجاح.
- عند فشل خطوة: سجّل السبب، أصلح السبب الجذري، ثم أعد المحاولة بحد أقصى ${plan.maxRecoveryPasses} مرة.
- تحقق من النتيجة قبل إعلان الإكمال.
- لا تجعل مخرجاتك الداخلية أو التخمينات تتحول تلقائياً إلى ذاكرة دائمة.
- حافظ على سياق المهمة ضمن ميزانية محددة ولا تعيد إدخال معلومات قديمة غير مرتبطة.
- عند وجود عملية حساسة، يجب أن تمر عبر صلاحية الأداة/المستخدم قبل التنفيذ.
=== END ADEM AGENT HARNESS ===`;
  }

  return `\n\n=== ADEM AGENT HARNESS ===
Route: ${plan.taskType}
Phases: ${plan.phases.join(' → ')}
Active skills: ${skillList}
Available agents: ${agentList}
Rules:
- Understand first, then plan before complex execution.
- Never claim a tool call, file edit, deployment, or test without real execution evidence.
- Use narrow typed tools and treat tool output as trustworthy only when it reports success.
- On failure, capture the root cause and recover with at most ${plan.maxRecoveryPasses} passes.
- Verify the result before declaring completion.
- Never persist model guesses as long-term memory automatically.
- Keep task context within the declared budget and avoid unrelated historical context.
- Sensitive operations must pass the server-side permission gate.
=== END ADEM AGENT HARNESS ===`;
}

export function verifyHarnessOutput(text: string): VerificationResult {
  return verifyAndCorrectResponse(text);
}
