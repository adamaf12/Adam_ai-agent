import 'dotenv/config';
import compression from 'compression';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { registerAgentRoute } from './server/agent';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const model = process.env.ADAM_GEMINI_MODEL ?? 'gemini-3.7-flash';
const apiKey = process.env.GEMINI_API_KEY?.trim() ?? '';
const rootDir = process.cwd();
const publicDir = `${rootDir}/dist`;

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  const origin = _req.headers.origin;
  if (origin && (/^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || /^capacitor:\/\//.test(origin) || /^ionic:\/\//.test(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Request-Id');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (_req.method === 'OPTIONS') return res.status(204).end();
  next();
});
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false }));

function sendError(res: express.Response, status: number, code: string, message: string) { res.status(status).json({ code, message }); }
function normalizeMessages(input: unknown) { if (!Array.isArray(input)) return []; return input.filter((item): item is { role: string; content: string } => Boolean(item && typeof item === 'object' && typeof (item as any).content === 'string')).slice(-40).map(item => ({ role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user', parts: [{ text: item.content.slice(0, 30_000) }] })); }
function systemInstruction(language: string, agentName: string) { const lang = language === 'ar' ? 'Arabic' : 'English'; return `You are ${agentName || 'Adam'}, a reliable personal AI agent. Reply primarily in ${lang} unless the user clearly asks for another language. Answer normal questions directly, preserve conversation context, never invent actions or tool results, and clearly distinguish known facts from uncertainty. For current information use appropriate grounding only when needed.`; }

app.get('/api/health', (_req, res) => res.json({ ok: true, model, configured: Boolean(apiKey), agent: true, version: '2.3.0' }));

app.post('/api/chat', async (req, res) => {
  if (!apiKey) return sendError(res, 503, 'AI_NOT_CONFIGURED', 'Adam AI is not configured on this server yet.');
  const messages = normalizeMessages(req.body?.messages);
  if (!messages.length) return sendError(res, 400, 'EMPTY_MESSAGE', 'Please send a message before starting a chat.');
  const language = req.body?.language === 'en' ? 'en' : 'ar';
  const agentName = typeof req.body?.agentName === 'string' ? req.body.agentName.slice(0, 40) : 'Adam';
  const ai = new GoogleGenAI({ apiKey });
  res.status(200).setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  let aborted = false;
  req.once('aborted', () => { aborted = true; });
  try {
    const config = { temperature: 0.45, topP: 0.9, maxOutputTokens: 4096, systemInstruction: systemInstruction(language, agentName) };
    const stream = await ai.models.generateContentStream({ model, contents: messages, config });
    let output = '';
    for await (const chunk of stream) {
      if (aborted) break;
      const text = typeof (chunk as any).text === 'string' ? (chunk as any).text : '';
      if (text) { output += text; res.write(JSON.stringify({ type: 'delta', text }) + '\n'); }
    }
    if (aborted) return;
    if (!output.trim()) {
      const completion = await ai.models.generateContent({ model, contents: messages, config });
      const text = typeof (completion as any).text === 'string' ? (completion as any).text : '';
      if (text.trim()) { output = text; res.write(JSON.stringify({ type: 'delta', text }) + '\n'); }
    }
    if (!output.trim()) throw new Error('The AI provider returned an empty completion.');
    res.write(JSON.stringify({ type: 'done' }) + '\n');
    res.end();
  } catch (error: any) {
    if (aborted) return;
    const status = Number(error?.status ?? error?.code ?? 500);
    const providerMessage = String(error?.message ?? 'The AI provider failed to answer.');
    const normalized = providerMessage.toLowerCase();
    const code = status === 401 || status === 403 || normalized.includes('permission') || normalized.includes('api key') ? 'AI_AUTH' : status === 429 || normalized.includes('quota') || normalized.includes('rate limit') ? 'AI_RATE_LIMIT' : 'AI_PROVIDER';
    const message = code === 'AI_AUTH' ? 'The AI provider rejected the configured credentials.' : code === 'AI_RATE_LIMIT' ? 'Adam is temporarily rate-limited. Please try again shortly.' : 'Adam could not complete the request. Please retry.';
    if (!res.headersSent) return sendError(res, status >= 500 ? 502 : status, code, message);
    res.write(JSON.stringify({ type: 'error', code, message }) + '\n'); res.end();
    console.error('[Adam AI]', { code, status, providerMessage });
  }
});

registerAgentRoute(app, apiKey, model);

async function startServer() {
  if (process.env.NODE_ENV === 'production') { app.use(express.static(publicDir, { index: 'index.html', maxAge: '1h' })); app.get('*', (_req, res) => res.sendFile(`${publicDir}/index.html`)); }
  else if (process.env.NODE_ENV !== 'test') { const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' }); app.use(vite.middlewares); }
  if (process.env.NODE_ENV !== 'test' && process.env.VERCEL !== '1') app.listen(port, () => console.log(`Adam AI v2 listening on http://localhost:${port}`));
}
if (process.env.NODE_ENV !== 'test' && process.env.VERCEL !== '1') void startServer();
export { app, startServer };
