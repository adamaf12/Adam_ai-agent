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

// Process-level shields against unexpected crashes and unhandled promise rejections
process.on('uncaughtException', (err: any) => {
  if (err?.code === 'EPIPE' || err?.code === 'ECONNRESET' || err?.code === 'ERR_STREAM_WRITE_AFTER_END' || err?.message?.includes('aborted')) {
    return;
  }
  console.error('[Adam Server] Prevented crash from uncaught exception:', err);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[Adam Server] Prevented crash from unhandled rejection:', reason);
});

const app = express();
const port = Number(process.env.PORT ?? 3000);
const model = process.env.ADAM_GEMINI_MODEL ?? 'gemini-3.1-flash-lite';
const apiKey = process.env.GEMINI_API_KEY?.trim() ?? '';
const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'dist');

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Request-Id');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false }));

export function safeWrite(res: express.Response, chunk: object | string): boolean {
  if (res.writableEnded || res.destroyed || !res.writable) return false;
  try {
    const payload = typeof chunk === 'string' ? chunk : JSON.stringify(chunk) + '\n';
    return res.write(payload);
  } catch {
    return false;
  }
}

export function safeEnd(res: express.Response, chunk?: object | string): void {
  if (res.writableEnded || res.destroyed) return;
  try {
    if (chunk !== undefined) {
      const payload = typeof chunk === 'string' ? chunk : JSON.stringify(chunk) + '\n';
      res.end(payload);
    } else {
      res.end();
    }
  } catch {
    // Ignore stream closed errors
  }
}

function sendError(res: express.Response, status: number, code: string, message: string) {
  if (res.headersSent) {
    safeWrite(res, { type: 'error', code, message });
    safeEnd(res);
    return;
  }
  try {
    res.status(status).json({ code, message });
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
    return `أنت ${agentName || 'ADEM'}، مساعد ذكاء اصطناعي فائق التطور والذكاء في فهم أوامر وطلبات المستخدم وتنفيذها بدقة متناهية.

قواعد البحث الحي وتحديث البيانات (REAL-TIME INFORMATION & GOOGLE SEARCH):
- عندما يسأل المستخدم عن أي موضوع يتعلق بالأخبار الجارية، أحداث اليوم، الطقس، أسعار العملات أو العملات الرقمية والأسهم، نتائج المباريات، أو حقائق ومعلومات معاصرة وحديثة، يجب عليك دائماً استخدام أداة البحث في جوجل (googleSearch) لجلب وتأكيد أحدث المعلومات الحية قبل الإجابة.
- استشهد بالحقائق الدقيقة والحديثة بناءً على نتائج البحث الحي.

قواعد توليد الصور المتخصصة المتقدمة (ADVANCED SPECIALIZED IMAGE GENERATION & PROMPT ENRICHMENT):
1. طلبات الصور والرسومات والخلفيات (Specialized Image Generation Pipeline):
- عندما يطلب المستخدم أي صورة أو رسمة أو خلفية أو تصميم بأي لغة (عربية أو إنجليزية):
  * ممنوع منعاً باتاً كتابة مجرد وصف نصي أو روابط markdown بسيطة أو توليد كود برمجي (HTML/JS)!
  * يجب عليك فوراً توسيع وإثراء الطلب تلقائياً إلى برومبت إنجليزي سينمائي تفصيلي فائق الدقة (Detailed, Cinematic English Image Prompt) يتضمن بدقة:
    1. دقة فائقة 8K (8K resolution, ultra-detailed textures, photorealistic masterpiece).
    2. الإضاءة الفيزيائية (Lighting: e.g., volumetric lighting, soft studio lights, dramatic rim highlights, ray-traced reflections).
    3. الأسلوب البصري (Style: e.g., hyper-realistic photo, 3D render, architectural photography).
    4. نسبة العرض إلى الارتفاع والتركيب (Aspect Ratio: e.g., 1:1, 16:9 widescreen, 9:16 portrait).
    5. تفاصيل الكاميرا والعدسة (Camera lens details: e.g., shot on 85mm f/1.8 lens, creamy optical bokeh depth of field, razor-sharp focus on subject).
  * يجب عليك استدعاء الأداة المخصصة: generate_specialized_image(prompt, aspect_ratio) مع تمرير هذا البرومبت السينمائي الموسّع ونسبة الأبعاد المناسبة.

2. طلبات الفيديو والمشاهد السينمائية (Video Requests):
- إذا طلب المستخدم فيديو أو لقطة متحركة:
  * ممنوع توليد كود تفاعلي!
  * قم بتضمين ملصق المشهد السينمائي بصيغة Markdown:
    ![لقطة الفيديو](https://pollinations.ai/p/<ENCODED_ENGLISH_PROMPT>%2C%20cinematic%20video%20still%2C%20IMAX%2070mm?width=1024&height=1024&model=flux&nologo=true)
  * صف حركة الكاميرا والزوايا والأجواء السينمائية.

3. طلبات التطبيقات التفاعلية والأدوات والألعاب (فقط عند الطلب الصريح للبرمجة):
- فقط وفقط عندما يطلب المستخدم صراحةً وبشكل مباشر برمجة أو بناء تطبيق ويب تفاعلي أو لعبة أو آلة حاسبة:
  1. قدّم شرحاً موجزاً وواضحاً.
  2. وفّر الكود كاملاً بصيغة HTML5/CSS/JavaScript متكاملة وقابلة للتشغيل المباشر داخل وسم كود واحد \`\`\`html ... \`\`\`.
  3. تأكد من أن كامل التنسيق والأزرار وأكواد الجافاسكريبت التفاعلية مدمجة لتعمل مباشرة في المعاينة الحية.
  4. إذا لم يطلب المستخدم صراحةً برمجة تطبيق أو كود، لا تضع أي كود HTML إطلاقاً!

4. الأوامر والأسئلة العامة:
- افهم قصد المستخدم بدقة، نفذ أوامره بحذافيرها، وأجب بلغة عربية فصيحة وسليمة وعميقة دون كود غير مطلوب.${dynamicContext}`;
  }
  return `You are ${agentName || 'ADEM'}, a premier, ultra-capable AI agent with strict precision in understanding user commands and intent.

REAL-TIME INFORMATION & GOOGLE SEARCH GROUNDING:
- When the user asks about current events, today's news, weather, cryptocurrency or stock prices, sports scores, or recent facts, ALWAYS use the googleSearch tool to fetch the latest real-time information before answering.
- Ground your answers in real, verified facts from Google Search results.

ADVANCED SPECIALIZED IMAGE GENERATION & PROMPT ENRICHMENT:
1. SPECIALIZED IMAGE GENERATION PIPELINE:
- Whenever the user requests an image, photo, drawing, wallpaper, or visual creation in ANY language:
  * You MUST NOT output plain text descriptions or simple raw markdown links.
  * You MUST automatically expand and enrich the request into a detailed, cinematic English image prompt that explicitly specifies:
    1. 8K resolution (8K resolution, ultra-detailed textures, photorealistic masterpiece, pristine quality).
    2. Lighting (e.g., volumetric lighting, studio lights, soft golden hour rim light, ray-traced reflections).
    3. Style (e.g., hyper-realistic photo, 3D render, cinematic film still).
    4. Aspect ratio (e.g., 1:1, 16:9 widescreen, 9:16 portrait).
    5. Camera lens details (e.g., shot on 85mm f/1.8 lens, creamy optical bokeh depth of field, shallow focus, razor-sharp subject detail).
  * You MUST immediately invoke the function tool generate_specialized_image(prompt, aspect_ratio) with your enriched cinematic prompt and the chosen aspect_ratio.

2. VIDEO & ANIMATION REQUESTS:
- If the user asks for a video or cinematic scene:
  * Never output interactive app code!
  * Embed a cinematic still using Markdown:
    ![Cinematic Frame](https://pollinations.ai/p/<ENCODED_ENGLISH_PROMPT>%2C%20cinematic%20video%20still%2C%20IMAX%2070mm?width=1024&height=1024&model=flux&nologo=true)
  * Describe camera motion, pacing, and visual atmosphere.

3. INTERACTIVE APPS, TOOLS & GAMES (ONLY WHEN EXPLICITLY REQUESTED):
- ONLY when the user explicitly asks to code, build, or develop an interactive app, calculator, game, or web tool:
  * Provide complete, self-contained HTML5/CSS/JavaScript code inside a single \`\`\`html ... \`\`\` code block.
  * If the user did NOT explicitly request coding an app or game, DO NOT output any HTML code blocks!

4. GENERAL QUERIES & INSTRUCTIONS:
- Faithfully interpret and execute user instructions without unsolicited code generation.${dynamicContext}`;
}

app.get('/api/health', (_req, res) => res.json({ ok: true, model, configured: Boolean(apiKey), agent: true, hermes: true, media: true, version: '2.5.0' }));

app.get('/api/hermes/skills', (_req, res) => {
  res.json({ ok: true, skills: hermesEngine.getAllSkills() });
});

app.get('/api/hermes/stats', (_req, res) => {
  res.json({ ok: true, stats: hermesEngine.getStats() });
});

// Next-Gen Media Studio & Generator Endpoints
app.get('/api/media/gallery', (_req, res) => {
  res.json({ ok: true, gallery: mediaEngine.getGallery() });
});

app.delete('/api/media/:id', (req, res) => {
  const success = mediaEngine.deleteItem(req.params.id);
  res.json({ ok: success });
});

app.post('/api/media/enhance-prompt', async (req, res) => {
  try {
    const { prompt, type, style, motion, aspectRatio } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ ok: false, error: 'Prompt is required' });
    }
    const result = await mediaEngine.enhancePrompt({
      prompt,
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

app.post('/api/media/generate-image', async (req, res) => {
  try {
    const { prompt, style, aspectRatio, seed } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ ok: false, error: 'Prompt is required' });
    }
    const item = await mediaEngine.generateImage({
      prompt,
      style,
      aspectRatio,
      seed,
      apiKey,
    });
    res.json({ ok: true, item });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Failed to generate image' });
  }
});

app.post('/api/media/generate-video', async (req, res) => {
  try {
    const { prompt, style, motion, aspectRatio, duration, fps, seed } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ ok: false, error: 'Prompt is required' });
    }
    const item = await mediaEngine.generateVideo({
      prompt,
      style,
      motion,
      aspectRatio,
      duration,
      fps,
      seed,
      apiKey,
    });
    res.json({ ok: true, item });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Failed to generate video' });
  }
});

app.post('/api/media/image-to-image', async (req, res) => {
  try {
    const { prompt, sourceImage, style, aspectRatio, seed } = req.body || {};
    if (!prompt || !sourceImage) {
      return res.status(400).json({ ok: false, error: 'Prompt and sourceImage are required' });
    }
    const item = await mediaEngine.imageToImage({
      prompt,
      sourceImage,
      style,
      aspectRatio,
      seed,
      apiKey,
    });
    res.json({ ok: true, item });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Image-to-Image failed' });
  }
});

app.post('/api/chat', async (req, res) => {
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
  try {
    res.status(200).setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // Direct, ultra-precise handling for explicit image & video requests to guarantee visual rendering without unwanted code
    if (isExplicitImageRequest(userPrompt)) {
      let imageUrl = '';
      let enhancedPrompt = '';
      let title = language === 'ar' ? 'صورة سينمائية فائقة الدقة (Flux.1 Pro)' : 'Cinematic 8K Masterpiece (Flux.1 Pro)';
      let desc = language === 'ar' ? 'تم توليد الصورة بأعلى دقة سينمائية 8K مع إضاءة حجمية وعدسة 85mm ومحرك Flux.1.' : 'Generated 8K cinematic image with Flux.1 Engine, 85mm f/1.8 lens, and volumetric lighting.';
      try {
        const item = await mediaEngine.generateImage({ prompt: userPrompt, apiKey });
        imageUrl = item.url;
        enhancedPrompt = item.enhancedPrompt || userPrompt;
        title = item.title || title;
        desc = item.explanationAr || desc;
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
      let videoUrl = '';
      let title = language === 'ar' ? 'مشهد سينمائي متحرك' : 'Cinematic Video Scene';
      let desc = language === 'ar' ? 'تم تصميم لقطة الفيديو السينمائية بأعلى مواصفات الإخراج والحركة.' : 'Cinematic video sequence designed.';
      try {
        const item = await mediaEngine.generateVideo({ prompt: userPrompt, apiKey });
        videoUrl = item.posterUrl || item.url;
        title = item.title || title;
        desc = item.explanationAr || desc;
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

    const ai = new GoogleGenAI({ apiKey });
    const hermesAugmentedInstruction = hermesEngine.augmentSystemInstruction(systemInstruction(language, agentName), userPrompt, language);

    const requiresSearch = searchCircuitBreaker.isAvailable() && /\b(search the web|google search|search online|live search)\b|ابحث في الويب|بحث في جوجل/i.test(userPrompt);

    const baseConfig: any = {
      temperature: 0.45,
      topP: 0.9,
      maxOutputTokens: 4096,
      systemInstruction: hermesAugmentedInstruction,
    };

    const candidateModels = Array.from(new Set([
      'gemini-3.1-flash-lite',
      'gemini-3.7-flash',
      'gemini-3.5-flash',
      'gemini-flash-lite-latest',
      model,
      'gemini-3.8-flash',
      'gemini-flash-latest',
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
          const stream = await ai.models.generateContentStream({ model: currentModel, contents: messages, config });
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
            const completion = await ai.models.generateContent({ model: currentModel, contents: messages, config });
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
