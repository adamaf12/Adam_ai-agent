import 'dotenv/config';
import compression from 'compression';
import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT ?? 3000);
const model = process.env.ADAM_GEMINI_MODEL ?? 'gemini-3.7-flash';
const apiKey = process.env.GEMINI_API_KEY?.trim() ?? '';

app.set('trust proxy', 1);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false }));

const publicDir = path.join(__dirname, 'dist');

function sendError(res: express.Response, status: number, code: string, message: string) {
  res.status(status).json({ code, message });
}

function normalizeMessages(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is { role: string; content: string } => Boolean(item && typeof item === 'object' && typeof (item as any).content === 'string'))
    .slice(-40)
    .map((item) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content.slice(0, 30_000) }],
    }));
}

function systemInstruction(language: string, agentName: string) {
  const lang = language === 'ar' ? 'Arabic' : 'English';
  return `You are ${agentName || 'Adam'}, a premium personal AI agent. Reply primarily in ${lang} unless the user clearly asks for another language. Be concise but useful, preserve context, do not invent actions or tool results, and clearly distinguish what you know from what you cannot access. Never claim to have sent emails, changed files, or completed external actions unless the server actually performed them.`;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, model, configured: Boolean(apiKey), version: '2.0.0' });
});

app.post('/api/chat', async (req, res) => {
  if (!apiKey) return sendError(res, 503, 'AI_NOT_CONFIGURED', 'Adam AI is not configured on this server yet. Add GEMINI_API_KEY to the server environment.');

  const messages = normalizeMessages(req.body?.messages);
  if (!messages.length) return sendError(res, 400, 'EMPTY_MESSAGE', 'Please send a message before starting a chat.');

  const language = req.body?.language === 'en' ? 'en' : 'ar';
  const agentName = typeof req.body?.agentName === 'string' ? req.body.agentName.slice(0, 40) : 'Adam';
  const ai = new GoogleGenAI({ apiKey });

  res.status(200);
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let closed = false;
  req.on('close', () => { closed = true; });

  try {
    const stream = await ai.models.generateContentStream({
      model,
      contents: messages,
      config: {
        temperature: 0.45,
        topP: 0.9,
        maxOutputTokens: 4096,
        systemInstruction: systemInstruction(language, agentName),
      },
    });

    for await (const chunk of stream) {
      if (closed) break;
      const text = typeof (chunk as any).text === 'string' ? (chunk as any).text : '';
      if (text) res.write(JSON.stringify({ type: 'delta', text }) + '\n');
    }

    if (!closed) {
      res.write(JSON.stringify({ type: 'done' }) + '\n');
      res.end();
    }
  } catch (error: any) {
    if (closed) return;
    const status = Number(error?.status ?? error?.code ?? 500);
    const message = String(error?.message ?? 'The AI provider failed to answer.');
    const normalized = message.toLowerCase();
    const code = status === 401 || status === 403 || normalized.includes('permission') || normalized.includes('api key')
      ? 'AI_AUTH'
      : status === 429 || normalized.includes('quota') || normalized.includes('rate limit')
        ? 'AI_RATE_LIMIT'
        : status >= 500 || normalized.includes('unavailable')
          ? 'AI_PROVIDER'
          : 'AI_ERROR';
    const userMessage = code === 'AI_AUTH'
      ? 'The AI provider rejected the server credentials. Check GEMINI_API_KEY and the provider project.'
      : code === 'AI_RATE_LIMIT'
        ? 'Adam is temporarily rate-limited. Please try again in a moment.'
        : 'Adam could not complete the request. Please retry.';
    res.write(JSON.stringify({ type: 'error', code, message: userMessage }) + '\n');
    res.end();
    console.error('[Adam AI]', { code, status, message });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.use(express.static(publicDir, { index: 'index.html', maxAge: '1h' }));
  app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
  app.listen(port, () => console.log(`Adam AI v2 listening on http://localhost:${port}`));
}

export { app };
