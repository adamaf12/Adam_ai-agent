import type { Express, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import { DEFAULT_AGENT_BUDGET } from '../src/core/agent/agentBudget';
import { DEFAULT_RETRY_POLICY, isRetryableError, retryDelayMs } from '../src/core/agent/retryPolicy';
import { requestDeduplicator } from '../src/core/agent/requestDedup';
import { appendRunEvent, createRunSummary } from '../src/core/agent/runTelemetry';
import { modelRegistry, registerRemoteModels, routeTask, type ModelDescriptor } from '../src/core/models/modelSwarm';
import { createAgentModelGateway, inferCapabilities } from '../src/core/models/agentModelGateway';
import type { ModelRequest } from '../src/core/models/modelGateway';

type AgentMessage = { role: string; content: string };
type AgentRequest = { messages?: unknown; language?: unknown; agentName?: unknown; maxModels?: unknown };
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 30_000;
const MAX_AGENT_NAME_CHARS = 40;
const MAX_REQUEST_ID_CHARS = 128;
let remoteCatalogPromise: Promise<void> | null = null;

async function hydrateRemoteCatalog() {
  if (!remoteCatalogPromise) {
    remoteCatalogPromise = fetch('https://gen.pollinations.ai/v1/models').then(async response => {
      if (!response.ok) throw new Error(`Remote model catalog returned HTTP ${response.status}`);
      const data = await response.json();
      registerRemoteModels(data, 'pollinations');
    }).catch(error => {
      console.warn('[Adam AI] remote model catalog unavailable:', error instanceof Error ? error.message : error);
    });
  }
  await remoteCatalogPromise;
}

function normalizeMessages(input: unknown) {
  if (!Array.isArray(input)) return [];
  let remainingChars = DEFAULT_AGENT_BUDGET.maxContextChars;
  return input.filter((item): item is AgentMessage => Boolean(item && typeof item === 'object' && typeof (item as AgentMessage).content === 'string'))
    .slice(-MAX_MESSAGES).map((item) => {
      const content = item.content.slice(0, Math.min(MAX_MESSAGE_CHARS, remainingChars));
      remainingChars = Math.max(0, remainingChars - content.length);
      return { role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user', parts: [{ text: content }] };
    }).filter(item => item.parts[0].text.length > 0);
}
function getLanguage(value: unknown) { return value === 'en' ? 'en' : 'ar'; }
function getAgentName(value: unknown) { if (typeof value !== 'string') return 'Adam'; const name = value.trim().slice(0, MAX_AGENT_NAME_CHARS); return name || 'Adam'; }
function getRequestId(req: Request) { const header = req.header('x-request-id'); if (header && /^[a-zA-Z0-9._:-]{1,128}$/.test(header)) return header.slice(0, MAX_REQUEST_ID_CHARS); return randomUUID(); }
function systemInstruction(language: 'ar' | 'en', agentName: string) {
  const responseLanguage = language === 'ar' ? 'Arabic' : 'English';
  return [`You are ${agentName}, a reliable personal AI agent.`,`Respond primarily in ${responseLanguage}, unless the user clearly requests another language.`,`Answer normal questions directly; do not require tools for ordinary conversation.`,'Treat the complete conversation as context and identify the actual goal before answering.','For complex requests, silently plan and verify prerequisites; never expose hidden chain-of-thought.','Use Google Search grounding only when freshness, current facts, prices, news, public information, or external verification is required.','Never invent sources, tool calls, file changes, external actions, credentials, or completed work.','If a capability is unavailable, say so briefly and provide the best useful alternative.','For code, prioritize correctness, compatibility, security, and minimal regressions.','For Arabic, use natural modern Arabic and preserve technical identifiers unchanged.','Be accurate, practical, and direct.'].join(' ');
}
function sendError(res: Response, status: number, code: string, message: string) { if (res.headersSent) { res.write(JSON.stringify({ type: 'error', code, message }) + '\n'); res.end(); return; } res.status(status).json({ code, message }); }

function createGeminiInvoker(apiKey: string, language: 'ar' | 'en', agentName: string, messages: ReturnType<typeof normalizeMessages>, useSearch: boolean) {
  const ai = new GoogleGenAI({ apiKey });
  return async (selected: ModelDescriptor, request: ModelRequest) => {
    const config: Record<string, unknown> = { temperature: request.temperature ?? 0.35, topP: 0.9, maxOutputTokens: Math.min(request.maxTokens ?? 4096, DEFAULT_AGENT_BUDGET.maxResponseChars), systemInstruction: request.system ?? systemInstruction(language, agentName) };
    if (useSearch) config.tools = [{ googleSearch: {} }];
    const stream = await ai.models.generateContentStream({ model: selected.id, contents: messages, config });
    let output = '';
    for await (const chunk of stream) { const text = typeof (chunk as { text?: unknown }).text === 'string' ? (chunk as { text: string }).text : ''; if (text) output += text; }
    if (!output.trim()) {
      const completion = await ai.models.generateContent({ model: selected.id, contents: messages, config });
      output = typeof (completion as any).text === 'string' ? (completion as any).text : '';
    }
    if (!output.trim()) throw new Error(`The selected model ${selected.id} returned an empty response.`);
    return output;
  };
}

export function registerAgentRoute(app: Express, apiKey: string, model: string) {
  app.post('/api/agent', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as AgentRequest;
    const requestId = getRequestId(req);
    const runId = `run_${requestId}`;
    res.setHeader('X-Request-Id', requestId);
    if (!apiKey) return sendError(res, 503, 'AI_NOT_CONFIGURED', 'Adam AI is not configured on this server.');
    const messages = normalizeMessages(body.messages);
    if (!messages.length) return sendError(res, 400, 'EMPTY_MESSAGE', 'Please send a message before starting an agent run.');
    if (!requestDeduplicator.begin(requestId)) return sendError(res, 409, 'REQUEST_IN_PROGRESS', 'This request is already being processed.');

    let run = createRunSummary(runId);
    let aborted = false;
    req.once('aborted', () => { aborted = true; });
    try {
      await hydrateRemoteCatalog();
      const language = getLanguage(body.language);
      const agentName = getAgentName(body.agentName);
      const latestPrompt = messages[messages.length - 1]?.parts?.[0]?.text ?? '';
      const requestedMaxModels = typeof body.maxModels === 'number' && Number.isFinite(body.maxModels) ? Math.max(1, Math.min(8, Math.floor(body.maxModels))) : 1;
      const capabilities = inferCapabilities(latestPrompt);
      const plan = routeTask({ prompt: latestPrompt, capabilities, maxModels: requestedMaxModels, preferSpeed: latestPrompt.length < 120 });
      const fallback = modelRegistry.get(model) ?? modelRegistry.enabled().find(candidate => candidate.provider === 'gemini');
      const candidates = [...plan.ensemble, ...(fallback && !plan.ensemble.some(candidate => candidate.id === fallback.id) ? [fallback] : [])];
      if (!candidates.length) return sendError(res, 503, 'NO_MODEL_AVAILABLE', 'No enabled AI model is available.');

      const useSearch = capabilities.includes('search');
      const remoteGateway = createAgentModelGateway();
      const geminiInvoker = createGeminiInvoker(apiKey, language, agentName, messages, useSearch);
      const invoke = async (selected: ModelDescriptor, request: ModelRequest) => selected.provider === 'gemini' ? geminiInvoker(selected, request) : remoteGateway.gateway.invokeSelected(selected, request).then(result => result.text);
      res.setHeader('X-Adam-Model', candidates.map(m => m.id).join(','));
      res.setHeader('X-Adam-Registry-Size', String(modelRegistry.size()));
      res.status(200).setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();
      run = appendRunEvent(run, { phase: 'planning', at: Date.now(), detail: `registry:${modelRegistry.size()}` });

      let output = '';
      for (const selectedModel of candidates) {
        if (aborted || output) break;
        for (let attempt = 1; attempt <= DEFAULT_RETRY_POLICY.maxAttempts && !aborted && !output; attempt += 1) {
          try {
            run = appendRunEvent(run, { phase: 'executing', at: Date.now(), attempt, detail: selectedModel.id });
            output = await invoke(selectedModel, { prompt: latestPrompt, system: systemInstruction(language, agentName), temperature: 0.35, maxTokens: 4096 });
          } catch (error) {
            if (aborted || !isRetryableError(error) || attempt >= DEFAULT_RETRY_POLICY.maxAttempts) break;
            await new Promise(resolve => setTimeout(resolve, retryDelayMs(attempt)));
          }
        }
      }
      if (!output.trim() && !aborted) throw new Error('No model returned a usable response.');
      if (aborted) { run = appendRunEvent(run, { phase: 'cancelled', at: Date.now() }); return; }
      run = appendRunEvent(run, { phase: 'verifying', at: Date.now() });
      run = appendRunEvent(run, { phase: 'responding', at: Date.now() });
      res.write(JSON.stringify({ type: 'delta', text: output.trim() }) + '\n');
      run = appendRunEvent(run, { phase: 'completed', at: Date.now() });
      res.write(JSON.stringify({ type: 'done', model: candidates.map(m => m.id).slice(0, 8), swarmSize: Math.min(candidates.length, 8), registrySize: modelRegistry.size() }) + '\n');
      res.end();
    } catch (error: unknown) {
      if (aborted) return;
      run = appendRunEvent(run, { phase: 'failed', at: Date.now(), detail: 'provider_error' });
      const providerError = error as { status?: unknown; code?: unknown; message?: unknown };
      const status = Number(providerError.status ?? providerError.code ?? 500);
      const normalized = String(providerError.message ?? 'Unknown provider error.').toLowerCase();
      const isAuth = status === 401 || status === 403 || normalized.includes('api key') || normalized.includes('permission');
      const isRateLimited = status === 429 || normalized.includes('quota') || normalized.includes('rate limit');
      if (isAuth) return sendError(res, 502, 'PROVIDER_AUTH_ERROR', 'The AI provider rejected the configured credentials.');
      if (isRateLimited) return sendError(res, 429, 'PROVIDER_RATE_LIMITED', 'The AI provider is rate limited. Please try again shortly.');
      return sendError(res, 502, 'PROVIDER_ERROR', 'The AI provider could not complete the request.');
    } finally {
      requestDeduplicator.finish(requestId);
    }
  });
}
