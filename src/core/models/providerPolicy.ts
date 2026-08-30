import type { ModelDescriptor } from './modelSwarm';

export interface ProviderPolicy {
  enabledProviders: Set<ModelDescriptor['provider']>;
  allowLocal: boolean;
  allowRemoteOpenWeights: boolean;
}

export function providerAllowed(model: ModelDescriptor, policy: ProviderPolicy): boolean {
  if (!model.enabled) return false;
  if (model.provider === 'local' && !policy.allowLocal) return false;
  if ((model.provider === 'huggingface' || model.provider === 'openai-compatible') && !policy.allowRemoteOpenWeights) return false;
  return policy.enabledProviders.has(model.provider);
}
