import { ModelGateway, ModelRequest } from './modelGateway';
import { ModelCapability, routeTask } from './modelSwarm';

export interface EnsembleAnswer { modelId: string; text: string; }
export interface EnsembleResult { primaryModelId: string; answers: EnsembleAnswer[]; consensus: string; }

export class EnsembleScheduler {
  constructor(private readonly gateway: ModelGateway) {}

  async run(prompt: string, capabilities: ModelCapability[] = ['general'], maxModels = 3, system?: string): Promise<EnsembleResult> {
    const plan = routeTask({ prompt, capabilities, maxModels });
    const answers: EnsembleAnswer[] = [];
    for (const model of plan.ensemble) {
      try {
        const result = await this.gateway.complete(
          { prompt, capabilities, maxModels: 1 },
          { prompt, system, temperature: 0.25, maxTokens: 4096 },
        );
        answers.push({ modelId: result.response.modelId, text: result.response.text });
      } catch { /* one failed member must not stop the swarm */ }
    }
    if (!answers.length) throw new Error('Ensemble produced no usable answer.');
    const consensus = answers.length === 1
      ? answers[0].text
      : answers.map((answer, index) => `Model ${index + 1} (${answer.modelId}):\n${answer.text}`).join('\n\n');
    return { primaryModelId: plan.primary.id, answers, consensus };
  }
}
