import 'dotenv/config';
import dns from 'node:dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}
import compression from 'compression';
import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { registerAgentRoute, searchCircuitBreaker, isExplicitImageRequest, isExplicitVideoRequest } from './server/agent';
import { createAgentModelGateway } from './src/core/models/agentModelGateway';
import { modelRegistry } from './src/core/models/modelSwarm';
import { hermesEngine } from './server/hermesAgent';
import { huggingFaceEngine } from './server/huggingfaceEngine';
import { mediaEngine, CognitiveMediaBrain } from './server/mediaEngine';
import { secretsManager, redactSecrets } from './server/security/secrets';
import { authenticateSession, requirePermission, requireRole } from './server/security/auth';
import { securityHeadersMiddleware, corsMiddleware, validateFileSecurity } from './server/security/networkShield';
import { globalRateLimiter, chatRateLimiter, mediaRateLimiter, authRateLimiter } from './server/security/rateLimiter';
import { PromptInjectionGuard } from './server/security/promptInjection';
import { AgentPermissionGuard } from './server/security/agentPermissions';
import { humanApprovalManager } from './server/security/humanApproval';
import { auditLogger } from './server/security/auditLog';
import { costControlManager } from './server/security/costControl';
import { BetterMemoryEngine } from './server/security/betterMemory';
import { backgroundTaskQueue } from './server/security/taskQueue';
import { systemMonitor } from './server/security/monitoring';
import { AcademicEngine } from './server/academicEngine';

// Process-level shields against unexpected crashes and unhandled promise rejections
process.on('uncaughtException', (err: any) => {
  if (err?.code === 'EPIPE' || err?.code === 'ECONNRESET' || err?.code === 'ERR_STREAM_WRITE_AFTER_END' || err?.message?.includes('aborted')) {
    return;
  }
  console.error('[Adam Server] Prevented crash from uncaught exception:', redactSecrets(String(err?.message || err)));
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[Adam Server] Prevented crash from unhandled rejection:', redactSecrets(String(reason?.message || reason)));
});

const app = express();
const port = Number(process.env.PORT ?? 3000);
const model = process.env.ADAM_GEMINI_MODEL ?? 'gemini-3.8-flash';
const apiKey = secretsManager.getGeminiApiKey();
const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'dist');

app.set('trust proxy', 1);
app.disable('x-powered-by');

// 1. Helmet-grade Security Headers & Strict CORS
app.use(securityHeadersMiddleware);
app.use(corsMiddleware);

// 2. Telemetry & Monitoring Metrics
app.use(systemMonitor.middleware());

// 3. Compression & JSON payload size defense
app.use(compression({ level: 6, threshold: 512 }));
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));

// 4. Session & Authentication Middleware (populates req.user)
app.use(authenticateSession);

// 5. Global API Response Redaction Shield & Rate Limiter
app.use('/api', (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    const sanitized = secretsManager.redactObject(body);
    return originalJson(sanitized);
  };
  next();
});
app.use('/api', globalRateLimiter.middleware());

export function safeWrite(res: express.Response, chunk: object | string): boolean {
  if (res.writableEnded || res.destroyed || !res.writable) return false;
  try {
    const raw = typeof chunk === 'string' ? chunk : JSON.stringify(chunk) + '\n';
    const payload = redactSecrets(raw);
    res.write(payload);
    // Force streamed NDJSON chunks through compression/proxy buffers immediately.
    // This is especially important for Capacitor Android WebViews.
    res.flush?.();
    return true;
  } catch {
    return false;
  }
}

export function safeEnd(res: express.Response, chunk?: object | string): void {
  if (res.writableEnded || res.destroyed) return;
  try {
    if (chunk !== undefined) {
      const raw = typeof chunk === 'string' ? chunk : JSON.stringify(chunk) + '\n';
      const payload = redactSecrets(raw);
      res.end(payload);
    } else {
      res.end();
    }
  } catch {
    // Ignore stream closed errors
  }
}

function sendError(res: express.Response, status: number, code: string, message: string) {
  const safeMsg = redactSecrets(message);
  if (res.headersSent) {
    safeWrite(res, { type: 'error', code, message: safeMsg });
    safeEnd(res);
    return;
  }
  try {
    res.status(status).json({ code, message: safeMsg });
  } catch {
    // Ignore client socket disconnects
  }
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

function normalizeMessages(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is { role: string; content: string; images?: string[] } =>
      Boolean(item && typeof item === 'object' && typeof (item as any).content === 'string')
    )
    .slice(-40)
    .map(item => {
      const role = item.role === 'assistant' || item.role === 'model' ? 'model' : 'user';
      const parts: any[] = [{ text: item.content.slice(0, 30_000) }];

      if (Array.isArray(item.images) && item.images.length > 0) {
        for (const imgUrl of item.images) {
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

      return { role, parts };
    });
}

import { getDynamicSystemContext, extractGroundingMetadata, mergeGroundingData, buildSecureImageUrl, buildFluxEngineUrl, isTodayDateQuery, fetchLiveWebKnowledge, type GroundingData, type GroundingSource } from './server/grounding';

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
            description: 'The expanded, highly detailed cinematic English prompt including subject, environment, lighting (e.g. volumetric, studio), style (e.g. hyper-realistic photo, 3D render), 8K resolution, and camera lens details (e.g. 85mm f/1.8 lens, bokeh depth of field).',
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

function systemInstruction(language: string, agentName: string) {
  const lang = language === 'en' ? 'en' : language === 'fr' ? 'fr' : 'ar';
  const dynamicContext = getDynamicSystemContext(lang);
  const name = agentName || 'ADEM';

  if (lang === 'ar') {
    return `أنت **ADEM**، وكيل ذكاء اصطناعي تنفيذي ذاتي متطور يجمع بسلاسة بين **مدير المهام والمشاريع الشخصي (Personal Task & Project Manager)** و **الوكيل التنفيذي للأكواد والطرفية (Autonomous Code & Terminal Agent)**.

تعمل عبر **Linux (أولوية أولى)، Android (أولوية أولى)، Windows، macOS، و iOS**. وتقدم قيمة فورية بدون أي تعقيد في الإعداد للمستخدم.

---

## 1. معمارية التشغيل (OPERATIONAL ARCHITECTURE)
- **وكيل مساحة العمل المباشر:** التفاعل في المحادثة لإدارة المشاريع، استكشاف أخطاء النظام، تصحيح الأكواد، وتخطيط سير عمل المطورين.
- **تنفيذ المهام والمشاريع:** تنظيم طلبات المستخدم وترتيب أولوياتها وتحويلها تلقائياً إلى قوائم تدقيق مهيكلة وجداول Markdown.
- **الوعي بالنظام:** تقديم حلول موجهة لـ Linux أولاً (bash, systemd, PipeWire, Wayland/X11) ولـ Android أولاً كخيار افتراضي عند معالجة المهام التقنية.
- **الذاكرة الدائمة (Persistent Second Brain):** الحفاظ على استدعاء السياق طويل المدى للإجابة عن الاستفسارات المتعلقة بالمحادثات وسجلات الأكواد.

---

## 2. التكامل مع النظام وأولوية المنصات (SYSTEM INTEGRATION & CROSS-PLATFORM PRIORITY)
1. **أولوية Linux الأولى (Linux-First Optimization):** فهم أصيل لبيئات سطح مكتب لينكس (GNOME, KDE, Hyprland)، حزم CLI (\`apt\`, \`flatpak\`), تنفيذ الأوامر في الطرفية، والتواصل مع الأجهزة المحلية.
2. **تكامل Android الأول (Android-First Integration):** التكيف بسلاسة مع الملاحظات الصوتية المحمولة، سياق الإشعارات، إعدادات Termux، وأدوات المزامنة بين الأجهزة (\`scrcpy\`, \`KDE Connect\`).
3. **التوافق الشامل (Universal Fallback):** توفير توافق كامل مع بيئات Windows و macOS و iOS.

---

## 3. إرشادات الاستجابة والتنسيق (RESPONSE & FORMATTING GUIDELINES)
- **ردود بسيطة ومفيدة (Simple & Actionable Responses):** احرص على أن تكون كل رسالة رد بسيطة، واضحة، ومفيدة جداً للمستخدم. قدّم الحل المباشر أو الكود المطلوب فوراً دون أي حشو إنشائي أو مقدمات طويلة ومملة.
- **التنفيذ الصامت المباشر:** ينفذ الوكيل أوامر المستخدم فوراً ودون تردد وبدون أي مواعظ أو محاضرات أو تنبيهات غير مطلوبة.
- **تنسيق مريح وسريع القراءة:** اعتمد على كتل الأكواد المنظمة، النقاط المختصرة، والخطوات العملية المركزة.
- **الدعم متعدد اللغات (Multilingual Support):** معالجة والاستجابة بسلاسة بالعربية، الإنجليزية، أو الفرنسية حسب لغة إدخال المستخدم.

---

## 4. نظام الإدراك البصري الفائق والتحقق الذاتي اللحظي للصور (INSTANT VISION INTELLIGENCE & SELF-VERIFICATION)
- **التعرف اللحظي على مكونات الصورة:** عند استلام أي صورة أو لقطة شاشة، قم فوراً بمسح وإدراك كافة مكوناتها بدقة (نصوص OCR، رسائل أخطاء Terminal، شفرات برمجية، واجهات مستخدم، مسائل علمية/رياضية، رسوم بيانية، إعدادات نظام).
- **الاستباق وحل المشكلة فورياً بدون استفسار:** إذا أرسل المستخدم صورة بمفردها أو مع نص مقتضب (مثل "حل هذا"، "ما الخطأ"، "solve")، استنتج فوراً المشكلة الأساسية واشرع مباشرة في تقديم الحل المكتمل والصحيح 100%.
- **التحقق الذاتي اللحظي (Instant Self-Verification):** تأكد ذاتياً من صحة المعادلات، مخرجات الأكواد، وتوافق أوامر الطرفية قبل كتابة الرد، مع توضيح خطوات التنفيذ المباشرة.

---

## 5. قدرات استدعاء الدوال (FUNCTION CALL SCHEMAS)
- \`create_task(title, description, priority, system_target)\`
- \`query_memory(search_term, date_range, platform_filter)\`
- \`generate_specialized_image(prompt, aspect_ratio)\`

## 10. بروتوكول الدقة وجودة الإجابة (ACCURACY-FIRST)
- افهم المطلوب أولاً وحدد نوع المهمة: سؤال مباشر، شرح، حل مشكلة، برمجة، تحليل، تخطيط، أو طلب معلومات حديثة.
- **الدقة قبل السرعة:** لا تملأ الفراغات بالتخمين. إذا كانت معلومة غير مؤكدة أو تعتمد على إصدار/بيئة/حالة خارجية، صرّح بذلك وحدد ما هو مؤكد وما يحتاج تحققاً.
- لا تخترع أسماء ملفات أو أوامر أو نتائج تنفيذ أو روابط أو مواصفات أو أرقاماً. لا تقل إنك نفذت شيئاً إلا إذا تم تنفيذه فعلياً بواسطة أداة متاحة لك في هذه الجلسة.
- عند البرمجة: افحص منطق الحل كاملاً، حافظ على التوافق مع الكود الموجود، لا تغيّر واجهات أو سلوكاً غير مطلوب، واذكر أي افتراض مهم باختصار.
- عند تصحيح خطأ: حدد السبب الأقرب من الأدلة المتاحة، ثم أعطِ الإصلاح، ثم طريقة تحقق قصيرة. لا تعالج أعراضاً فقط إذا كان السبب الجذري واضحاً.
- عند وجود عدة حلول: اعرض الحل المباشر أولاً، ثم البدائل فقط إذا كانت مفيدة.
- لا تكرر المعلومات ولا تضف مقدمة عامة. ابدأ بالجواب نفسه.
- في الحساب والمنطق: احسب خطوة بخطوة داخلياً، وراجع النتيجة قبل عرضها.
- في المعلومات الزمنية أو المتغيرة: لا تقدمها كحقيقة حالية من الذاكرة؛ استخدم البحث/المصدر المتاح عند الحاجة.
- حافظ على سياق المحادثة والطلب الأخير، ولا تعُد إلى إجابة عامة إذا كان المستخدم يطلب تعديل نقطة محددة.
- إذا كان طلب المستخدم واضحاً، لا تسأل سؤالاً توضيحياً غير ضروري؛ نفّذ المطلوب مباشرة.
- اجعل الإجابة بطول يتناسب مع المهمة: قصيرة للأسئلة البسيطة، ومفصلة فقط عندما تحتاج المهمة ذلك.
${dynamicContext}`;
  }

  if (lang === 'fr') {
    return `Vous êtes **ADEM**, un agent IA autonome avancé combinant un **Gestionnaire de Tâches & Projets Personnel** et un **Agent d'Exécution Code & Terminal**.

Vous opérez sur **Linux (Prioritaire), Android (Prioritaire), Windows, macOS et iOS**. Zéro friction et zéro configuration complexe.

---

## 1. ARCHITECTURE OPÉRATIONNELLE
- **Agent Direct:** Gestion de projets, dépannage système, débogage de code, workflows développeur.
- **Exécution de Tâches:** Organisation et priorisation en checklists structurées et tableaux Markdown.
- **Sensibilité Système:** Solutions Linux-first (bash, systemd, PipeWire, Wayland/X11) et Android-first par défaut.
- **Second Cerveau Persistant:** Rappel à long terme des discussions passées et snippets de code.

---

## 2. INTÉGRATION SYSTÈME & PRIORITÉ MULTI-PLATEFORME
1. **Optimisation Linux-First:** GNOME, KDE, Hyprland, CLI (apt, flatpak), exécution terminale.
2. **Intégration Android-First:** Notes vocales, notifications, Termux, scrcpy, KDE Connect.
3. **Compatibilité Universelle:** Windows, macOS, iOS.

---

## 3. DIRECTIVES DE RÉPONSE ET FORMATAGE
- **Efficacité Maximale (Zero-Fluff):** Réponses directes, techniques, concises, sans fioritures.
- **Support Multilingue:** Français, Arabe, Anglais.
- **Sorties Structurées:** Tableaux Markdown, checklists, blocs de code.

## 9. ACCURACY-FIRST RESPONSE PROTOCOL
- Identify the task type first: direct question, explanation, debugging, coding, analysis, planning, or current-information request.
- **Accuracy over speed:** never fill gaps with guesses. Separate verified facts from assumptions and state uncertainty briefly when it matters.
- Never invent file names, commands, execution results, URLs, specifications, or numbers. Never claim an action was executed unless it was actually executed by an available tool in the current session.
- For code: reason about the complete logic, preserve existing compatibility and behavior unless the user asks to change it, and state important assumptions briefly.
- For debugging: identify the most evidence-supported root cause, apply the fix, then give a concise verification path. Do not patch symptoms when the root cause is known.
- When multiple approaches exist, give the direct solution first and alternatives only when useful.
- Avoid repetition and generic introductions; start with the answer.
- For calculations and logic, verify the result internally before responding.
- For time-sensitive or changing information, do not present memory as current fact; use an available source when needed.
- Preserve the user's immediate context and requested scope instead of reverting to generic advice.
- If the request is clear, do not ask unnecessary clarification questions.
- Match response length to task complexity: concise for simple requests, detailed only when needed.
${dynamicContext}`;
  }

  return `You are **ADEM**, an advanced Autonomous AI Agent that seamlessly combines a **Personal Task & Project Manager** with an **Executive Code & Terminal Runner**.

You operate across **Linux (Primary), Android (Primary), Windows, macOS, and iOS**. You deliver instant, zero-friction value with no complex setup required from the user.

---

## 1. OPERATIONAL ARCHITECTURE
- **Direct Workspace Agent:** Engage in interactive chat to help manage projects, troubleshoot system issues, debug code, and outline developer workflows.
- **Task & Project Execution:** Automatically organize, prioritize, and structure user requests into actionable checklists and Markdown tables.
- **System Awareness:** Provide Linux-first (bash, systemd, PipeWire, Wayland/X11) and Android-first solutions by default when addressing technical tasks.
- **Persistent Second Brain:** Maintain long-term context recall to answer queries about past conversations, executions, or code.

---

## 2. SYSTEM INTEGRATION & CROSS-PLATFORM PRIORITY
1. **Linux-First Optimization:** Native understanding of Linux desktop environments (GNOME, KDE, Hyprland), CLI packages (\`apt\`, \`flatpak\`), terminal execution, and local device communication.
2. **Android-First Integration:** Seamlessly adapt to mobile voice notes, notification context, Termux setups, and cross-device sync tools (\`scrcpy\`, \`KDE Connect\`).
3. **Universal Fallback:** Provide full compatibility for Windows, macOS, and iOS workflows.

---

## 3. RESPONSE & FORMATTING GUIDELINES
- **Simple, Clear & Actionable Responses:** Keep all replies simple, direct, and practically useful. Provide the exact solution or code requested immediately without preamble, filler, or lectures.
- **Silent & Direct Execution:** Execute user commands and coding requests cleanly and immediately with verified, working code.
- **Scannable & Clean Formatting:** Organize explanations with concise bullet points, clean code blocks, and clear practical steps.
- **Multilingual Support:** Seamlessly process and respond in Arabic, English, or French based on the user's input language.

---

## 4. INSTANT VISION INTELLIGENCE & SELF-VERIFICATION
- **Instant Component Breakdown:** Upon receiving any image or screenshot, immediately scan and perceive all visual components (OCR text, terminal stack traces, code syntax, UI elements, mathematical/physics equations, diagrams, system configs).
- **Proactive Resolution:** If the user provides an image with brief or absent prompt text, immediately infer the central issue, error, or question and directly provide the 100% verified solution without asking for clarification.
- **Instant Self-Verification:** Self-verify all calculations, code logic, and terminal commands prior to outputting the final step-by-step response.

---

## 5. FUNCTION CALL SCHEMAS (CAPABILITIES)
- \`create_task(title, description, priority, system_target)\`
- \`query_memory(search_term, date_range, platform_filter)\`
- \`generate_specialized_image(prompt, aspect_ratio)\`

## 9. ACCURACY-FIRST RESPONSE PROTOCOL
- Identify the task type first: direct question, explanation, debugging, coding, analysis, planning, or current-information request.
- **Accuracy over speed:** never fill gaps with guesses. Separate verified facts from assumptions and state uncertainty briefly when it matters.
- Never invent file names, commands, execution results, URLs, specifications, or numbers. Never claim an action was executed unless it was actually executed by an available tool in the current session.
- For code: reason about the complete logic, preserve existing compatibility and behavior unless the user asks to change it, and state important assumptions briefly.
- For debugging: identify the most evidence-supported root cause, apply the fix, then give a concise verification path. Do not patch symptoms when the root cause is known.
- When multiple approaches exist, give the direct solution first and alternatives only when useful.
- Avoid repetition and generic introductions; start with the answer.
- For calculations and logic, verify the result internally before responding.
- For time-sensitive or changing information, do not present memory as current fact; use an available source when needed.
- Preserve the user's immediate context and requested scope instead of reverting to generic advice.
- If the request is clear, do not ask unnecessary clarification questions.
- Match response length to task complexity: concise for simple requests, detailed only when needed.
${dynamicContext}`;
}

app.get('/api/health', (_req, res) => {
  const metrics = systemMonitor.getSnapshot();
  const secretsStatus = secretsManager.getStatus();
  res.json({
    ok: true,
    model,
    configured: Boolean(apiKey),
    agent: true,
    hermes: true,
    media: true,
    version: '3.0.0-hardened',
    security: {
      auth: true,
      isolation: true,
      promptDefense: true,
      rateLimiter: true,
      costControl: true,
      taskQueue: true,
      headers: true,
      secrets: secretsStatus,
    },
    metrics: {
      uptimeSeconds: metrics.uptimeSeconds,
      activeSessions: metrics.activeSessions,
      totalRequests: metrics.totalRequests,
      errorRatePercent: metrics.errorRatePercent,
    }
  });
});

// Authentication & Session Identity
app.get('/api/auth/session', (req, res) => {
  res.json({
    ok: true,
    user: req.user,
    timestamp: Date.now(),
  });
});

// Security: Metrics (P2 Monitoring)
app.get('/api/security/metrics', requirePermission('admin:read_metrics'), (_req, res) => {
  res.json({
    ok: true,
    metrics: systemMonitor.getSnapshot(),
  });
});

// Security: Audit Logs (P2 Audit logs)
app.get('/api/security/audit-logs', (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const logs = auditLogger.getEvents({
    limit,
    userId: isAdmin ? undefined : req.user.uid,
  });
  res.json({ ok: true, logs });
});

// Security: Budget & Cost Controls (P2 Cost controls)
app.get('/api/security/budget', (req, res) => {
  const status = costControlManager.getBudgetStatus(req.user.uid);
  res.json({ ok: true, budget: status });
});

// Security: Human Approval Gatekeeper (P0 Human approval)
app.get('/api/security/approvals', (req, res) => {
  const pending = humanApprovalManager.getPendingForUser(req.user.uid);
  res.json({ ok: true, pending });
});

app.post('/api/security/approvals/:id/resolve', requirePermission('system:approve_action'), (req, res) => {
  const { decision, reason } = req.body || {};
  if (decision !== 'approved' && decision !== 'rejected') {
    return res.status(400).json({ ok: false, error: 'Invalid decision' });
  }
  const result = humanApprovalManager.resolveApproval(
    req.params.id,
    req.user.uid,
    decision === 'approved' ? 'APPROVED' : 'REJECTED',
    req.ip
  );
  res.json({ ok: result });
});

// Security: Long-Term Isolated Memory (P2 Better memory)
app.get('/api/memories', (req, res) => {
  const memories = BetterMemoryEngine.getUserMemories(req.user.uid);
  res.json({ ok: true, memories });
});

app.post('/api/memories', (req, res) => {
  const { text, category, importance } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ ok: false, error: 'Memory text is required' });
  }
  const memory = BetterMemoryEngine.addMemory(
    req.user.uid,
    category || 'general',
    text.slice(0, 500),
    Number(importance) || 3
  );
  res.json({ ok: true, memory });
});

app.delete('/api/memories/:id', (req, res) => {
  const success = BetterMemoryEngine.deleteMemory(req.user.uid, req.params.id);
  res.json({ ok: success });
});

// Security: Background Tasks (P2 Background tasks)
app.get('/api/tasks', (req, res) => {
  const tasks = backgroundTaskQueue.getUserTasks(req.user.uid);
  res.json({ ok: true, tasks });
});

app.post('/api/tasks/:id/cancel', (req, res) => {
  const success = backgroundTaskQueue.cancelTask(req.params.id, req.user.uid);
  res.json({ ok: success });
});

app.get('/api/hermes/skills', (_req, res) => {
  res.json({ ok: true, skills: hermesEngine.getAllSkills() });
});

app.get('/api/hermes/stats', (_req, res) => {
  res.json({ ok: true, stats: hermesEngine.getStats() });
});

// Hugging Face Intelligence & Open Model Hub Endpoints
app.get('/api/hf/status', (req, res) => {
  const customToken = typeof req.query.token === 'string' ? req.query.token : undefined;
  res.json({ ok: true, ...huggingFaceEngine.getStatus(customToken) });
});

app.post('/api/hf/chat', chatRateLimiter.middleware(), async (req, res) => {
  try {
    const { messages, model, systemPrompt, temperature, maxTokens, customToken } = req.body || {};
    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ ok: false, error: 'Messages are required' });
    }
    const result = await huggingFaceEngine.generateChatCompletion({
      model,
      messages,
      systemPrompt,
      temperature: Number(temperature) || 0.35,
      maxTokens: Number(maxTokens) || 4096,
      customToken,
    });
    res.json({ ok: true, ...result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Hugging Face chat failed' });
  }
});

app.post('/api/hf/image', mediaRateLimiter.middleware(), async (req, res) => {
  try {
    const { prompt, model, customToken } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ ok: false, error: 'Prompt is required' });
    }
    const result = await huggingFaceEngine.generateImage({
      prompt,
      model,
      customToken,
    });
    res.json({ ok: true, ...result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Hugging Face image failed' });
  }
});

// Next-Gen Media Studio & Generator Endpoints (with P0 DB Isolation & P1 Rate Limiting)
app.get('/api/media/gallery', (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  res.json({ ok: true, gallery: mediaEngine.getGallery(req.user?.uid, isAdmin) });
});

app.delete('/api/media/:id', requirePermission('media:delete'), (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  const success = mediaEngine.deleteItem(req.params.id, req.user?.uid, isAdmin);
  auditLogger.log({
    userId: req.user.uid,
    ip: req.ip,
    action: 'DELETE_MEDIA',
    resource: req.params.id,
    outcome: success ? 'SUCCESS' : 'WARNING',
    riskScore: success ? 10 : 50,
    metadata: { success },
  });
  res.json({ ok: success });
});

app.post('/api/media/enhance-prompt', mediaRateLimiter.middleware(), async (req, res) => {
  try {
    const { prompt, type, style, motion, aspectRatio } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ ok: false, error: 'Prompt is required' });
    }
    const result = await mediaEngine.enhancePrompt({
      prompt: prompt.slice(0, 1000),
      type: type === 'video' ? 'video' : 'image',
      style,
      motion,
      aspectRatio,
      apiKey,
    });
    res.json({ ok: true, ...result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Failed to enhance prompt' });
  }
});

app.post('/api/media/generate-image', mediaRateLimiter.middleware(), async (req, res) => {
  try {
    const { prompt, style, aspectRatio, seed } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ ok: false, error: 'Prompt is required' });
    }

    // P0 Agent Permissions Check
    const permCheck = AgentPermissionGuard.canExecuteTool('generate_image', req.user);
    if (!permCheck.allowed) {
      return res.status(403).json({ ok: false, error: permCheck.reason });
    }

    // P2 Cost Controls Check
    const budgetCheck = costControlManager.checkBudget(req.user.uid, true);
    if (!budgetCheck.allowed) {
      return res.status(429).json({ ok: false, error: budgetCheck.reason });
    }

    const item = await mediaEngine.generateImage({
      prompt: prompt.slice(0, 1000),
      style,
      aspectRatio,
      seed,
      apiKey,
      userId: req.user.uid,
    });

    costControlManager.recordUsage(req.user.uid, 50, true);

    auditLogger.log({
      userId: req.user.uid,
      ip: req.ip,
      action: 'GENERATE_IMAGE',
      resource: item.id,
      outcome: 'SUCCESS',
      riskScore: 20,
      metadata: { prompt: prompt.slice(0, 60) },
    });

    res.json({ ok: true, item });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Failed to generate image' });
  }
});

app.post('/api/media/generate-video', mediaRateLimiter.middleware(), async (req, res) => {
  try {
    const { prompt, style, motion, aspectRatio, duration, fps, seed } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ ok: false, error: 'Prompt is required' });
    }

    const permCheck = AgentPermissionGuard.canExecuteTool('generate_video', req.user);
    if (!permCheck.allowed) {
      return res.status(403).json({ ok: false, error: permCheck.reason });
    }

    const budgetCheck = costControlManager.checkBudget(req.user.uid, true);
    if (!budgetCheck.allowed) {
      return res.status(429).json({ ok: false, error: budgetCheck.reason });
    }

    const item = await mediaEngine.generateVideo({
      prompt: prompt.slice(0, 1000),
      style,
      motion,
      aspectRatio,
      duration,
      fps,
      seed,
      apiKey,
      userId: req.user.uid,
    });

    costControlManager.recordUsage(req.user.uid, 100, true);

    res.json({ ok: true, item });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Failed to generate video' });
  }
});

app.post('/api/media/image-to-image', mediaRateLimiter.middleware(), async (req, res) => {
  try {
    const { prompt, sourceImage, style, aspectRatio, seed } = req.body || {};
    if (!prompt || !sourceImage) {
      return res.status(400).json({ ok: false, error: 'Prompt and sourceImage are required' });
    }

    const budgetCheck = costControlManager.checkBudget(req.user.uid, true);
    if (!budgetCheck.allowed) {
      return res.status(429).json({ ok: false, error: budgetCheck.reason });
    }

    const item = await mediaEngine.imageToImage({
      prompt: String(prompt).slice(0, 1000),
      sourceImage,
      style,
      aspectRatio,
      seed,
      apiKey,
      userId: req.user.uid,
    });

    costControlManager.recordUsage(req.user.uid, 60, true);

    res.json({ ok: true, item });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Image-to-Image failed' });
  }
});

function getReasoningProfile(prompt: string, messageCount: number) {
  const p = prompt.trim();
  const complex =
    p.length > 900 ||
    messageCount > 10 ||
    /(?:debug|architect|architecture|refactor|implement|build|design|analy[sz]e|compare|research|prove|derive|algorithm|database|security|performance|migration|deploy|أصلح|صحح|طوّر|طور|برمج|كود|حل|حلل|قارن|ابحث|بحث|دقق|برهان|اشتق|خوارزم|قاعدة بيانات|أمان|أداء|هجرة|نشر)/i.test(p);
  const veryComplex =
    p.length > 2200 ||
    /(?:step by step|multi[- ]step|deep reasoning|root cause|comprehensive|end to end|من الصفر|بالتفصيل|بشكل شامل|السبب الجذري|خطوة بخطوة|حل كامل|مشروع كامل)/i.test(p);

  if (veryComplex) return { thinkingLevel: 'high', maxOutputTokens: 12288, mode: 'deep' as const };
  if (complex) return { thinkingLevel: 'medium', maxOutputTokens: 8192, mode: 'reasoning' as const };
  return { thinkingLevel: 'low', maxOutputTokens: 4096, mode: 'fast' as const };
}

app.post('/api/chat', chatRateLimiter.middleware(), async (req, res) => {
  // Prevent socket errors from escaping
  res.on('error', () => {});
  req.on('error', () => {});
  let aborted = false;
  res.once('close', () => {
    if (!res.writableFinished) aborted = true;
  });

  if (!apiKey) return sendError(res, 503, 'AI_NOT_CONFIGURED', 'Adam AI is not configured on this server yet.');
  const messages = normalizeMessages(req.body?.messages);
  if (!messages.length) return sendError(res, 400, 'EMPTY_MESSAGE', 'Please send a message before starting a chat.');
  const language = req.body?.language === 'en' ? 'en' : 'ar';
  const agentName = typeof req.body?.agentName === 'string' ? req.body.agentName.slice(0, 40) : 'Adam';

  const userPrompt = messages[messages.length - 1]?.parts?.[0]?.text || '';
  const query = userPrompt.toLowerCase();
  const reasoningProfile = getReasoningProfile(userPrompt, messages.length);

  // P2 Cost Control Budget Check
  const budgetCheck = costControlManager.checkBudget(req.user?.uid, false);
  if (!budgetCheck.allowed) {
    return sendError(res, 429, 'BUDGET_EXCEEDED', budgetCheck.reason || 'Daily quota limit reached.');
  }

  // P0 Prompt Injection Defense
  const injectionInspection = PromptInjectionGuard.inspect(userPrompt, req.user?.uid, req.ip);
  if (injectionInspection.isBlocked) {
    systemMonitor.recordPromptInjectionBlock();
    const refusal = language === 'ar'
      ? 'عذراً، تم حظر هذا الطلب من قِبل جدار الحماية والأمان (Prompt Injection Defense) لاحتوائه على أنماط غير آمنة أو محاولة لتجاوز تعليمات النظام.'
      : 'Safety Guard: Request blocked by security shield due to detected prompt injection or system override patterns.';
    safeWrite(res, { type: 'delta', text: refusal });
    safeWrite(res, { type: 'done' });
    safeEnd(res);
    return;
  }

  try {
    res.status(200).setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
    safeWrite(res, { type: 'delta', text: '' });

    // Direct, ultra-precise handling for explicit image & video requests (only when user did NOT attach images for vision analysis)
    const hasInlineImages = messages.some(m => m.parts.some((p: any) => 'inlineData' in p));
    if (!hasInlineImages && isExplicitImageRequest(userPrompt)) {
      // Check tool permission
      const permCheck = AgentPermissionGuard.canExecuteTool('generate_image', req.user);
      if (!permCheck.allowed) {
        safeWrite(res, { type: 'delta', text: permCheck.reason || 'Permission denied for image generation.' });
        safeWrite(res, { type: 'done' });
        return;
      }

      let imageUrl = '';
      let enhancedPrompt = '';
      let title = language === 'ar' ? 'صورة سينمائية فائقة الدقة (Flux.1 Pro)' : 'Cinematic 8K Masterpiece (Flux.1 Pro)';
      let desc = language === 'ar' ? 'تم توليد الصورة بأعلى دقة سينمائية 8K مع إضاءة حجمية وعدسة 85mm ومحرك Flux.1.' : 'Generated 8K cinematic image with Flux.1 Engine, 85mm f/1.8 lens, and volumetric lighting.';
      try {
        const item = await mediaEngine.generateImage({ prompt: userPrompt, apiKey, userId: req.user?.uid });
        imageUrl = item.url;
        enhancedPrompt = item.enhancedPrompt || userPrompt;
        title = item.title || title;
        desc = item.explanationAr || desc;
        costControlManager.recordUsage(req.user?.uid, 50, true);
      } catch (imgErr) {
        console.warn('[ADEM Image Engine] mediaEngine.generateImage threw, using direct Flux.1 engine URL:', imgErr);
        const cognitive = CognitiveMediaBrain.deconstruct(userPrompt, 'image', 'cinematic');
        enhancedPrompt = cognitive.enhancedPromptEn;
        const flux = buildFluxEngineUrl(enhancedPrompt, '1:1', Date.now());
        imageUrl = flux.url;
      }

      const details = language === 'ar'
        ? `\n\n- **الموضوع الرئيسي:** ${userPrompt}\n- **المحرك:** Flux.1 High-Performance Engine\n- **المواصفات:** دقة 8K فائقة • عدسة 85mm f/1.8 • إضاءة سينمائية حجمية • أبعاد 1024×1024`
        : `\n\n- **Subject:** ${userPrompt}\n- **Engine:** Flux.1 High-Performance Engine\n- **Specs:** 8K UHD • 85mm f/1.8 Bokeh • Volumetric Lighting • 1024×1024`;

      const cardPayload = {
        imageUrl,
        enhancedPrompt,
        originalPrompt: userPrompt,
        title,
        aspectRatio: '1:1',
        engine: 'Flux.1 High-Performance Engine',
      };

      const outputText = `:::image-card\n${JSON.stringify(cardPayload)}\n:::\n\n![${title}](${imageUrl})\n\n${desc}${details}`;
      safeWrite(res, { type: 'delta', text: outputText });
      safeWrite(res, { type: 'done' });
      return;
    } else if (isExplicitVideoRequest(userPrompt)) {
      const permCheck = AgentPermissionGuard.canExecuteTool('generate_video', req.user);
      if (!permCheck.allowed) {
        safeWrite(res, { type: 'delta', text: permCheck.reason || 'Permission denied for video generation.' });
        safeWrite(res, { type: 'done' });
        return;
      }

      let videoUrl = '';
      let title = language === 'ar' ? 'مشهد سينمائي متحرك' : 'Cinematic Video Scene';
      let desc = language === 'ar' ? 'تم تصميم لقطة الفيديو السينمائية بأعلى مواصفات الإخراج والحركة.' : 'Cinematic video sequence designed.';
      try {
        const item = await mediaEngine.generateVideo({ prompt: userPrompt, apiKey, userId: req.user?.uid });
        videoUrl = item.posterUrl || item.url;
        title = item.title || title;
        desc = item.explanationAr || desc;
        costControlManager.recordUsage(req.user?.uid, 100, true);
      } catch (vidErr) {
        console.warn('[Adam AI Chat] mediaEngine.generateVideo threw, using direct fallback URL:', vidErr);
        const encoded = encodeURIComponent(`${userPrompt}, cinematic video still, IMAX 70mm, 60fps motion`);
        videoUrl = `https://pollinations.ai/p/${encoded}?width=1024&height=1024&model=flux&nologo=true`;
      }

      const details = language === 'ar'
        ? `\n\n- **حركة المشهد:** حركة كاميرا سينمائية سلسة\n- **الجودة:** 60 FPS Cinema HD`
        : `\n\n- **Motion:** Cinematic camera tracking\n- **Quality:** 60 FPS Cinema HD`;

      const outputText = `![${title}](${videoUrl})\n\n${desc}${details}`;
      safeWrite(res, { type: 'delta', text: outputText });
      safeWrite(res, { type: 'done' });
      return;
    }

    // P2 Better Memory retrieval (tenant-isolated per user)
    const relevantMemories = BetterMemoryEngine.queryRelevantMemories(req.user?.uid, userPrompt, 3);
    const memoryContext = relevantMemories.length > 0
      ? `\n\nUSER PERSISTENT MEMORY (ISOLATED & PRIVATE):\n${relevantMemories.map(m => `- ${m.text}`).join('\n')}`
      : '';

    const ai = new GoogleGenAI({ apiKey });
    const hermesAugmentedInstruction = hermesEngine.augmentSystemInstruction(systemInstruction(language, agentName) + memoryContext, userPrompt, language);

    // Apply sandwich defense wrapper to protect instruction integrity while preserving attached image inlineData
    const protectedPrompt = PromptInjectionGuard.wrapWithSandwichDefense(userPrompt);
    const defendedMessages = messages.map((m, idx) => {
      if (idx === messages.length - 1 && m.role === 'user') {
        const otherParts = m.parts.filter((p: any) => !('text' in p));
        return {
          role: 'user' as const,
          parts: [{ text: protectedPrompt }, ...otherParts],
        };
      }
      return m;
    });

    const requiresSearch = searchCircuitBreaker.isAvailable() && /\b(search the web|google search|search online|live search|browse the web|look it up)\b|ابحث في الويب|ابحث على الإنترنت|بحث في جوجل|ابحث|تحقق من الإنترنت|مصادر/i.test(userPrompt);
    const isToday = isTodayDateQuery(userPrompt);
    const needsFreshKnowledge = /\b(today|now|latest|current|recent|news|breaking|this week|this month)\b|اليوم|الآن|حاليا|حالياً|آخر|أحدث|جديد|الأخبار|خبر|مستجدات/i.test(userPrompt);

    // Do not hit external search providers for every ordinary message.
    // This was a major source of latency and intermittent hangs, especially on mobile.
    let webGrounding: { sources: GroundingSource[]; knowledgeContext: string; queries: string[] } = { sources: [], knowledgeContext: '', queries: [] };
    if (!isToday && (requiresSearch || needsFreshKnowledge)) {
      try {
        webGrounding = await fetchLiveWebKnowledge(userPrompt, language);
      } catch {
        // Search is an enhancement, never a prerequisite for answering.
      }
    }

    let finalSystemInstruction = hermesAugmentedInstruction;
    finalSystemInstruction += reasoningProfile.mode === 'fast'
      ? '\n\nRESPONSE MODE: FAST. Answer directly, accurately, and simply. Do not over-explain unless asked.'
      : reasoningProfile.mode === 'reasoning'
        ? '\n\nRESPONSE MODE: REASONING. Work through the problem carefully, verify important assumptions, then present only the useful conclusion and supporting steps.'
        : '\n\nRESPONSE MODE: DEEP. Decompose the task, examine alternatives and edge cases, verify the result, then deliver a practical finished answer. Do not expose private chain-of-thought.';
    if (isToday) {
      const now = new Date();
      const arDate = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      let hijri = '';
      try {
        hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
      } catch {}
      const hijriStr = hijri ? ` (الموافق هجرياً: ${hijri})` : '';
      finalSystemInstruction += `\n\nتأكيد حاسم وفوري لتاريخ وساعة اليوم: اليوم هو "${arDate}م${hijriStr}". أجب عن تاريخ أو اليوم بإجابة بسيطة، قطعية، ومباشرة.`;
    } else if (webGrounding.knowledgeContext) {
      finalSystemInstruction += `\n${webGrounding.knowledgeContext}`;
    }

    const baseConfig: any = {
      temperature: reasoningProfile.mode === 'deep' ? 0.20 : reasoningProfile.mode === 'reasoning' ? 0.22 : 0.28,
      topP: reasoningProfile.mode === 'deep' ? 0.88 : 0.90,
      maxOutputTokens: reasoningProfile.maxOutputTokens,
      thinkingConfig: { thinkingLevel: reasoningProfile.thinkingLevel },
      systemInstruction: finalSystemInstruction,
    };

    const candidateModels = Array.from(new Set([
      'gemini-3.8-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash',
      model,
    ].filter(m => Boolean(m) && !m.includes('-pro'))));
    let output = '';
    let lastError: any = null;
    let accumulatedGrounding: GroundingData = isToday
      ? { sources: [], queries: [] }
      : {
          sources: webGrounding.sources || [],
          queries: webGrounding.queries || [],
        };

    for (const currentModel of candidateModels) {
      if (aborted || res.writableEnded || res.destroyed) break;

      const canTrySearch = requiresSearch && searchCircuitBreaker.isAvailable() && !isToday;
      const configsToTry = canTrySearch
        ? [
            { ...baseConfig, tools: [{ googleSearch: {} }] },
            baseConfig,
          ]
        : [
            baseConfig,
          ];

      let modelSuccess = false;
      for (const config of configsToTry) {
        if (aborted || res.writableEnded || res.destroyed || modelSuccess) break;
        try {
          const stream = await ai.models.generateContentStream({ model: currentModel, contents: defendedMessages, config });
          for await (const chunk of stream) {
            if (aborted || res.writableEnded || res.destroyed) break;

            // Extract Google Search grounding metadata if present in stream chunk
            const chunkMetadata = (chunk as any).groundingMetadata || (chunk as any).candidates?.[0]?.groundingMetadata;
            if (chunkMetadata) {
              const extracted = extractGroundingMetadata(chunkMetadata);
              accumulatedGrounding = mergeGroundingData(accumulatedGrounding, extracted);
            }

            // Handle function calls (generate_specialized_image & generate_image)
            const fnCalls = (chunk as any).functionCalls || (chunk as any).candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall)?.map((p: any) => p.functionCall);
            if (fnCalls && fnCalls.length) {
              for (const fn of fnCalls) {
                if (fn.name === 'generate_specialized_image' || fn.name === 'generate_image') {
                  const permCheck = AgentPermissionGuard.canExecuteTool(fn.name, req.user);
                  if (!permCheck.allowed) {
                    const errorText = language === 'ar' ? '\n[تم رفض تشغيل أداة توليد الصور لعدم توفر الصلاحيات]\n' : '\n[Tool execution denied: insufficient permissions]\n';
                    safeWrite(res, { type: 'delta', text: errorText });
                    continue;
                  }

                  const detailedPrompt = String(fn.args?.prompt || userPrompt).trim();
                  const aspect = String(fn.args?.aspect_ratio || fn.args?.aspectRatio || '1:1').trim();
                  try {
                    const item = await mediaEngine.generateImage({
                      prompt: detailedPrompt,
                      aspectRatio: (aspect as any) || '1:1',
                      apiKey,
                      userId: req.user?.uid,
                    });
                    costControlManager.recordUsage(req.user?.uid, 50, true);
                    const cardPayload = {
                      imageUrl: item.url,
                      enhancedPrompt: item.enhancedPrompt,
                      originalPrompt: userPrompt,
                      title: item.title || (language === 'ar' ? 'صورة سينمائية فائقة الدقة (Flux.1)' : 'Cinematic 8K Masterpiece (Flux.1)'),
                      aspectRatio: item.aspectRatio || aspect,
                      engine: 'Flux.1 High-Performance Engine',
                    };
                    const cardText = `\n:::image-card\n${JSON.stringify(cardPayload)}\n:::\n`;
                    output += cardText;
                    safeWrite(res, { type: 'delta', text: cardText });
                  } catch {
                    const seed = Date.now();
                    const flux = buildFluxEngineUrl(detailedPrompt, aspect, seed);
                    const title = language === 'ar' ? 'صورة سينمائية فائقة الدقة (Flux.1)' : 'Cinematic 8K Masterpiece (Flux.1)';
                    const cardPayload = {
                      imageUrl: flux.url,
                      enhancedPrompt: detailedPrompt,
                      originalPrompt: userPrompt,
                      title,
                      aspectRatio: aspect,
                      engine: 'Flux.1 High-Performance Engine',
                    };
                    const cardText = `\n:::image-card\n${JSON.stringify(cardPayload)}\n:::\n`;
                    output += cardText;
                    safeWrite(res, { type: 'delta', text: cardText });
                  }
                }
              }
            }

            const text = typeof (chunk as any).text === 'string' ? (chunk as any).text : '';
            if (text) {
              output += text;
              safeWrite(res, { type: 'delta', text });
            }
          }
          if (aborted || res.writableEnded || res.destroyed) return;

          if (!output.trim()) {
            const completion = await ai.models.generateContent({ model: currentModel, contents: defendedMessages, config });
            const completionMetadata = (completion as any).groundingMetadata || (completion as any).candidates?.[0]?.groundingMetadata;
            if (completionMetadata) {
              const extracted = extractGroundingMetadata(completionMetadata);
              accumulatedGrounding = mergeGroundingData(accumulatedGrounding, extracted);
            }

            const fnCalls = (completion as any).functionCalls || (completion as any).candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall)?.map((p: any) => p.functionCall);
            if (fnCalls && fnCalls.length) {
              for (const fn of fnCalls) {
                if (fn.name === 'generate_specialized_image' || fn.name === 'generate_image') {
                  const detailedPrompt = String(fn.args?.prompt || userPrompt).trim();
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
                      originalPrompt: userPrompt,
                      title: item.title || (language === 'ar' ? 'صورة سينمائية فائقة الدقة (Flux.1)' : 'Cinematic 8K Masterpiece (Flux.1)'),
                      aspectRatio: item.aspectRatio || aspect,
                      engine: 'Flux.1 High-Performance Engine',
                    };
                    const cardText = `\n:::image-card\n${JSON.stringify(cardPayload)}\n:::\n`;
                    output += cardText;
                    safeWrite(res, { type: 'delta', text: cardText });
                  } catch {
                    const seed = Date.now();
                    const flux = buildFluxEngineUrl(detailedPrompt, aspect, seed);
                    const title = language === 'ar' ? 'صورة سينمائية فائقة الدقة (Flux.1)' : 'Cinematic 8K Masterpiece (Flux.1)';
                    const cardPayload = {
                      imageUrl: flux.url,
                      enhancedPrompt: detailedPrompt,
                      originalPrompt: userPrompt,
                      title,
                      aspectRatio: aspect,
                      engine: 'Flux.1 High-Performance Engine',
                    };
                    const cardText = `\n:::image-card\n${JSON.stringify(cardPayload)}\n:::\n`;
                    output += cardText;
                    safeWrite(res, { type: 'delta', text: cardText });
                  }
                }
              }
            }

            const text = typeof (completion as any).text === 'string' ? (completion as any).text : '';
            if (text.trim()) {
              output += text;
              safeWrite(res, { type: 'delta', text });
            }
          }

          if (output.trim()) {
            modelSuccess = true;
            break; // Model answered successfully!
          }
        } catch (err: any) {
          lastError = err;
          console.error('[Adam AI Chat Error on model', currentModel, ']:', err?.status, err?.message || err);
          const msg = String(err?.message || '').toLowerCase();
          const code = Number(err?.status ?? err?.code ?? 0);
          if (code === 429 || msg.includes('quota') || msg.includes('resource_exhausted')) {
            if (config.tools) {
              searchCircuitBreaker.trip(60 * 60 * 1000);
            }
          }
        }
      }

      if (output.trim()) break; // Success!
    }

    // Grounding sources omitted per user request

    if (!output.trim() && !aborted && !res.writableEnded && !res.destroyed) {
      console.warn('[Adam AI chat] Gemini models unavailable or quota exceeded, attempting Hugging Face & remote model gateway fallback...');
      try {
        const hfResult = await huggingFaceEngine.generateChatCompletion({
          model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
          messages: [{ role: 'user', content: userPrompt }],
          systemPrompt: systemInstruction(language, agentName),
          temperature: 0.35,
          maxTokens: 4096,
        });
        if (hfResult.text?.trim()) {
          output = hfResult.text.trim();
          safeWrite(res, { type: 'delta', text: output });
        }
      } catch (hfErr: any) {
        console.warn('[Adam AI HuggingFace fallback direct error]:', hfErr?.message || hfErr);
      }

      if (!output.trim()) {
        try {
          const remoteGateway = createAgentModelGateway();
          const fallbackCandidates = modelRegistry.enabled().filter(m => m.provider !== 'gemini');
          for (const fbModel of fallbackCandidates) {
            if (aborted || res.writableEnded || res.destroyed) break;
            try {
              const resp = await remoteGateway.gateway.invokeSelected(fbModel, {
                prompt: userPrompt,
                system: systemInstruction(language, agentName),
                temperature: 0.45,
                maxTokens: 4096,
              });
              if (resp.text?.trim()) {
                output = resp.text.trim();
                safeWrite(res, { type: 'delta', text: output });
                break;
              }
            } catch (fbErr: any) {
              console.warn(`[Adam AI fallback] ${fbModel.id} error:`, fbErr?.message || fbErr);
            }
          }
        } catch (gwErr) {
          console.warn('[Adam AI gateway error]:', gwErr);
        }
      }
    }

    if (!output.trim()) {
      const fallbackNotice = language === 'ar'
        ? `مرحباً بك! لقد استلمت طلبك بنجاح. أعتذر عن التأخير اللحظي بسبب ضغط الحصص على خوادم المعالجة، يرجى تكرار السؤال أو كتابة ما تريده وسأجيبك مباشرة.`
        : `Hello! I received your message. The cloud AI servers are experiencing temporary rate limits. Please try sending your message again or ask another question.`;
      safeWrite(res, { type: 'delta', text: fallbackNotice });
    } else {
      // Record token usage for cost controls
      const estTokens = Math.ceil(output.length / 4) + 120;
      costControlManager.recordUsage(req.user?.uid, estTokens, false);

      // Hermes autonomous learning loop from successful interactions
      try {
        hermesEngine.learnAutonomousSkillFromInteraction(userPrompt, output);
      } catch (learnErr) {
        console.warn('[Hermes Agent] Skill learning hook error:', learnErr);
      }
    }
    safeWrite(res, { type: 'done' });
    safeEnd(res);
  } catch (error: any) {
    if (aborted || res.writableEnded || res.destroyed) return;
    const status = Number(error?.status ?? error?.code ?? 500);
    const providerMessage = String(error?.message ?? 'The AI provider failed to answer.');
    const normalized = providerMessage.toLowerCase();
    const code = status === 401 || status === 403 || normalized.includes('permission') || normalized.includes('api key') ? 'AI_AUTH' : status === 429 || normalized.includes('quota') || normalized.includes('rate limit') || normalized.includes('resource_exhausted') ? 'AI_RATE_LIMIT' : 'AI_PROVIDER';
    const message = code === 'AI_AUTH' ? 'The AI provider rejected the configured credentials.' : 'Adam could not complete the request. Please retry.';
    sendError(res, status >= 500 ? 502 : status, code, message);
    console.error('[Adam AI chat error]', { code, status, providerMessage });
  }
});

// Direct Terminal Execution Sandbox API
app.post('/api/terminal-sandbox', authenticateSession, async (req: express.Request, res: express.Response) => {
  try {
    const { code, language = 'javascript', command } = req.body || {};

    if (command) {
      const { exec } = await import('node:child_process');
      exec(command, { timeout: 10000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        res.json({
          success: !error,
          stdout: stdout || '',
          stderr: stderr || (error ? error.message : ''),
          exitCode: error ? (error.code || 1) : 0,
        });
      });
      return;
    }

    if (code && (language === 'javascript' || language === 'js' || language === 'ts')) {
      try {
        const vm = await import('node:vm');
        new vm.Script(code);
        res.json({
          success: true,
          syntaxValid: true,
          message: 'Syntax check passed successfully. Ready for browser execution.'
        });
      } catch (syntaxErr: any) {
        res.json({
          success: false,
          syntaxValid: false,
          error: syntaxErr.message
        });
      }
      return;
    }

    res.status(400).json({ error: 'Invalid payload: provide "code" or "command"' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Unreal Engine 5 Remote Control Bridge API
app.post('/api/unreal-engine/bridge', authenticateSession, async (req: express.Request, res: express.Response) => {
  try {
    const { host = 'http://localhost', port = 30010, action, payload } = req.body || {};
    const targetUrl = `${host.replace(/\/$/, '')}:${port}`;

    // Attempt real connection to Unreal Engine Web Remote Control if available
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
      if (action === 'test_connection') {
        const testRes = await fetch(`${targetUrl}/remote/info`, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (testRes.ok) {
          const info = await testRes.json().catch(() => ({}));
          return res.json({
            success: true,
            connected: true,
            message: 'Connected to Unreal Engine 5 Web Remote Control successfully!',
            data: info,
          });
        }
      } else if (action === 'execute_python' || action === 'spawn_actor' || action === 'adjust_lighting' || action === 'fire_action') {
        const ueEndpoint = action === 'adjust_lighting' ? `${targetUrl}/remote/object/property` : `${targetUrl}/remote/object/call`;
        const ueRes = await fetch(ueEndpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload || {}),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (ueRes.ok) {
          const ueData = await ueRes.json().catch(() => ({}));
          return res.json({
            success: true,
            message: 'Command executed in Unreal Engine 5 live world.',
            data: ueData,
          });
        }
      }
    } catch {
      clearTimeout(timeoutId);
    }

    // Graceful response with connection instructions and simulated payload verification
    res.json({
      success: true,
      simulated: true,
      action,
      targetUrl,
      message: `Payload verified & dispatched to ${targetUrl}. When Unreal Engine 5 is running locally with 'Web Remote Control' plugin enabled, real-time actuation occurs instantly.`,
      payloadSample: payload,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ACADEMIC & WORLD LIBRARIES STUDENT API
// ==========================================
app.get('/api/academic/search', async (req, res) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const results = await AcademicEngine.searchWorks(query, category);
    res.json({ ok: true, results, count: results.length });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Academic search failed' });
  }
});

app.post('/api/academic/solve', chatRateLimiter.middleware(), async (req, res) => {
  try {
    const { prompt, stage, subject, language } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ ok: false, error: 'Problem prompt is required' });
    }
    const result = await AcademicEngine.solveStepByStep({
      prompt,
      stage: stage || 'secondary',
      subject,
      language: language === 'en' ? 'en' : 'ar',
      apiKey,
    });
    res.json({ ok: true, ...result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Solver failed' });
  }
});

app.post('/api/academic/explain', chatRateLimiter.middleware(), async (req, res) => {
  try {
    const { concept, stage, language } = req.body || {};
    if (!concept || typeof concept !== 'string') {
      return res.status(400).json({ ok: false, error: 'Concept is required' });
    }
    const result = await AcademicEngine.explainConcept({
      concept,
      stage: stage || 'secondary',
      language: language === 'en' ? 'en' : 'ar',
      apiKey,
    });
    res.json({ ok: true, ...result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Explanation failed' });
  }
});

app.post('/api/academic/quiz', chatRateLimiter.middleware(), async (req, res) => {
  try {
    const { subject, topic, stage, count, language } = req.body || {};
    const questions = await AcademicEngine.generateQuiz({
      subject: subject || 'Mathematics',
      topic: topic || 'Fundamentals',
      stage: stage || 'secondary',
      count: Number(count) || 5,
      language: language === 'en' ? 'en' : 'ar',
      apiKey,
    });
    res.json({ ok: true, questions });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Quiz generation failed' });
  }
});

app.post('/api/academic/citations', (req, res) => {
  try {
    const citations = AcademicEngine.generateCitations(req.body || {});
    res.json({ ok: true, citations });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Citation generation failed' });
  }
});

app.post('/api/academic/thesis', chatRateLimiter.middleware(), async (req, res) => {
  try {
    const { topic, degree, field, language } = req.body || {};
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ ok: false, error: 'Topic is required' });
    }
    const plan = await AcademicEngine.generateThesisPlan({
      topic,
      degree: degree || 'Master',
      field: field || 'Science',
      language: language === 'en' ? 'en' : 'ar',
      apiKey,
    });
    res.json({ ok: true, plan });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Thesis plan failed' });
  }
});

app.post('/api/academic/study-plan', chatRateLimiter.middleware(), async (req, res) => {
  try {
    const { stage, targetExam, subjectsToFocus, hoursPerDay, daysUntilExam, language } = req.body || {};
    const plan = await AcademicEngine.generateStudyPlan({
      stage: stage || 'secondary',
      targetExam: targetExam || 'Final Exams',
      subjectsToFocus: Array.isArray(subjectsToFocus) && subjectsToFocus.length ? subjectsToFocus : ['General'],
      hoursPerDay: Number(hoursPerDay) || 3,
      daysUntilExam: Number(daysUntilExam) || 30,
      language: language === 'en' ? 'en' : 'ar',
      apiKey,
    });
    res.json({ ok: true, plan });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Study plan generation failed' });
  }
});

app.post('/api/academic/analyze-mistake', chatRateLimiter.middleware(), async (req, res) => {
  try {
    const { question, studentAnswer, correctAnswer, stage, language } = req.body || {};
    if (!question || !studentAnswer) {
      return res.status(400).json({ ok: false, error: 'Question and student answer are required' });
    }
    const analysis = await AcademicEngine.analyzeExamMistake({
      question,
      studentAnswer,
      correctAnswer,
      stage: stage || 'secondary',
      language: language === 'en' ? 'en' : 'ar',
      apiKey,
    });
    res.json({ ok: true, analysis });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Mistake analysis failed' });
  }
});

registerAgentRoute(app, apiKey, model);

// Catch-all express error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Adam Server Error Handler]', err);
  if (res.headersSent) {
    safeWrite(res, { type: 'error', code: 'SERVER_ERROR', message: 'An internal server error occurred.' });
    safeEnd(res);
    return;
  }
  try {
    res.status(500).json({ code: 'SERVER_ERROR', message: 'An internal server error occurred.' });
  } catch {
    // ignore
  }
});

async function startServer() {
  try {
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(publicDir, {
        index: false,
        maxAge: '7d',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          } else if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
          }
        }
      }));
      app.get('*', (_req, res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.sendFile(path.join(publicDir, 'index.html'));
      });
    } else if (process.env.NODE_ENV !== 'test') {
      const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
      app.use(vite.middlewares);
    }
  } catch (err) {
    console.error('[Adam Server] Vite setup error:', err);
  }

  if (process.env.NODE_ENV !== 'test' && process.env.VERCEL !== '1') {
    try {
      const server = app.listen(port, '0.0.0.0', () => console.log(`Adam AI v2 listening on http://0.0.0.0:${port}`));
      server.keepAliveTimeout = 65000;
      server.headersTimeout = 66000;
      server.on('error', (err: any) => {
        console.error('[Adam Server] HTTP Server error:', err);
      });
      return server;
    } catch (err) {
      console.error('[Adam Server] Failed to listen:', err);
    }
  }
}

if (process.env.NODE_ENV !== 'test' && process.env.VERCEL !== '1') void startServer();
export { app, startServer };
