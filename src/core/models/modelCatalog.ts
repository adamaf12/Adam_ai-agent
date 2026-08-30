import type { ModelDescriptor, ModelProvider } from './modelSwarm';

const PROVIDERS: ModelProvider[] = ['gemini', 'huggingface', 'openai-compatible', 'local', 'pollinations'];

export type ModelCatalogEntry = Omit<ModelDescriptor, 'enabled'> & { enabled?: boolean };

function asProvider(value: unknown): ModelProvider {
  if (typeof value === 'string' && PROVIDERS.includes(value as ModelProvider)) return value as ModelProvider;
  throw new Error(`Unsupported model provider: ${String(value)}`);
}

export function normalizeModelCatalog(entries: unknown): ModelDescriptor[] {
  if (!Array.isArray(entries)) throw new Error('Model catalog must be an array.');
  const ids = new Set<string>();
  return entries.map((raw) => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid model catalog entry.');
    const item = raw as Record<string, unknown>;
    const id = typeof item.id === 'string' ? item.id.trim() : '';
    const displayName = typeof item.displayName === 'string' ? item.displayName.trim() : id;
    if (!id || !displayName) throw new Error('Model id and displayName are required.');
    if (ids.has(id)) throw new Error(`Duplicate model id: ${id}`);
    ids.add(id);
    const capabilities = Array.isArray(item.capabilities) ? item.capabilities.filter((x): x is ModelDescriptor['capabilities'][number] => typeof x === 'string') : ['general'];
    return {
      id,
      provider: asProvider(item.provider),
      displayName,
      capabilities,
      contextLength: typeof item.contextLength === 'number' ? Math.max(1, Math.floor(item.contextLength)) : undefined,
      quality: typeof item.quality === 'number' ? Math.max(0, Math.min(10, item.quality)) : 5,
      speed: typeof item.speed === 'number' ? Math.max(0, Math.min(10, item.speed)) : 5,
      cost: typeof item.cost === 'number' ? Math.max(0, item.cost) : 0,
      enabled: item.enabled !== false,
      endpoint: typeof item.endpoint === 'string' ? item.endpoint.trim() || undefined : undefined,
    } satisfies ModelDescriptor;
  });
}

export function mergeModelCatalog(registry: { registerMany(models: ModelDescriptor[]): void }, entries: unknown): number {
  const models = normalizeModelCatalog(entries);
  registry.registerMany(models);
  return models.length;
}
