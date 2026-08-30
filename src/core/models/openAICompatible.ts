import type { ModelDescriptor } from './modelSwarm';
import type { ModelRequest } from './modelGateway';
import type { ProviderAdapter } from './modelProviders';

export class OpenAICompatibleAdapter implements ProviderAdapter {
  constructor(private readonly fetchImpl: typeof fetch = fetch, private readonly apiKey?: string) {}

  async invoke(model: ModelDescriptor, request: ModelRequest): Promise<string> {
    if (!model.endpoint) throw new Error(`No endpoint configured for ${model.id}`);
    const response = await this.fetchImpl(model.endpoint.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}) },
      body: JSON.stringify({ model: model.id, messages: [ ...(request.system ? [{ role: 'system', content: request.system }] : []), { role: 'user', content: request.prompt } ], temperature: request.temperature, max_tokens: request.maxTokens, stream: false }),
    });
    if (!response.ok) throw new Error(`${model.id}: provider returned HTTP ${response.status}`);
    const data: any = await response.json();
    return data.choices?.[0]?.message?.content ?? data.output ?? data.text ?? '';
  }
}
