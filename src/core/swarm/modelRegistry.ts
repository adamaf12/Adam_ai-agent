import type { ModelCapability, ModelProfile } from './types';

export class ModelRegistry {
  private readonly models = new Map<string, ModelProfile>();
  register(model: ModelProfile) { this.models.set(model.id, model); }
  registerMany(models: ModelProfile[]) { models.forEach((model) => this.register(model)); }
  get(id: string) { return this.models.get(id); }
  all() { return [...this.models.values()]; }
  enabled() { return this.all().filter((model) => model.enabled); }
  capableOf(capability: ModelCapability) { return this.enabled().filter((model) => model.capabilities.includes(capability)); }
  size() { return this.models.size; }
}

export const modelRegistry = new ModelRegistry();
modelRegistry.registerMany([
  { id: 'fast-default', provider: 'open', capabilities: ['fast', 'arabic'], contextLength: 32768, costTier: 1, speedTier: 5, enabled: true },
  { id: 'reasoning-default', provider: 'open', capabilities: ['reasoning', 'coding', 'arabic'], contextLength: 131072, costTier: 2, speedTier: 3, enabled: true },
  { id: 'coding-default', provider: 'open', capabilities: ['coding', 'reasoning'], contextLength: 131072, costTier: 2, speedTier: 4, enabled: true },
  { id: 'vision-default', provider: 'open', capabilities: ['vision', 'reasoning'], contextLength: 65536, costTier: 2, speedTier: 3, enabled: true },
]);
