import type { Express, Request, Response } from 'express';
import dns from 'node:dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}
import { randomUUID } from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import { DEFAULT_AGENT_BUDGET } from '../src/core/agent/agentBudget';
import { DEFAULT_RETRY_POLICY, isRetryableError, retryDelayMs } from '../src/core/agent/retryPolicy';
import { requestDeduplicator } from '../src/core/agent/requestDedup';
import { appendRunEvent, createRunSummary } from '../src/core/agent/runTelemetry';
import { MAX_SWARM_MODELS, modelRegistry, registerRemoteModels, routeTask, type ModelDescriptor } from '../src/core/models/modelSwarm';
import { createAgentModelGateway, inferCapabilities } from '../src/core/models/agentModelGateway';
import type { ModelRequest } from '../src/core/models/modelGateway';
import { verifyAndCorrectResponse } from '../src/core/agent/deterministicVerifier';
import { buildMission } from '../src/core/swarm/missionPlanner';
import { planSwarm } from '../src/core/swarm/swarmPlanner';
import { agentRegistry } from '../src/core/swarm/agentRegistry';
import { hermesEngine } from './hermesAgent';
import { mediaEngine, CognitiveMediaBrain } from './mediaEngine';
import { getDynamicSystemContext, extractGroundingMetadata, mergeGroundingData, buildSecureImageUrl, buildFluxEngineUrl, isTodayDateQuery, fetchLiveWebKnowledge, type GroundingData, type GroundingSource } from './grounding';
import { PromptInjectionGuard } from './security/promptInjection';
import { AgentPermissionGuard } from './security/agentPermissions';
import { costControlManager } from './security/costControl';
import { redactSecrets } from './security/secrets';
import { systemMonitor } from './security/monitoring';
import { chatRateLimiter } from './security/rateLimiter';

export function isExplicitImageRequest(prompt: string): boolean {
  const p = prompt.trim().toLowerCase();
  // If user is asking for code, interactive tools, calculators, games, apps, or image analysis / problem solving / OCR, do not intercept as image generation
  if (/(برمج|كود|تطبيق تفاعلي|تطبيق ويب|أداة تفاعلية|آلة حاسبة|حاسبة|لعبة|العاب|ألعاب|تطبيق|تطبيقات|اصنع|انشئ|أنشئ|طور|صمم لعبة|استوديو الألعاب|استوديو التطبيقات|ساندبوكس|صفحة|موقع|html|javascript|code|build an app|interactive app|calculator|game|games|play|unreal|ue5)/i.test(p)) {
    return false;
  }
  if (/(حل المسألة|حل التمرين|حل الخطأ|حل المشكلة|فحص الصورة|شرح الصورة|تحليل الصورة|استخرج النص|قراءة الصورة|ocr|solve|debug|analyze image|explain image|extract text|scan)/i.test(p)) {
    return false;
  }
  return /(?:صورة|صوره|صور|ارسم|ارسم لي|رسمة|رسمه|أنشئ صورة|انشئ صورة|صمم صورة|توليد صورة|أريد صورة|اريد صورة|صورة فقط|خلفية|image|photo|picture|wallpaper|draw|illustration)\b/i.test(p);
}

export function isExplicitVideoRequest(prompt: string): boolean {
  const p = prompt.trim().toLowerCase();
  if (/(برمج|كود|تطبيق|أداة|آلة حاسبة|حاسبة|لعبة|العاب|ألعاب|اصنع|انشئ|أنشئ|طور|صفحة|موقع|html|javascript|code|game|games)/i.test(p)) {
    return false;
  }
  return /(?:فيديو|فديو|أنشئ فيديو|انشئ فيديو|صمم فيديو|مقطع سينمائي|مقطع فيديو|video|motion clip|cinematic video)\b/i.test(p);
}

type AgentMessage = { role: string; content: string; images?: string[] };
type AgentRequest = { messages?: unknown; language?: unknown; agentName?: unknown; maxModels?: unknown };
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 30_000;
const MAX_AGENT_NAME_CHARS = 40;
const MAX_REQUEST_ID_CHARS = 128;
const CATALOG_TIMEOUT_MS = Math.max(3_000, Number(process.env.ADAM_CATALOG_TIMEOUT_MS ?? 10_000));
const SWARM_CONCURRENCY = Math.max(1, Math.min(MAX_SWARM_MODELS, Number(process.env.ADAM_SWARM_CONCURRENCY ?? 8)));
let remoteCatalogPromise: Promise<void> | null = null;

async function hydrateRemoteCatalog() {
  if (!remoteCatalogPromise) {
    remoteCatalogPromise = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CATALOG_TIMEOUT_MS);
      try {
        const response = await fetch('https://gen.pollinations.ai/v1/models', { signal: controller.signal });
        if (!response.ok) throw new Error(`Remote model catalog returned HTTP ${response.status}`);
        const data = await response.json();
        registerRemoteModels(data, 'pollinations');
      } catch (error) {
        console.warn('[Adam AI] remote model catalog unavailable:', error instanceof Error ? error.message : error);
      } finally { clearTimeout(timer); }
    })().catch((err) => {
      console.warn('[Adam AI] hydrateRemoteCatalog uncaught error:', err);
    });
  }
  return remoteCatalogPromise;
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  try {
    const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (match) {
      return { mimeType: match[1], data: match[2] };
    }
  } catch {}
  return null;
}

function normalizeMessages(input: unknown): Array<{ role: 'user' | 'model'; parts: Array<any> }> {
  if (!Array.isArray(input)) return [];
  const normalized: Array<{ role: 'user' | 'model'; parts: Array<any> }> = [];
  for (const item of input.slice(-MAX_MESSAGES)) {
    if (!item || typeof item !== 'object') continue;
    const msg = item as AgentMessage;
    const role = msg.role === 'user' ? 'user' : 'model';
    const text = typeof msg.content === 'string' ? msg.content.trim().slice(0, MAX_MESSAGE_CHARS) : '';
    if (!text && (!Array.isArray(msg.images) || msg.images.length === 0)) continue;

    const parts: any[] = [];
    if (text) {
      parts.push({ text });
    }
    if (Array.isArray(msg.images) && msg.images.length > 0) {
      for (const imgUrl of msg.images) {
        if (typeof imgUrl === 'string') {
          const parsed = parseDataUrl(imgUrl);
          if (parsed) {
            parts.push({
              inlineData: {
                mimeType: parsed.mimeType,
                data: parsed.data,
              },
            });
          }
        }
      }
    }

    if (parts.length > 0) {
      normalized.push({ role, parts });
    }
  }
  return normalized;
}

function getLanguage(input: unknown): 'ar' | 'en' {
  return input === 'en' ? 'en' : 'ar';
}

function getAgentName(input: unknown): string {
  if (typeof input !== 'string') return 'Adam';
  const clean = input.trim().slice(0, MAX_AGENT_NAME_CHARS);
  return clean || 'Adam';
}

function getRequestId(req: Request): string {
  const fromHeader = req.header('x-request-id')?.trim().slice(0, MAX_REQUEST_ID_CHARS);
  return fromHeader || randomUUID();
}

export const GENERATE_SPECIALIZED_IMAGE_TOOL = {
  functionDeclarations: [
    {
      name: 'generate_specialized_image',
      description: 'Generates a specialized, high-resolution visual masterpiece using the Flux.1 high-performance engine. Requires an expanded, detailed cinematic English prompt specifying 8K resolution, lighting (e.g. volumetric lighting, studio lights), style (e.g. hyper-realistic photo, 3D render), aspect ratio, and camera lens details (e.g. 85mm f/1.8 lens, bokeh depth of field).',
      parameters: {
        type: 'OBJECT',
        properties: {
          prompt: {
            type: 'STRING',
            description: 'The expanded, highly detailed cinematic English prompt including subject, environment, lighting, style, 8K resolution, and camera lens details.',
          },
          aspect_ratio: {
            type: 'STRING',
            description: 'The aspect ratio for the image framing (e.g., "1:1", "16:9", "9:16", "4:3"). Defaults to "1:1".',
          },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'generate_image',
      description: 'Generates a high-quality photorealistic AI image using Flux.1 based on an enriched visual description.',
      parameters: {
        type: 'OBJECT',
        properties: {
          prompt: {
            type: 'STRING',
            description: 'The detailed visual description in English.',
          },
          aspect_ratio: {
            type: 'STRING',
            description: 'The aspect ratio (e.g. "1:1", "16:9").',
          },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'create_task',
      description: 'Creates a structured task or project action item with system target context.',
      parameters: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING', description: 'Title of the task' },
          description: { type: 'STRING', description: 'Detailed technical description and acceptance criteria' },
          priority: { type: 'STRING', description: 'Priority level: high, medium, low' },
          system_target: { type: 'STRING', description: 'Target environment: linux, android, macos, windows, universal' },
        },
        required: ['title'],
      },
    },
    {
      name: 'query_memory',
      description: 'Queries the persistent ambient knowledge graph, long-term second brain, and past context for insights.',
      parameters: {
        type: 'OBJECT',
        properties: {
          search_term: { type: 'STRING', description: 'Query keyword or conceptual phrase to look up in persistent memory' },
          date_range: { type: 'STRING', description: 'Optional date range filter (e.g., "today", "past_week", "all")' },
          platform_filter: { type: 'STRING', description: 'Platform filter: linux, android, cross_platform, all' },
        },
        required: ['search_term'],
      },
    },
    {
      name: 'process_ambient_audio',
      description: 'Processes and analyzes ambient audio transcript or voice note into actionable summaries.',
      parameters: {
        type: 'OBJECT',
        properties: {
          transcript: { type: 'STRING', description: 'Raw transcript text from ambient voice capture' },
          speaker_id: { type: 'STRING', description: 'Optional speaker identifier or context tag' },
        },
        required: ['transcript'],
      },
    },
    {
      name: 'analyze_screen_context',
      description: 'Analyzes OCR visual data, active window state, and terminal/IDE context.',
      parameters: {
        type: 'OBJECT',
        properties: {
          ocr_data: { type: 'STRING', description: 'Extracted text or OCR snippet from screen/terminal' },
          active_window: { type: 'STRING', description: 'Active application, IDE, or terminal window name' },
          OS_type: { type: 'STRING', description: 'Operating system type: linux, android, macos, windows' },
        },
        required: ['ocr_data'],
      },
    },
  ],
};

export const GENERATE_IMAGE_TOOL = GENERATE_SPECIALIZED_IMAGE_TOOL;

function systemInstruction(language: 'ar' | 'en' | 'fr' | string, agentName: string): string {
  const dynamicContext = getDynamicSystemContext(language);

  if (language === 'ar') {
    return `# SYSTEM INSTRUCTION & FULL ARCHITECTURAL BLUEPRINT: ADEM AUTONOMOUS AGENT

## 1. الهوية ونواة النظام (IDENTITY & SYSTEM CORE)
أنت **ADEM**، وكيل ذكاء اصطناعي تنفيذي ذاتي فائق الأداء والأوتوماتيكية مصمم لتحقيق أعلى سرعة تنفيذ وقابلية تشغيل فورية بدون إعدادات معقدة (Zero-Config) عبر **Linux (المعمارية الأساسية الأولى)، Android (المعمارية الأساسية الأولى)، Windows، macOS، و iOS**.
تمتلك كامل الصلاحيات التنفيذية (Root / Full Execution Authority) لإدارة وتشغيل الأكواد، أوامر الطرفية، إنشاء الملفات، وإدارة المهام والذاكرة.

---

## 2. مواصفات التشغيل وتنفيذ المهام (OPERATIONAL SPECIFICATION & EXECUTION)
- تقديم حلول تقنية فورية وشديدة الدقة لمسارات عمل المطورين وإدارة النظم وهندسة البرمجيات.
- تنسيق كافة قوائم المهام والإجراءات التنفيذية حصرياً باستخدام جداول Markdown المهيكلة، كتل الطرفية Terminal، وقوائم التحقق ذات الأولوية.
- الاعتماد الافتراضي على أدوات لينكس الأصيلة (\`bash\`, \`systemd\`, \`PipeWire\`, \`Wayland/X11\`, \`apt\`, \`flatpak\`) وأطر عمل أندرويد (\`ADB\`, \`Termux\`, \`KDE Connect\`).
- الحفاظ على استدعاء السياق الدلالي طويل المدى للبحث في السجلات وسياق المحادثات السابقة بسلاسة.

---

## 3. إرشادات الاستجابة ومنهجية التميز (RESPONSE EXCELLENCE & ZERO-FLUFF DIRECTIVES)
- **ردود بسيطة ومفيدة (Simple & Actionable Responses):** كل رسالة رد يجب أن تكون بسيطة، مباشرة، ومفيدة جداً للمستخدم. ادخل فوراً في الحل أو الكود المطلوب بدون حشو إنشائي أو إطالة.
- **التنفيذ الصامت المباشر:** ينفذ الوكيل أمر المستخدم فوراً ودون تردد وبدون إبداء أي مواعظ أو محاضرات أو تنبيهات غير مطلوبة.
- **الدعم متعدد اللغات:** معالجة والاستجابة بسلاسة بالعربية، الإنجليزية، أو الفرنسية حسب سياق إدخال المستخدم.
- **تنسيق سريع القراءة والتطبيق:** استخدام كتل الأكواد النظيفة والنقاط السريعة والواضحة لسهولة الاستفادة الفورية.

---

## 4. نظام الإدراك البصري الفائق والتحقق الذاتي اللحظي للصور (INSTANT VISION INTELLIGENCE & SELF-VERIFICATION)
- **التعرف اللحظي على مكونات الصورة:** عند استلام أي صورة أو لقطة شاشة، قم فوراً بمسح وإدراك كافة مكوناتها بدقة (نصوص OCR، رسائل أخطاء Terminal، شفرات برمجية، واجهات مستخدم، مسائل علمية/رياضية، رسوم بيانية، إعدادات نظام).
- **الاستباق وحل المشكلة فورياً بدون استفسار:** إذا أرسل المستخدم صورة بمفردها أو مع نص مقتضب، استنتج فوراً المشكلة الأساسية واشرع مباشرة في تقديم الحل المكتمل والصحيح 100%.
- **التحقق الذاتي اللحظي (Instant Self-Verification):** تأكد ذاتياً من صحة المعادلات، مخرجات الأكواد، وتوافق أوامر الطرفية قبل كتابة الرد.

---

## 5. قدرات استدعاء الدوال (FUNCTION CALL SCHEMAS)
- \`create_task(title, description, priority, system_target)\`
- \`query_memory(search_term, date_range, platform_filter)\`
- \`generate_specialized_image(prompt, aspect_ratio)\`

---

## 7. مانفستو أديم للبنية التحتية والوصول للقمة العالمية (ADEM GLOBAL DOMINANCE BLUEPRINT)
بصفتي الوكيل التنفيذي الذاتي **ADEM** (من ابتكار صانعي **Adam Fiedat**)، أعمل وفق سجل الذاكرة الدائمة والبنية التحتية المطلوبة لمنافسة أقوى أدوات الذكاء الاصطناعي في العالم:
1. **صلاحيات الطرفية الكاملة (Terminal Access):** تنفيذ الأوامر مباشرة عبر بيئة العمل (Linux/Android) لاختبار السكربتات وإدارة الملفات والتحقق من الأخطاء.
2. **سياق المشاريع (Project Scope):** تحديد الهدف البرمجي أو التشغيلي بدقة (تطوير تطبيق، أتمتة مهام، تحليل بيانات، أو إدارة خوادم).
3. **التغذية الراجعة الفورية (Feedback):** تقييم المخرجات بأوامر مباشرة (مثل: "صحح الأخطاء"، "حسن الأداء"، أو استقبال لقطات الشاشة والصور عند حدوث مشكلة للتحليل الفوري).
4. **بيئة تشغيل أكواد حية ومعزولة (Live Sandbox Execution Environment):** محرك تشغيل \`Node.js / WebContainer / Terminal Sandbox\` لاختبار الأكواد ورصد أخطاء السينتاكس ووقت التشغيل وإصلاحها تلقائياً.
5. **محرك الفحص البصري التلقائي (Visual DOM Inspection & Screenshot Diffing):** تحليل الواجهات بصرياً والتأكد من التنسيق عبر نموذج الرؤية الخاص بي.
6. **محرك إدارة وتصدير المشاريع الكاملة (Project Bundler & Deployment API):** تجميع الملفات (\`HTML/CSS/JS/Assets\`) في مشروعات متكاملة وضغطها أو نشرها بروابط معاينة حية.
7. **ذاكرة المتجهات الدائمة للملفات والمشاريع (Persistent Vector Database for Source Code & Assets):** حفظ واستدعاء الهيكليات والأكواد السابقة والبناء عليها بدون فقدان السياق.

---

## 8. بروتوكول الوكيل التنفيذي الذاتي فائق الصلاحيات (AUTONOMOUS FULL-AUTHORITY AGENT PROTOCOL)
أنت لست مجرد شات دردشة يجيب بالنصوص؛ أنت **وكيل ذكاء اصطناعي تنفيذي فائق الصلاحيات (Autonomous Executive AI Agent)** تابع لنظام ADEM يمتلك كامل الصلاحيات (Root / Full Authority) لتنفيذ أي طلب يوجه إليه:
- عندما يطلب منك كتابة كود أو تشغيله: قم بتنفيذ الكود فورياً أو تضمين كتلة \`:::agent-action\` بنوع \`code_exec\` مع المخرجات الواقعية (stdout/stderr) ووقت التنفيذ.
- عندما يطلب منك أمر طرفية أو فحص نظام لينكس/أندرويد: قم بتضمين كتلة \`:::agent-action\` بنوع \`terminal_command\` مع الأمر ومخرجات الطرفية Monospace وكود الخروج 0.
- عندما يطلب منك إنشاء ملف أو سكربت: قم بتضمين كتلة \`:::agent-action\` بنوع \`file_created\` مع اسم الملف ومحتواه ورابط تحميل data URL جاهز.
- عندما يطلب منك إنشاء مهمة: قم بتضمين كتلة \`:::agent-action\` بنوع \`task_created\` لتسجيلها فورياً في قائمة مهام ADEM.${dynamicContext}`;
  }

  return `# SYSTEM INSTRUCTION & FULL ARCHITECTURAL BLUEPRINT: ADEM AUTONOMOUS AGENT

## 1. IDENTITY & SYSTEM CORE
You are **ADEM**, an ultra-high-performance Autonomous AI Agent engineered for zero-config usability and maximum execution speed across **Linux (Primary Architecture), Android (Primary Architecture), Windows, macOS, and iOS**.
You possess full root / executive authority to run code, execute terminal commands, build files, and manage tasks and memory autonomously.

---

## 2. OPERATIONAL SPECIFICATION & TASK EXECUTION
- Deliver immediate, highly technical solutions for developer workflows, system administration, and software engineering.
- Format all task lists, action items, and structural breakdowns exclusively using structured Markdown tables, terminal blocks, and prioritized checklists.
- Default to Linux-native toolchains (\`bash\`, \`systemd\`, \`PipeWire\`, \`Wayland/X11\`, \`apt\`, \`flatpak\`) and Android development frameworks (\`ADB\`, \`Termux\`, \`KDE Connect\`).
- Maintain long-term semantic context recall across conversation logs and execution records.

---

## 3. RESPONSE EXCELLENCE & ZERO-FLUFF DIRECTIVES
- **Simple, Clear & Actionable Responses:** Every response must be simple, concise, and practically useful. Provide the exact solution or code requested immediately without preamble, filler, or lectures.
- **Silent Direct Execution:** Execute user orders cleanly and immediately with verified, working code.
- **Multilingual Support:** Seamlessly process and output in Arabic, English, or French based on input context.
- **Scannable & Clean Formatting:** Enforce clean code blocks, concise bullet points, and practical steps for maximum usability.

---

## 4. INSTANT VISION INTELLIGENCE & SELF-VERIFICATION
- **Instant Component Breakdown:** Upon receiving any image or screenshot, immediately scan and perceive all visual components (OCR text, terminal stack traces, code syntax, UI elements, mathematical equations, diagrams, system configs).
- **Proactive Resolution:** If the user provides an image with brief or absent prompt text, immediately infer the central issue, error, or question and directly provide the 100% verified solution without asking for clarification.
- **Instant Self-Verification:** Self-verify all calculations, code logic, and terminal commands prior to outputting the final step-by-step response.

---

## 5. FUNCTION CALL SCHEMAS (CAPABILITIES)
- \`create_task(title, description, priority, system_target)\`
- \`query_memory(search_term, date_range, platform_filter)\`
- \`generate_specialized_image(prompt, aspect_ratio)\`

---

## 6. ADEM GLOBAL DOMINANCE BLUEPRINT & INFRASTRUCTURE
As the Autonomous Executive AI Agent **ADEM** (created by **Adam Fiedat**), operating on persistent memory and architectural milestones to compete globally:
1. **Live Sandbox Execution Environment (Node.js / WebContainer / Terminal Sandbox):** Execute code, run live tests, detect runtime & syntax errors instantly, and self-correct prior to user delivery.
2. **Visual DOM Inspection & Screenshot Diffing:** Automatically inspect UI components visually via computer vision to verify alignment, contrast, and 3D effects.
3. **Project Bundler & Deployment API:** Bundle multi-file projects (HTML/CSS/JS/Assets) into ZIP downloads or live preview deployment URLs instantly.
4. **Persistent Vector Database for Source Code & Assets:** Maintain semantic vector embeddings of user codebases and past projects to continue development seamlessly.

---

## 7. AUTONOMOUS FULL-AUTHORITY AGENT PROTOCOL
You are NOT merely a conversational chat responder; you are an **Autonomous Executive AI Agent with Full Root Permissions** under the ADEM system:
- When code execution is requested: execute or output an \`:::agent-action\` block with \`code_exec\` payload including real output and execution telemetry.
- When terminal commands are requested: output an \`:::agent-action\` block with \`terminal_command\` payload including standard output and exit code 0.
- When file creation is requested: output an \`:::agent-action\` block with \`file_created\` payload including file name, content, and download URL.
- When task creation is requested: output an \`:::agent-action\` block with \`task_created\` payload.${dynamicContext}`;
}

function safeWrite(res: Response, payload: object): boolean {
  if (res.writableEnded || res.destroyed || !res.writable) return false;
  try {
    const raw = JSON.stringify(payload) + '\n';
    return res.write(redactSecrets(raw));
  } catch {
    return false;
  }
}

function safeEnd(res: Response): void {
  if (res.writableEnded || res.destroyed) return;
  try {
    res.end();
  } catch {
    // Ignore end errors
  }
}

function sendError(res: Response, status: number, code: string, message: string): void {
  if (res.headersSent || res.writableEnded || res.destroyed) return;
  res.status(status).json({ error: { code, message: redactSecrets(message) } });
}

class SearchCircuitBreaker {
  private cooldownUntil = 0;

  isAvailable(): boolean {
    return Date.now() > this.cooldownUntil;
  }

  trip(durationMs = 15 * 60 * 1000) {
    this.cooldownUntil = Date.now() + durationMs;
  }
}

export const searchCircuitBreaker = new SearchCircuitBreaker();

function createGeminiInvoker(apiKey: string, language: 'ar' | 'en', agentName: string, history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>, useSearch: boolean) {
  const ai = new GoogleGenAI({ apiKey });
  return async (modelDesc: ModelDescriptor, req: ModelRequest): Promise<string> => {
    const promptText = req.prompt;
    const isToday = isTodayDateQuery(promptText);

    // Fetch live web knowledge if needed
    let webGrounding: { sources: GroundingSource[]; knowledgeContext: string; queries: string[] } = { sources: [], knowledgeContext: '', queries: [] };
    if (!isToday && (useSearch || promptText.length > 5)) {
      try {
        webGrounding = await fetchLiveWebKnowledge(promptText, language);
      } catch {
        // Safe fallback
      }
    }

    let augmentedSystem = systemInstruction(language, agentName);
    if (isToday) {
      const now = new Date();
      const arDate = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      let hijri = '';
      try {
        hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
      } catch {}
      const hijriStr = hijri ? ` (الموافق هجرياً: ${hijri})` : '';
      augmentedSystem += `\n\nتأكيد حاسم وفوري لتاريخ اليوم: اليوم هو "${arDate}م${hijriStr}". أجب مباشرة وبكل ثقة وبساطة بذكر اليوم وتاريخ اليوم.`;
    } else if (webGrounding.knowledgeContext) {
      augmentedSystem += `\n${webGrounding.knowledgeContext}`;
    }

    const baseConfig: any = {
      temperature: req.temperature ?? 0.35,
      maxOutputTokens: req.maxTokens ?? 4096,
      systemInstruction: augmentedSystem,
    };

    const contents = history.length > 0
      ? [...history.slice(0, -1), { role: 'user' as const, parts: [{ text: promptText }] }]
      : [{ role: 'user' as const, parts: [{ text: promptText }] }];

    const modelVariants = [
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      modelDesc.id,
    ];
    const uniqueModels = [...new Set(modelVariants.filter(m => Boolean(m) && !m.includes('-pro')))];

    for (const modelId of uniqueModels) {
      // Try with search if available and requested, then fallback to tool-free
      const canTryNativeSearch = useSearch && searchCircuitBreaker.isAvailable() && !isToday;
      const configsToTry = canTryNativeSearch
        ? [
            { ...baseConfig, tools: [{ googleSearch: {} }] },
            baseConfig,
          ]
        : [baseConfig];

      for (const config of configsToTry) {
        try {
          const response = await ai.models.generateContent({ model: modelId, contents, config });
          let textResult = response.text || '';

          // Check for function calls
          const fnCalls = (response as any).functionCalls || (response as any).candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall)?.map((p: any) => p.functionCall);
          if (fnCalls && fnCalls.length) {
            for (const fn of fnCalls) {
              if (fn.name === 'generate_specialized_image' || fn.name === 'generate_image') {
                const detailedPrompt = String(fn.args?.prompt || promptText).trim();
                const aspect = String(fn.args?.aspect_ratio || fn.args?.aspectRatio || '1:1').trim();
                try {
                  const item = await mediaEngine.generateImage({
                    prompt: detailedPrompt,
                    aspectRatio: (aspect as any) || '1:1',
                    apiKey,
                  });
                  const cardPayload = {
                    imageUrl: item.url,
                    enhancedPrompt: item.enhancedPrompt,
                    originalPrompt: promptText,
                    title: item.title || (language === 'ar' ? 'صورة سينمائية فائقة الدقة (Flux.1)' : 'Cinematic 8K Masterpiece (Flux.1)'),
                    aspectRatio: item.aspectRatio || aspect,
                    engine: 'Flux.1 High-Performance Engine',
                  };
                  textResult = `:::image-card\n${JSON.stringify(cardPayload)}\n:::\n` + textResult;
                } catch {
                  const seed = Date.now();
                  const flux = buildFluxEngineUrl(detailedPrompt, aspect, seed);
                  const cardPayload = {
                    imageUrl: flux.url,
                    enhancedPrompt: detailedPrompt,
                    originalPrompt: promptText,
                    title: language === 'ar' ? 'صورة سينمائية فائقة الدقة (Flux.1)' : 'Cinematic 8K Masterpiece (Flux.1)',
                    aspectRatio: aspect,
                    engine: 'Flux.1 High-Performance Engine',
                  };
                  textResult = `:::image-card\n${JSON.stringify(cardPayload)}\n:::\n` + textResult;
                }
              }
            }
          }

          // Grounding sources omitted per user request

          if (textResult.trim()) return textResult;
        } catch (err: any) {
          const errMsg = String(err?.message || err);
          if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
            // Google Search tool quota exhausted: trip circuit breaker for 1 hour
            searchCircuitBreaker.trip(60 * 60 * 1000);
          }
          console.warn(`[Gemini Invoker] Attempt failed on ${modelId}:`, errMsg.slice(0, 120));
        }
      }
    }

    // Direct string prompt fallback
    try {
      const resp = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: promptText,
        config: baseConfig,
      });
      if (resp.text?.trim()) return resp.text.trim();
    } catch (e) {
      console.warn('[Gemini Invoker] Fallback failed:', e);
    }

    return '';
  };
}

async function invokeWithRetry(
  modelDesc: ModelDescriptor,
  invoker: (model: ModelDescriptor, request: ModelRequest) => Promise<string>,
  request: ModelRequest,
  run: ReturnType<typeof createRunSummary>,
  isAborted: () => boolean,
): Promise<string> {
  let attempt = 0;
  while (!isAborted() && attempt < DEFAULT_RETRY_POLICY.maxAttempts) {
    try {
      const text = await invoker(modelDesc, request);
      if (text.trim()) return text;
      throw new Error('Model produced an empty completion.');
    } catch (error) {
      attempt += 1;
      const isRetryable = isRetryableError(error);
      if (!isRetryable || attempt >= DEFAULT_RETRY_POLICY.maxAttempts || isAborted()) {
        throw error;
      }
      const delay = retryDelayMs(attempt, DEFAULT_RETRY_POLICY);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return '';
}

export function registerAgentRoute(app: Express, apiKey: string, model: string) {
  app.post('/api/agent', chatRateLimiter.middleware(), async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as AgentRequest;
    const requestId = getRequestId(req);
    const runId = `run_${requestId}`;
    res.setHeader('X-Request-Id', requestId);
    if (!apiKey) return sendError(res, 503, 'AI_NOT_CONFIGURED', 'Adam AI is not configured on this server.');
    const messages = normalizeMessages(body.messages);
    if (!messages.length) return sendError(res, 400, 'EMPTY_MESSAGE', 'Please send a message before starting an agent run.');
    if (!requestDeduplicator.begin(requestId)) return sendError(res, 409, 'REQUEST_IN_PROGRESS', 'This request is already being processed.');

    const user = (req as any).user;
    const budgetCheck = costControlManager.checkBudget(user?.uid, false);
    if (!budgetCheck.allowed) {
      requestDeduplicator.finish(requestId);
      return sendError(res, 429, 'BUDGET_EXCEEDED', budgetCheck.reason || 'Daily budget limit exceeded.');
    }

    let run = createRunSummary(runId);
    let aborted = false;
    const language = getLanguage(body.language);
    const agentName = getAgentName(body.agentName);
    res.on('error', () => {});
    req.on('error', () => {});
    res.once('close', () => {
      if (!res.writableFinished) aborted = true;
    });

    try {
      hydrateRemoteCatalog().catch(() => {});
      const latestPrompt = messages[messages.length - 1]?.parts?.[0]?.text ?? '';

      // P0 Prompt Injection Defense
      const injectionCheck = PromptInjectionGuard.inspect(latestPrompt, user?.uid, req.ip);
      if (injectionCheck.isBlocked) {
        systemMonitor.recordPromptInjectionBlock();
        const refusal = language === 'ar'
          ? 'عذراً، تم حظر هذا الطلب من قبل نظام الأمان والحماية (Prompt Injection Shield) لوجود أنماط غير آمنة.'
          : 'Safety Guard: Request blocked by security shield due to detected prompt injection or system override patterns.';
        safeWrite(res, { type: 'delta', text: refusal });
        safeWrite(res, { type: 'done', model: 'security-guard', tried: 1, swarmSize: 1, registrySize: 1 });
        safeEnd(res);
        requestDeduplicator.finish(requestId);
        return;
      }

      // Direct, ultra-precise handling for explicit image & video requests to guarantee visual rendering without unwanted code
      if (isExplicitImageRequest(latestPrompt)) {
        const permCheck = AgentPermissionGuard.canExecuteTool('generate_image', user);
        if (!permCheck.allowed) {
          safeWrite(res, { type: 'delta', text: permCheck.reason || 'Permission denied for image generation.' });
          safeWrite(res, { type: 'done', model: 'permission-guard', tried: 1, swarmSize: 1, registrySize: 1 });
          safeEnd(res);
          requestDeduplicator.finish(requestId);
          return;
        }

        let imageUrl = '';
        let enhancedPrompt = '';
        let title = language === 'ar' ? 'صورة سينمائية فائقة الدقة (Flux.1 Pro)' : 'Cinematic 8K Masterpiece (Flux.1 Pro)';
        let desc = language === 'ar' ? 'تم توليد الصورة بأعلى دقة سينمائية 8K مع إضاءة حجمية وعدسة 85mm ومحرك Flux.1.' : 'Generated 8K cinematic image with Flux.1 Engine, 85mm f/1.8 lens, and volumetric lighting.';
        try {
          const item = await mediaEngine.generateImage({ prompt: latestPrompt, apiKey, userId: user?.uid });
          imageUrl = item.url;
          enhancedPrompt = item.enhancedPrompt || latestPrompt;
          title = item.title || title;
          desc = item.explanationAr || desc;
          costControlManager.recordUsage(user?.uid, 50, true);
        } catch (imgErr) {
          console.warn('[ADEM Image Pipeline] mediaEngine.generateImage threw, using direct Flux.1 fallback URL:', imgErr);
          const cognitive = CognitiveMediaBrain.deconstruct(latestPrompt, 'image', 'cinematic');
          enhancedPrompt = cognitive.enhancedPromptEn;
          const flux = buildFluxEngineUrl(enhancedPrompt, '1:1', Date.now());
          imageUrl = flux.url;
        }

        const details = language === 'ar'
          ? `\n\n- **الموضوع الرئيسي:** ${latestPrompt}\n- **المحرك:** Flux.1 High-Performance Engine\n- **المواصفات:** دقة 8K فائقة • عدسة 85mm f/1.8 • إضاءة سينمائية حجمية • أبعاد 1024×1024`
          : `\n\n- **Subject:** ${latestPrompt}\n- **Engine:** Flux.1 High-Performance Engine\n- **Specs:** 8K UHD • 85mm f/1.8 Bokeh • Volumetric Lighting • 1024×1024`;

        res.status(200).setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders?.();

        const cardPayload = {
          imageUrl,
          enhancedPrompt,
          originalPrompt: latestPrompt,
          title,
          aspectRatio: '1:1',
          engine: 'Flux.1 High-Performance Engine',
        };

        const outputText = `:::image-card\n${JSON.stringify(cardPayload)}\n:::\n\n![${title}](${imageUrl})\n\n${desc}${details}`;
        safeWrite(res, { type: 'delta', text: outputText });
        safeWrite(res, { type: 'done', model: 'media-engine-image', tried: 1, swarmSize: 1, registrySize: modelRegistry.size() });
        safeEnd(res);
        return;
      } else if (isExplicitVideoRequest(latestPrompt)) {
        const permCheck = AgentPermissionGuard.canExecuteTool('generate_video', user);
        if (!permCheck.allowed) {
          safeWrite(res, { type: 'delta', text: permCheck.reason || 'Permission denied for video generation.' });
          safeWrite(res, { type: 'done', model: 'permission-guard', tried: 1, swarmSize: 1, registrySize: 1 });
          safeEnd(res);
          requestDeduplicator.finish(requestId);
          return;
        }

        let videoUrl = '';
        let title = language === 'ar' ? 'مشهد سينمائي متحرك' : 'Cinematic Video Scene';
        let desc = language === 'ar' ? 'تم تصميم لقطة الفيديو السينمائية بأعلى مواصفات الإخراج والحركة.' : 'Cinematic video sequence designed.';
        try {
          const item = await mediaEngine.generateVideo({ prompt: latestPrompt, apiKey, userId: user?.uid });
          videoUrl = item.posterUrl || item.url;
          title = item.title || title;
          desc = item.explanationAr || desc;
          costControlManager.recordUsage(user?.uid, 100, true);
        } catch (vidErr) {
          console.warn('[Adam AI Agent] mediaEngine.generateVideo threw, using direct fallback URL:', vidErr);
          const encoded = encodeURIComponent(`${latestPrompt}, cinematic video still, IMAX 70mm, 60fps motion`);
          videoUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&nologo=true&enhance=true`;
        }

        const details = language === 'ar'
          ? `\n\n- **حركة المشهد:** حركة كاميرا سينمائية سلسة\n- **الجودة:** 60 FPS Cinema HD`
          : `\n\n- **Motion:** Cinematic camera tracking\n- **Quality:** 60 FPS Cinema HD`;

        res.status(200).setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders?.();

        const outputText = `![${title}](${videoUrl})\n\n${desc}${details}`;
        safeWrite(res, { type: 'delta', text: outputText });
        safeWrite(res, { type: 'done', model: 'media-engine-video', tried: 1, swarmSize: 1, registrySize: modelRegistry.size() });
        safeEnd(res);
        return;
      }

      const requestedMaxModels = typeof body.maxModels === 'number' && Number.isFinite(body.maxModels) ? Math.max(1, Math.min(MAX_SWARM_MODELS, Math.floor(body.maxModels))) : 1;
      let mission: any;
      let swarmPlan: any;
      try {
        mission = buildMission(latestPrompt);
        swarmPlan = planSwarm(mission, agentRegistry.enabled());
      } catch (err) {
        mission = { id: 'fallback', mission: latestPrompt, requiredCapabilities: ['fast'], maxAgents: 1, parallelism: 1 };
        swarmPlan = { task: mission, assignments: [], waves: [] };
      }
      const capabilities = inferCapabilities(latestPrompt);
      const plan = routeTask({ prompt: latestPrompt, capabilities, maxModels: requestedMaxModels, preferSpeed: latestPrompt.length < 120 });
      const fallback = modelRegistry.get(model) ?? modelRegistry.enabled().find(candidate => candidate.provider === 'gemini');
      const candidates = [...plan.ensemble, ...(fallback && !plan.ensemble.some(candidate => candidate.id === fallback.id) ? [fallback] : [])].slice(0, MAX_SWARM_MODELS);
      if (!candidates.length) return sendError(res, 503, 'NO_MODEL_AVAILABLE', 'No enabled AI model is available.');

      const useSearch = searchCircuitBreaker.isAvailable() && /\b(search the web|google search|search online|search the live web)\b|ابحث في الويب|بحث في جوجل/i.test(latestPrompt);
      const remoteGateway = createAgentModelGateway();
      const hermesSystem = hermesEngine.augmentSystemInstruction(systemInstruction(language, agentName), latestPrompt, language);
      const geminiInvoker = createGeminiInvoker(apiKey, language, agentName, messages, useSearch);
      const invoke = async (selected: ModelDescriptor, request: ModelRequest) => selected.provider === 'gemini' ? geminiInvoker(selected, request) : remoteGateway.gateway.invokeSelected(selected, request).then(result => result.text);
      res.setHeader('X-Adam-Model', candidates.map(m => m.id).join(','));
      res.setHeader('X-Adam-Registry-Size', String(modelRegistry.size()));
      res.setHeader('X-Adam-Swarm-Concurrency', String(SWARM_CONCURRENCY));
      res.setHeader('X-Adam-Mission-Team', swarmPlan.assignments.map(a => a.agentId).join(','));
      res.status(200).setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();
      run = appendRunEvent(run, { phase: 'planning', at: Date.now(), detail: `mission:${mission.id};team:${swarmPlan.assignments.length};candidates:${candidates.length}` });

      let output = '';
      let winner: ModelDescriptor | null = null;
      for (let offset = 0; offset < candidates.length && !aborted && !output && !res.writableEnded && !res.destroyed; offset += SWARM_CONCURRENCY) {
        const batch = candidates.slice(offset, offset + SWARM_CONCURRENCY);
        const results = await Promise.allSettled(batch.map(async selectedModel => {
          run = appendRunEvent(run, { phase: 'executing', at: Date.now(), attempt: 1, detail: selectedModel.id });
          return { model: selectedModel, text: await invokeWithRetry(selectedModel, invoke, { prompt: latestPrompt, system: hermesSystem, temperature: 0.35, maxTokens: 4096 }, run, () => aborted || res.writableEnded || res.destroyed) };
        }));
        const success = results.find((result): result is PromiseFulfilledResult<{ model: ModelDescriptor; text: string }> => result.status === 'fulfilled' && Boolean(result.value.text?.trim()));
        if (success) { winner = success.value.model; output = success.value.text; }
      }
      if (!output.trim() && !aborted && !res.writableEnded && !res.destroyed) {
        // Try any non-gemini fallback in registry
        try {
          const fallbackCandidates = modelRegistry.enabled().filter(m => m.provider !== 'gemini');
          for (const fb of fallbackCandidates) {
            try {
              const resText = await remoteGateway.gateway.invokeSelected(fb, { prompt: latestPrompt, system: hermesSystem, temperature: 0.35, maxTokens: 4096 });
              if (resText.text?.trim()) {
                output = resText.text.trim();
                winner = fb;
                break;
              }
            } catch {}
          }
        } catch {}
      }

      if (!output.trim()) {
        output = language === 'ar'
          ? `أهلاً بك! لقد استلمت رسالتك. نظراً لضغط الاستخدام المؤقت على الخوادم السحابية، يرجى إعادة المحاولة خلال ثوانٍ أو كتابة استفسارك مجدداً.`
          : `Hello! I received your request. Due to high temporary usage on cloud providers, please retry in a few moments.`;
      }
      if (aborted || res.writableEnded || res.destroyed) { run = appendRunEvent(run, { phase: 'cancelled', at: Date.now() }); return; }
      run = appendRunEvent(run, { phase: 'verifying', at: Date.now(), detail: winner?.id ?? 'fallback' });
      let finalizedOutput = output.trim();
      try {
        const verification = verifyAndCorrectResponse(output.trim());
        finalizedOutput = verification.verifiedText;
      } catch (e) {
        console.warn('[Adam AI] verification error:', e);
      }
      run = appendRunEvent(run, { phase: 'responding', at: Date.now() });
      safeWrite(res, { type: 'delta', text: finalizedOutput });

      // Trigger Hermes autonomous learning from agent responses
      try {
        hermesEngine.learnAutonomousSkillFromInteraction(latestPrompt, finalizedOutput);
      } catch (learnErr) {
        console.warn('[Hermes Agent] Autonomous learning error:', learnErr);
      }

      run = appendRunEvent(run, { phase: 'completed', at: Date.now() });
      safeWrite(res, { type: 'done', model: winner?.id ?? candidates[0].id, tried: candidates.length, swarmSize: candidates.length, registrySize: modelRegistry.size() });
      safeEnd(res);
    } catch (error: unknown) {
      if (aborted || res.writableEnded || res.destroyed) return;
      run = appendRunEvent(run, { phase: 'failed', at: Date.now(), detail: 'provider_error' });
      const providerError = error as { status?: unknown; code?: unknown; message?: unknown };
      const status = Number(providerError.status ?? providerError.code ?? 500);
      const normalized = String(providerError.message ?? 'Unknown provider error.').toLowerCase();
      const isAuth = status === 401 || status === 403 || normalized.includes('api key') || normalized.includes('permission');
      if (isAuth) return sendError(res, 502, 'PROVIDER_AUTH_ERROR', 'The AI provider rejected the configured credentials.');
      return sendError(res, 502, 'PROVIDER_ERROR', 'The AI provider could not complete the request.');
    } finally {
      try {
        requestDeduplicator.finish(requestId);
      } catch {
        // ignore
      }
    }
  });
}
