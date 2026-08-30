import { ModelDescriptor } from './modelSwarm';
import { ModelRequest } from './modelGateway';

export interface ProviderAdapter { invoke(model: ModelDescriptor, request: ModelRequest): Promise<string>; }

export class FetchProviderAdapter implements ProviderAdapter {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async invoke(model: ModelDescriptor, request: ModelRequest): Promise<string> {
    if (!model.endpoint) throw new Error(`No endpoint configured for ${model.id}`);
    const response = await this.fetchImpl(model.endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model.id, prompt: request.prompt, system: request.system, temperature: request.temperature, max_tokens: request.maxTokens }),
    });
    if (!response.ok) throw new Error(`${model.id}: provider returned HTTP ${response.status}`);
    const data: any = await response.json();
    return data.text ?? data.output ?? data.response ?? data.choices?.[0]?.message?.content ?? '';
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
