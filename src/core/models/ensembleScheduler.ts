import type { ModelGateway } from './modelGateway';
import type { ModelCapability, ModelDescriptor } from './modelSwarm';
import { modelRegistry, routeTask } from './modelSwarm';

export interface EnsembleAnswer { modelId: string; text: string; latencyMs: number; }
export interface EnsembleResult { primaryModelId: string; answers: EnsembleAnswer[]; failures: Array<{ modelId: string; error: string }>; consensus: string; }

export class EnsembleScheduler {
  constructor(private readonly gateway: ModelGateway) {}

  async run(prompt: string, capabilities: ModelCapability[] = ['general'], maxModels = 3, system?: string, concurrency = 4): Promise<EnsembleResult> {
    const plan = routeTask({ prompt, capabilities, maxModels });
    const models = plan.ensemble;
    const answers: EnsembleAnswer[] = [];
    const failures: EnsembleResult['failures'] = [];
    const limit = Math.max(1, Math.min(32, Math.floor(concurrency)));
    let cursor = 0;
    const gateway = this.gateway;

    async function invoke(model: ModelDescriptor) {
      const started = Date.now();
      try {
        const result = await gateway.invokeSelected(model, { prompt, system, temperature: 0.25, maxTokens: 4096 });
        answers.push({ modelId: result.modelId, text: result.text, latencyMs: Date.now() - started });
      } catch (error) {
        failures.push({ modelId: model.id, error: error instanceof Error ? error.message : String(error) });
      }
    }

    async function worker() {
      while (true) {
        const index = cursor++;
        if (index >= models.length) return;
        await invoke(models[index]);
      }
    }

    await Promise.all(Array.from({ length: Math.min(limit, models.length) }, () => worker()));
    if (!answers.length) throw new Error('Ensemble produced no usable answer.');
    const consensus = answers.length === 1
      ? answers[0].text
      : answers.map((answer, index) => `Model ${index + 1} (${answer.modelId}):\n${answer.text}`).join('\n\n');
    return { primaryModelId: plan.primary.id, answers, failures, consensus };
  }
}

export function getSwarmCapacity() { return { registered: modelRegistry.size(), enabled: modelRegistry.enabled().length }; }
