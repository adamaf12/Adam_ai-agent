import type { Express, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

type AgentMessage = { role: string; content: string };

function normalizeMessages(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is AgentMessage => Boolean(item && typeof item === 'object' && typeof (item as any).content === 'string'))
    .slice(-40)
    .map((item) => ({ role: item.role === 'assistant' ? 'model' : 'user', parts: [{ text: item.content.slice(0, 30_000) }] }));
}

export function registerAgentRoute(app: Express, apiKey: string, model: string) {
  app.post('/api/agent', async (req: Request, res: Response) => {
    if (!apiKey) return res.status(503).json({ code: 'AI_NOT_CONFIGURED', message: 'Adam AI is not configured on this server.' });
    const messages = normalizeMessages(req.body?.messages);
    if (!messages.length) return res.status(400).json({ code: 'EMPTY_MESSAGE', message: 'Please send a message before starting an agent run.' });
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
          temperature: 0.35,
          topP: 0.9,
          maxOutputTokens: 4096,
          systemInstruction: `You are ${agentName}, a careful full-stack personal AI agent. Reply in ${language === 'ar' ? 'Arabic' : 'English'} unless asked otherwise. When current or factual external information is needed, use the available web search grounding. Never claim to have executed an external action unless it actually happened. Clearly distinguish verified facts, assumptions, and limitations. Prefer concise plans followed by useful results.`,
          tools: [{ googleSearch: {} }],
        },
      });
      for await (const chunk of stream) {
        if (closed) break;
        const text = typeof (chunk as any).text === 'string' ? (chunk as any).text : '';
        if (text) res.write(JSON.stringify({ type: 'delta', text }) + '\n');
      }
      if (!closed) { res.write(JSON.stringify({ type: 'done' }) + '\n'); res.end(); }
    } catch (error: any) {
      if (closed) return;
      const status = Number(error?.status ?? error?.code ?? 500);
      const message = status === 401 || status === 403 ? 'The AI provider rejected the server credentials or project permissions.' : status === 429 ? 'Adam is temporarily rate-limited. Please try again shortly.' : 'Adam could not complete this agent run.';
      res.write(JSON.stringify({ type: 'error', code: status === 429 ? 'AI_RATE_LIMIT' : status === 401 || status === 403 ? 'AI_AUTH' : 'AI_ERROR', message }) + '\n');
      res.end();
      console.error('[Adam Agent]', error);
    }
  });
}
