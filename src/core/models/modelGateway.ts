import { ModelDescriptor, RoutingPlan, RoutingTask, routeTask } from './modelSwarm';

export interface ModelRequest { prompt: string; system?: string; temperature?: number; maxTokens?: number; }
export interface ModelResponse { text: string; modelId: string; provider: string; latencyMs: number; }
export type ModelInvoker = (model: ModelDescriptor, request: ModelRequest) => Promise<string>;
export interface GatewayResult { response: ModelResponse; plan: RoutingPlan; attempts: string[]; }

function usableText(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0; }

export class ModelGateway {
  constructor(private readonly invoke: ModelInvoker) {}

  async invokeSelected(model: ModelDescriptor, request: ModelRequest): Promise<ModelResponse> {
    const started = Date.now();
    const text = await this.invoke(model, request);
    if (!usableText(text)) throw new Error(`Empty response from ${model.id}`);
    return { text: text.trim(), modelId: model.id, provider: model.provider, latencyMs: Date.now() - started };
  }

  async complete(task: RoutingTask, request: ModelRequest): Promise<GatewayResult> {
    const plan = routeTask(task);
    const attempts: string[] = [];
    const candidates = plan.ensemble.length ? plan.ensemble : [plan.primary];
    let lastError: unknown;
    for (const model of candidates) {
      attempts.push(model.id);
      try {
        return { response: await this.invokeSelected(model, request), plan, attempts };
      } catch (error) { lastError = error; }
    }
    throw lastError instanceof Error ? lastError : new Error('All selected models failed.');
  }
}
