import type { ModelDescriptor } from './modelSwarm';

export interface ModelHealth {
  modelId: string;
  successes: number;
  failures: number;
  averageLatencyMs: number;
  lastFailureAt?: number;
}

export class ModelHealthRegistry {
  private readonly state = new Map<string, ModelHealth>();

  recordSuccess(model: ModelDescriptor, latencyMs: number) {
    const current = this.state.get(model.id) ?? { modelId: model.id, successes: 0, failures: 0, averageLatencyMs: 0 };
    current.averageLatencyMs = ((current.averageLatencyMs * current.successes) + latencyMs) / (current.successes + 1);
    current.successes += 1;
    this.state.set(model.id, current);
  }

  recordFailure(model: ModelDescriptor) {
    const current = this.state.get(model.id) ?? { modelId: model.id, successes: 0, failures: 0, averageLatencyMs: 0 };
    current.failures += 1;
    current.lastFailureAt = Date.now();
    this.state.set(model.id, current);
  }

  get(modelId: string) { return this.state.get(modelId); }
  all() { return [...this.state.values()]; }
}
