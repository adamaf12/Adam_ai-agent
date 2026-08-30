import type { ModelGateway } from './modelGateway';
import type { ModelCapability } from './modelSwarm';
import { routeTask } from './modelSwarm';

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

    async function worker() {
      while (cursor < models.length) {
        const model = models[cursor++];
        const started = Date.now();
        try {
          const result = await this.gateway.complete(
            { prompt, capabilities, maxModels: 1 },
            { prompt, system, temperature: 0.25, maxTokens: 4096 },
          );
          answers.push({ modelId: result.response.modelId, text: result.response.text, latencyMs: Date.now() - started });
        } catch (error) {
          failures.push({ modelId: model.id, error: error instanceof Error ? error.message : String(error) });
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(limit, models.length) }, () => worker.call(this)));
    if (!answers.length) throw new Error('Ensemble produced no usable answer.');
    const consensus = answers.length === 1
      ? answers[0].text
      : answers.map((answer, index) => `Model ${index + 1} (${answer.modelId}):\n${answer.text}`).join('\n\n');
    return { primaryModelId: plan.primary.id, answers, failures, consensus };
  }
}
