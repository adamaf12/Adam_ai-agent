export type ModelProvider = 'gemini' | 'huggingface' | 'openai-compatible' | 'local' | 'pollinations';
export type ModelCapability = 'general' | 'reasoning' | 'coding' | 'math' | 'vision' | 'search' | 'fast' | 'arabic';

export interface ModelDescriptor { id: string; provider: ModelProvider; displayName: string; capabilities: readonly ModelCapability[]; contextLength?: number; quality: number; speed: number; cost: number; enabled: boolean; endpoint?: string; }
export interface RoutingTask { prompt: string; capabilities?: ModelCapability[]; maxModels?: number; preferSpeed?: boolean; budget?: number; }
export interface RoutingPlan { primary: ModelDescriptor; ensemble: ModelDescriptor[]; strategy: 'single' | 'ensemble'; }

export const MAX_SWARM_MODELS = 1000;

export class ModelRegistry {
  private readonly models = new Map<string, ModelDescriptor>();
  register(model: ModelDescriptor) { this.models.set(model.id, model); }
  registerMany(models: ModelDescriptor[]) { models.forEach(model => this.register(model)); }
  get(id: string) { return this.models.get(id); }
  all() { return [...this.models.values()]; }
  enabled() { return this.all().filter(model => model.enabled); }
  size() { return this.models.size; }
}

const builtInModels: ModelDescriptor[] = [
  { id: 'gemini-2.5-flash', provider: 'gemini', displayName: 'Gemini 2.5 Flash', capabilities: ['general','fast','coding','reasoning','arabic'], quality: 8.8, speed: 9.5, cost: 2, enabled: true },
  { id: 'gemini-2.5-pro', provider: 'gemini', displayName: 'Gemini 2.5 Pro', capabilities: ['general','reasoning','coding','math','vision','arabic'], quality: 9.5, speed: 7.2, cost: 6, enabled: true },
  { id: 'gemini-2.5-flash-lite', provider: 'gemini', displayName: 'Gemini 2.5 Flash Lite', capabilities: ['general','fast','arabic'], quality: 7.7, speed: 10, cost: 1, enabled: true },
];
export const modelRegistry = new ModelRegistry();
modelRegistry.registerMany(builtInModels);

function normalizeCapability(value: unknown): ModelCapability | null {
  const text = String(value ?? '').toLowerCase();
  if (text.includes('code')) return 'coding';
  if (text.includes('reason')) return 'reasoning';
  if (text.includes('math')) return 'math';
  if (text.includes('vision')) return 'vision';
  if (text.includes('search')) return 'search';
  if (text.includes('arab')) return 'arabic';
  return null;
}

/** Hydrate the registry from a remote OpenAI-compatible catalog without hardcoding a fake "1000 models" list. */
export function registerRemoteModels(input: unknown, provider: ModelProvider = 'pollinations', endpoint = 'https://gen.pollinations.ai/v1/chat/completions') {
  const entries = Array.isArray(input) ? input : (input && typeof input === 'object' && Array.isArray((input as any).data) ? (input as any).data : []);
  const models: ModelDescriptor[] = entries.map((entry: any) => {
    const id = typeof entry?.id === 'string' ? entry.id.trim() : '';
    if (!id) return null;
    const declared = Array.isArray(entry?.capabilities) ? entry.capabilities.map(normalizeCapability).filter(Boolean) as ModelCapability[] : [];
    const capabilities = [...new Set<ModelCapability>(['general', ...declared])];
    const contextLength = Number(entry?.context_length ?? entry?.contextLength ?? entry?.max_context_length);
    return { id, provider, displayName: String(entry?.name ?? entry?.display_name ?? id), capabilities, contextLength: Number.isFinite(contextLength) ? contextLength : undefined, quality: 7.5, speed: 7.5, cost: 0, enabled: true, endpoint };
  }).filter(Boolean) as ModelDescriptor[];
  modelRegistry.registerMany(models);
  return models;
}

function score(model: ModelDescriptor, task: RoutingTask) {
  const required: ModelCapability[] = task.capabilities?.length ? task.capabilities : ['general'];
  const match = required.filter(cap => model.capabilities.includes(cap)).length / required.length;
  const qualityWeight = task.preferSpeed ? 0.25 : 0.55;
  const speedWeight = task.preferSpeed ? 0.55 : 0.2;
  const costWeight = task.budget !== undefined ? 0.25 : 0.05;
  return match * 5 + model.quality * qualityWeight + model.speed * speedWeight + Math.max(0, 10 - model.cost) * costWeight;
}

export function routeTask(task: RoutingTask): RoutingPlan {
  const candidates = modelRegistry.enabled().filter(model => task.budget === undefined || model.cost <= task.budget);
  if (!candidates.length) throw new Error('No enabled model matches the current routing constraints.');
  const ranked = candidates.sort((a, b) => score(b, task) - score(a, task));
  const maxModels = Math.max(1, Math.min(task.maxModels ?? 1, MAX_SWARM_MODELS));
  const primary = ranked[0];
  return maxModels === 1 ? { primary, ensemble: [primary], strategy: 'single' } : { primary, ensemble: ranked.slice(0, maxModels), strategy: 'ensemble' };
}

export function registrySnapshot() { return { total: modelRegistry.size(), enabled: modelRegistry.enabled().length, providers: [...new Set(modelRegistry.enabled().map(model => model.provider))] }; }
