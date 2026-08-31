import { ModelDescriptor } from './modelSwarm';
import { ModelRequest } from './modelGateway';

export interface ProviderAdapter { invoke(model: ModelDescriptor, request: ModelRequest): Promise<string>; }

function providerEndpoint(model: ModelDescriptor) {
  if (model.endpoint) return model.endpoint;
  if (model.provider === 'pollinations') return process.env.POLLINATIONS_BASE_URL ? `${process.env.POLLINATIONS_BASE_URL.replace(/\/$/, '')}/v1/chat/completions` : 'https://gen.pollinations.ai/v1/chat/completions';
  return '';
}

export class FetchProviderAdapter implements ProviderAdapter {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async invoke(model: ModelDescriptor, request: ModelRequest): Promise<string> {
    const endpoint = providerEndpoint(model);
    if (!endpoint) throw new Error(`No endpoint configured for ${model.id}`);
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
    const key = model.provider === 'pollinations' ? process.env.POLLINATIONS_API_KEY?.trim() : undefined;
    if (key) headers.Authorization = `Bearer ${key}`;
    const response = await this.fetchImpl(endpoint, {
      method: 'POST', headers,
      body: JSON.stringify({ model: model.id, messages: [{ role: 'system', content: request.system ?? '' }, { role: 'user', content: request.prompt }], prompt: request.prompt, system: request.system, temperature: request.temperature, max_tokens: request.maxTokens, maxTokens: request.maxTokens }),
    });
    const raw = await response.text();
    if (!response.ok) throw new Error(`${model.id}: provider returned HTTP ${response.status}${raw ? ` - ${raw.slice(0, 300)}` : ''}`);
    let data: any;
    try { data = JSON.parse(raw); } catch { data = { text: raw }; }
    const text = data.text ?? data.output_text ?? data.output ?? data.response ?? data.content ?? data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text ?? data.generated_text ?? '';
    if (Array.isArray(text)) return text.map((part) => typeof part === 'string' ? part : part?.text ?? '').join('');
    return typeof text === 'string' ? text : String(text ?? '');
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
