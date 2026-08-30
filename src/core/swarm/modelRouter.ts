import { modelRegistry } from './modelRegistry';
import type { ModelCapability, ModelAssignment, AgentProfile } from './types';

const aliases: Record<string, ModelCapability> = { analysis: 'reasoning', math: 'reasoning', code: 'coding', programming: 'coding', web: 'research', image: 'vision', images: 'vision', arabic: 'arabic' };

export function routeModel(agent: AgentProfile, required: readonly string[] = []): ModelAssignment {
  const capabilities = [...agent.capabilities, ...required].map((x) => aliases[x.toLowerCase()] ?? x).filter(Boolean) as ModelCapability[];
  const candidates = modelRegistry.enabled();
  const preferred = agent.preferredModels ?? [];
  const ranked = candidates.map((model) => {
    const hits = capabilities.filter((cap) => model.capabilities.includes(cap)).length;
    const pref = preferred.includes(model.id) ? 4 : 0;
    return { model, score: hits * 10 + pref + model.speedTier / 10 - model.costTier / 20 };
  }).sort((a, b) => b.score - a.score);
  const winner = ranked[0];
  if (!winner) throw new Error('No enabled model is registered');
  return { agentId: agent.id, modelId: winner.model.id, score: winner.score };
}
