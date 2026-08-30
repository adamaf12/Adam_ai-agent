import type { ModelDescriptor, RoutingTask } from './modelSwarm';
import { routeTask } from './modelSwarm';

export interface SelectedModel {
  model: ModelDescriptor;
  score: number;
}

export interface SelectionResult {
  primary: SelectedModel;
  ensemble: SelectedModel[];
}

export function selectModels(task: RoutingTask): SelectionResult {
  const plan = routeTask(task);
  const selected = plan.ensemble.map((model) => ({
    model,
    score: 1,
  }));
  return { primary: selected[0], ensemble: selected };
}

export function isModelRunnable(model: ModelDescriptor, configuredProviders: Set<string>): boolean {
  if (!model.enabled) return false;
  if (model.provider === 'local' || model.provider === 'openai-compatible') return Boolean(model.endpoint);
  return configuredProviders.has(model.provider);
}
