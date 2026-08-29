export type ModelProvider = 'gemini' | 'huggingface' | 'openai-compatible' | 'local' | 'pollinations';
export type ModelCapability = 'general' | 'reasoning' | 'coding' | 'math' | 'vision' | 'search' | 'fast' | 'arabic';

export interface ModelDescriptor {
  id: string;
  provider: ModelProvider;
  displayName: string;
  capabilities: ModelCapability[];
  contextLength?: number;
  quality: number;
  speed: number;
  cost: number;
  enabled: boolean;
  endpoint?: string;
}

export interface RoutingTask {
  prompt: string;
  capabilities?: ModelCapability[];
  maxModels?: number;
  preferSpeed?: boolean;
  budget?: number;
}

export interface RoutingPlan {
  primary: ModelDescriptor;
  ensemble: ModelDescriptor[];
  strategy: 'single' | 'ensemble';
}

export class ModelRegistry {
  private readonly models = new Map<string, ModelDescriptor>();
  register(model: ModelDescriptor): void { this.models.set(model.id, model); }
  registerMany(models: ModelDescriptor[]): void { for (const model of models) this.register(model); }
  get(id: string): ModelDescriptor | undefined { return this.models.get(id); }
  all(): ModelDescriptor[] { return [...this.models.values()]; }
  enabled(): ModelDescriptor[] { return this.all().filter((model) => model.enabled); }
  size(): number { return this.models.size; }
}

const builtInModels: ModelDescriptor[] = [
  { id: 'gemini-2.5-flash', provider: 'gemini', displayName: 'Gemini 2.5 Flash', capabilities: ['general', 'fast', 'coding', 'reasoning', 'arabic'], quality: 8.8, speed: 9.5, cost: 2, enabled: true },
  { id: 'gemini-2.5-pro', provider: 'gemini', displayName: 'Gemini 2.5 Pro', capabilities: ['general', 'reasoning', 'coding', 'math', 'vision', 'arabic'], quality: 9.5, speed: 7.2, cost: 6, enabled: true },
  { id: 'gemini-2.5-flash-lite', provider: 'gemini', displayName: 'Gemini 2.5 Flash Lite', capabilities: ['general', 'fast', 'arabic'], quality: 7.7, speed: 10, cost: 1, enabled: true },
  { id: 'qwen', provider: 'pollinations', displayName: 'Qwen', capabilities: ['general', 'coding', 'reasoning', 'math'], quality: 7.8, speed: 8.2, cost: 0, enabled: true },
  { id: 'mistral', provider: 'pollinations', displayName: 'Mistral', capabilities: ['general', 'coding', 'fast'], quality: 7.5, speed: 8.7, cost: 0, enabled: true },
  { id: 'openai', provider: 'pollinations', displayName: 'OpenAI fallback', capabilities: ['general', 'coding', 'reasoning'], quality: 8, speed: 7.8, cost: 0, enabled: true },
];

export const modelRegistry = new ModelRegistry();
modelRegistry.registerMany(builtInModels);

function score(model: ModelDescriptor, task: RoutingTask): number {
  const required = task.capabilities?.length ? task.capabilities : ['general'];
  const capabilityMatch = required.filter((capability) => model.capabilities.includes(capability)).length / required.length;
  const qualityWeight = task.preferSpeed ? 0.25 : 0.55;
  const speedWeight = task.preferSpeed ? 0.55 : 0.2;
  const costWeight = task.budget !== undefined ? 0.25 : 0.05;
  return capabilityMatch * 5 + model.quality * qualityWeight + model.speed * speedWeight + Math.max(0, 10 - model.cost) * costWeight;
}

export function routeTask(task: RoutingTask): RoutingPlan {
  const candidates = modelRegistry.enabled().filter((model) => task.budget === undefined || model.cost <= task.budget);
  if (!candidates.length) throw new Error('No enabled model matches the current routing constraints.');
  const ranked = candidates.sort((a, b) => score(b, task) - score(a, task));
  const maxModels = Math.max(1, Math.min(task.maxModels ?? 1, 8));
  const primary = ranked[0];
  if (maxModels === 1 || ranked.length === 1) return { primary, ensemble: [primary], strategy: 'single' };
  return { primary, ensemble: ranked.slice(0, maxModels), strategy: 'ensemble' };
}

export function registrySnapshot() {
  return { total: modelRegistry.size(), enabled: modelRegistry.enabled().length, providers: [...new Set(modelRegistry.enabled().map((model) => model.provider))] };
}
