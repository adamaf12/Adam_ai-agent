import type { SwarmPlan, SwarmResult } from './types';
import type { ModelGateway, GenerateRequest } from './gateway';
import { modelRegistry } from './modelRegistry';

export async function executePlan(plan: SwarmPlan, gateway: ModelGateway): Promise<SwarmResult[]> {
  const results: SwarmResult[] = [];
  for (const wave of plan.waves) {
    const waveResults = await Promise.all(wave.map(async (assignment) => {
      const model = modelRegistry.get(assignment.modelId);
      if (!model) return { agentId: assignment.agentId, modelId: assignment.modelId, output: '', durationMs: 0, ok: false, error: 'Model is not registered.' };
      const request: GenerateRequest = { model, prompt: plan.task.mission };
      const started = Date.now();
      try { const result = await gateway.generate(request); return { ...result, agentId: assignment.agentId, durationMs: Date.now() - started }; }
      catch (error) { return { agentId: assignment.agentId, modelId: assignment.modelId, output: '', durationMs: Date.now() - started, ok: false, error: error instanceof Error ? error.message : String(error) }; }
    }));
    results.push(...waveResults);
  }
  return results;
}
