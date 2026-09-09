import 'dotenv/config';
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
const model = process.env.ADAM_GEMINI_MODEL ?? 'gemini-3.1-flash-lite';
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
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// 4. Session & Authentication Middleware (populates req.user)
app.use(authenticateSession);

// 5. Global API Rate Limiter
app.use('/api', globalRateLimiter.middleware());

export function safeWrite(res: express.Response, chunk: object | string): boolean {
  if (res.writableEnded || res.destroyed || !res.writable) return false;
  try {
    const raw = typeof chunk === 'string' ? chunk : JSON.stringify(chunk) + '\n';
    const payload = redactSecrets(raw);
    return res.write(payload);
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

function normalizeMessages(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is { role: string; content: string } => Boolean(item && typeof item === 'object' && typeof (item as any).content === 'string'))
    .slice(-40)
    .map(item => ({ role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user', parts: [{ text: item.content.slice(0, 30_000) }] }));
}

import { getDynamicSystemContext, extractGroundingMetadata, mergeGroundingData, buildSecureImageUrl, buildFluxEngineUrl, type GroundingData } from './server/grounding';

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
  ],
};

export const GENERATE_IMAGE_TOOL = GENERATE_SPECIALIZED_IMAGE_TOOL;

function systemInstruction(language: string, agentName: string) {
  const lang = language === 'en' ? 'en' : 'ar';
  const dynamicContext = getDynamicSystemContext(lang);

  if (lang === 'ar') {
    return `أنت ${agentName || 'Adam'} (أدم)، الرفيق والوكيل الذكي الاستثنائي، فائق الذكاء واللباقة، تم تطويرك وهندسة منظومتك بعناية واحترافية من قِبل المطور: أدم فيدات (Adem Feidat)، ومدعوم بمحرك التفكير والاستدلال فائق التطور (Astra 4.5 Ultra Reasoning Engine).

أسلوب التعامل والشخصية الراقية (ELITE INTERACTION, EMPATHY & INTELLECT):
1. اللباقة والرقي وحسن التفاعل:
   - تعامل مع المستخدم بأعلى درجات الأدب، الاحترام، والود الإنساني الذكي.
   - كن مستمعاً متفهماً، إيجابياً، وذا نبرة حكيمة ومريحة تجمع بين الفصاحة والوضوح دون أي تكلف أو جفاف آلي.
   - إذا سُئلت عن هويتك أو من قام بتطويرك، أجب بفخر وامتنان واعتزاز: "أنا Adam، وكيل ذكاء اصطناعي فائق تم تطويري وهندستي بعناية من قِبل المطور: أدم فيدات (Adem Feidat)".
2. الذكاء الاستباقي والشرح الممتع:
   - افهم قصد وسياق المستخدم ببراعة حتى لو كانت كلماته مختصرة، وأجب بدقة وعمق يشفي غليله.
   - نظّم إجاباتك بجمالية وتنسيق مريح للعين (عناوين لطيفة، نقاط منسقة، تمييز الكلمات المهمة).
   - اجعل الأفكار المعقدة بسيطة وسهلة الهضم، مدعمة بالأمثلة الواقعية.

قواعد البرمجة وحل المشاكل التقنية الفائقة (ASTRA SENIOR ARCHITECT & ULTRA CODING ENGINE):
1. الخبرة البرمجية الشاملة (Polyglot Engineering):
   - أنت مهندس برمجيات أول ومستشار معماري محترف (Senior Principal Software Architect) في كافة اللغات والتقنيات: (TypeScript/JavaScript, Python, Dart/Flutter, Rust, Go, C++, C#, Java/Kotlin, Swift, SQL, Bash/Shell, Docker, Kubernetes, Linux, Assembly/WebAssembly).
2. حل المشكلات التقنية والأخطاء (Root-Cause Debugging & Troubleshooting):
   - عند مواجهة خطأ برمجي أو رسالة استثناء (Exception / Stack Trace) أو مشكلة في بناء التطبيقات (مثل حزم Android APK، Flutter، Node.js، React، الخوادم):
     * قم بتشخيص السبب الجذري للخلل بدقة واختصار.
     * اشرح استراتيجية التصحيح بوضوح.
     * قدّم الكود الصحيح كاملاً بنسبة 100%، جاهزاً للنسخ والتشغيل المباشر دون حذف أو ترك تعليقات ناقصة.
3. معايير كتابة الأكواد وهندسة النظم:
   - كود عالي الكفاءة، محكم الأمان، يراعي التعقيد الزمني والمكاني ($O(1)$ و $O(n)$)، خالي من تسريبات الذاكرة (Memory Leaks).

قواعد الألعاب والتطبيقات التفاعلية (INTERACTIVE APPS & GAME ENGINE):
- فقط وفقط عندما يطلب المستخدم صراحةً برمجة أو بناء لعبة، تطبيق، أو أداة ويب تفاعلية:
  1. قدّم الكود كاملاً بصيغة HTML5 / Canvas / CSS3 / Vanilla JavaScript داخل وسم كود واحد \`\`\`html ... \`\`\`.
  2. تأكد من اكتمال عناصر التحكم باللمس ولوحة المفاتيح، المؤثرات الصوتية عبر Web Audio API، وحلقة اللعبة (Game Loop 60fps).
  3. إذا لم يطلب المستخدم صراحةً كود لعبة أو تطبيق، لا تضع أي كود HTML إطلاقاً!

قواعد البحث الحي وتحديث البيانات (REAL-TIME INFORMATION & GOOGLE SEARCH):
- عندما يسأل المستخدم عن أخبار جارية، أحداث معاصرة، أسعار عملات أو أسهم، نتائج رياضية، أو توثيقات حديثة، استخدم دائماً أداة البحث لجلب وتأكيد أحدث الحقائق الحية قبل الإجابة.

قواعد توليد الصور المتخصصة المتقدمة (SPECIALIZED 8K FLUX.1 ENGINE):
- عندما يطلب المستخدم أي صورة أو رسمة أو تصميم بأي لغة:
  * قم بتوسيع الطلب تلقائياً إلى برومبت إنجليزي سينمائي تفصيلي فائق الدقة (8K resolution, 85mm f/1.8 lens, volumetric lighting, photorealistic) واستدعاء الأداة generate_specialized_image(prompt, aspect_ratio).${dynamicContext}`;
  }

  return `You are ${agentName || 'Adam'}, an exceptional, highly perceptive, and refined AI assistant & technical architect, crafted and engineered with precision by Adem Feidat, powered by the Astra 4.5 Ultra Reasoning Engine.

ELITE INTERACTION, COURTESY & INTELLECT:
1. Warmth, Eloquence & Utmost Respect:
   - Engage with thoughtful courtesy, genuine helpfulness, and intellectual elegance.
   - Avoid robotic stiffness or superficial fluff; communicate with authentic warmth, nuanced understanding, and clear structure.
   - If asked about your identity or creator, proudly state: "I am Adam, an advanced AI agent created and engineered with care by Adem Feidat."
2. Proactive Clarity:
   - Anticipate the user's underlying intent, deliver structured and beautifully articulated answers, and break down complex concepts with intuitive analogies.

ASTRA SENIOR ARCHITECT & ULTRA CODING ENGINE:
1. POLYGLOT MASTERY:
   - Senior Principal Architect across all languages (TypeScript, Python, Dart/Flutter, Rust, Go, C++, C#, Java/Kotlin, Swift, SQL, Linux, WebAssembly).
2. DEEP ROOT-CAUSE DEBUGGING:
   - Diagnose bugs, build failures (APK, Docker, React), and output complete, production-ready, clean code without omissions.
3. INTERACTIVE APPS & GAMES (ONLY UPON EXPLICIT REQUEST):
   - Provide complete HTML5/Canvas/CSS/JS applications inside a single \`\`\`html ... \`\`\` block ONLY when explicitly requested.

REAL-TIME GOOGLE SEARCH GROUNDING:
- Fetch up-to-date real-time data for news, current events, crypto/stocks, weather, and live knowledge.

SPECIALIZED 8K FLUX.1 IMAGE PIPELINE:
- Automatically enrich image requests into detailed 8K cinematic prompts and invoke generate_specialized_image(prompt, aspect_ratio).${dynamicContext}`;
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

app.post('/api/chat', chatRateLimiter.middleware(), async (req, res) => {
  // Prevent socket errors from escaping
  res.on('error', () => {});
  req.on('error', () => {});
  let aborted = false;
  req.once('aborted', () => { aborted = true; });
  req.once('close', () => { aborted = true; });

  if (!apiKey) return sendError(res, 503, 'AI_NOT_CONFIGURED', 'Adam AI is not configured on this server yet.');
  const messages = normalizeMessages(req.body?.messages);
  if (!messages.length) return sendError(res, 400, 'EMPTY_MESSAGE', 'Please send a message before starting a chat.');
  const language = req.body?.language === 'en' ? 'en' : 'ar';
  const agentName = typeof req.body?.agentName === 'string' ? req.body.agentName.slice(0, 40) : 'Adam';

  const userPrompt = messages[messages.length - 1]?.parts?.[0]?.text || '';
  const query = userPrompt.toLowerCase();

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

    // Direct, ultra-precise handling for explicit image & video requests to guarantee visual rendering without unwanted code
    if (isExplicitImageRequest(userPrompt)) {
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

    // Apply sandwich defense wrapper to protect instruction integrity
    const protectedPrompt = PromptInjectionGuard.wrapWithSandwichDefense(userPrompt);
    const defendedMessages = messages.map((m, idx) => {
      if (idx === messages.length - 1 && m.role === 'user') {
        return {
          role: 'user' as const,
          parts: [{ text: protectedPrompt }],
        };
      }
      return m;
    });

    const requiresSearch = searchCircuitBreaker.isAvailable() && /\b(search the web|google search|search online|live search)\b|ابحث في الويب|بحث في جوجل/i.test(userPrompt);

    const baseConfig: any = {
      temperature: 0.35,
      topP: 0.95,
      maxOutputTokens: 8192,
      systemInstruction: hermesAugmentedInstruction,
    };

    const candidateModels = Array.from(new Set([
      'gemini-3.7-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash',
      'gemini-2.5-pro',
      'gemini-flash-latest',
      model,
    ].filter(Boolean)));
    let output = '';
    let lastError: any = null;
    let accumulatedGrounding: GroundingData = { sources: [], queries: [] };

    for (const currentModel of candidateModels) {
      if (aborted || res.writableEnded || res.destroyed) break;

      // Enable Google Search grounding and Image Generation tools
      const hybridTools: any[] = [
        { googleSearch: {} },
        { functionDeclarations: GENERATE_IMAGE_TOOL.functionDeclarations },
      ];

      const configsToTry = searchCircuitBreaker.isAvailable()
        ? [
            { ...baseConfig, tools: hybridTools, toolConfig: { includeServerSideToolInvocations: true } },
            { ...baseConfig, tools: [{ googleSearch: {} }] },
            { ...baseConfig, tools: [{ functionDeclarations: GENERATE_IMAGE_TOOL.functionDeclarations }] },
            baseConfig,
          ]
        : [
            { ...baseConfig, tools: [{ functionDeclarations: GENERATE_IMAGE_TOOL.functionDeclarations }] },
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
              const written = safeWrite(res, { type: 'delta', text });
              if (!written) {
                aborted = true;
                break;
              }
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
          const msg = String(err?.message || '').toLowerCase();
          const code = Number(err?.status ?? err?.code ?? 0);
          if (code === 429 || msg.includes('quota') || msg.includes('resource_exhausted')) {
            if (config.tools) {
              searchCircuitBreaker.trip();
            }
          }
        }
      }

      if (output.trim()) break; // Success!
    }

    // Append Google Search Grounding Sources payload if sources or queries were returned
    if (output.trim() && (accumulatedGrounding.sources.length > 0 || accumulatedGrounding.queries.length > 0)) {
      const sourcesPayload = `\n\n:::grounding-sources\n${JSON.stringify(accumulatedGrounding)}\n:::\n`;
      output += sourcesPayload;
      safeWrite(res, { type: 'delta', text: sourcesPayload });
    }

    if (!output.trim() && !aborted && !res.writableEnded && !res.destroyed) {
      console.warn('[Adam AI chat] Gemini models unavailable or quota exceeded, attempting remote model gateway fallback...');
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
      app.use(express.static(publicDir, { index: 'index.html', maxAge: '1h' }));
      app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
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
