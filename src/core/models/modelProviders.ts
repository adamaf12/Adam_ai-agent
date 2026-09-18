import { ModelDescriptor } from './modelSwarm';
import { ModelRequest } from './modelGateway';

export interface ProviderAdapter { invoke(model: ModelDescriptor, request: ModelRequest): Promise<string>; }

function getProviderTimeoutMs(): number {
  return Math.max(50, Number(process.env.ADAM_PROVIDER_TIMEOUT_MS ?? 45_000));
}

function providerEndpoint(model: ModelDescriptor) {
  if (model.endpoint) return model.endpoint;
  if (model.provider === 'huggingface') {
    return '/api/hf/chat';
  }
  if (model.provider === 'pollinations') return 'https://gen.pollinations.ai/v1/chat/completions';
  return '';
}

export class FetchProviderAdapter implements ProviderAdapter {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async invoke(model: ModelDescriptor, request: ModelRequest): Promise<string> {
    const endpoint = providerEndpoint(model);
    if (!endpoint) throw new Error(`No endpoint configured for ${model.id}`);
    
    // Server-proxied endpoints like /api/hf/chat keep all keys 100% hidden in backend
    if (model.provider === 'huggingface' || endpoint.startsWith('/api/')) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000);
      try {
        const response = await this.fetchImpl('/api/hf/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            model: model.id,
            messages: [
              ...(request.system ? [{ role: 'system', content: request.system }] : []),
              { role: 'user', content: request.prompt },
            ],
            systemPrompt: request.system,
            temperature: request.temperature,
            maxTokens: request.maxTokens,
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || `Hugging Face API failed with status ${response.status}`);
        }
        return data.text || '';
      } finally {
        clearTimeout(timer);
      }
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
    const timeoutMs = getProviderTimeoutMs();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await this.fetchImpl(endpoint, {
        method: 'POST', headers, signal: controller.signal,
        body: JSON.stringify({ model: model.id, messages: [{ role: 'system', content: request.system ?? '' }, { role: 'user', content: request.prompt }], prompt: request.prompt, system: request.system, temperature: request.temperature, max_tokens: request.maxTokens, maxTokens: request.maxTokens }),
      });
      const raw = await response.text();
      if (!response.ok) throw new Error(`${model.id}: provider returned HTTP ${response.status}`);
      let data: any;
      try { data = JSON.parse(raw); } catch { data = { text: raw }; }
      const text = data.text ?? data.output_text ?? data.output ?? data.response ?? data.content ?? data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text ?? data.generated_text ?? '';
      if (Array.isArray(text)) return text.map((part) => typeof part === 'string' ? part : part?.text ?? '').join('');
      const normalized = typeof text === 'string' ? text : String(text ?? '');
      if (!normalized.trim()) throw new Error(`${model.id}: provider returned an empty response.`);
      return normalized;
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') throw new Error(`${model.id}: provider timed out after ${timeoutMs}ms.`);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}

export class ProviderRouter {
  private readonly adapters = new Map<string, ProviderAdapter>();
  register(provider: string, adapter: ProviderAdapter): void { this.adapters.set(provider, adapter); }
  has(provider: string): boolean { return this.adapters.has(provider); }
  async invoke(model: ModelDescriptor, request: ModelRequest): Promise<string> {
    const adapter = this.adapters.get(model.provider);
    if (!adapter) throw new Error(`No adapter registered for provider: ${model.provider}`);
    return adapter.invoke(model, request);
  }
}
