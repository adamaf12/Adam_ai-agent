import type { ModelCapability, SwarmTask } from './types';

export function inferCapabilities(mission: string): ModelCapability[] {
  const text = mission.toLowerCase();
  const result = new Set<ModelCapability>();
  if (/code|coding|program|debug|developer|app|software/.test(text)) result.add('coding');
  if (/research|source|search|study|investigate/.test(text)) result.add('research');
  if (/reason|analy|solve|math|logic/.test(text)) result.add('reasoning');
  if (/image|photo|vision|picture/.test(text)) result.add('vision');
  if (/arabic|عربي|العربية/.test(text)) result.add('arabic');
  if (!result.size) result.add('fast');
  return [...result];
}

export function createSwarmTask(mission: string, maxAgents = 6): SwarmTask {
  return { id: `task-${Date.now()}`, mission, requiredCapabilities: inferCapabilities(mission), maxAgents, parallelism: Math.min(4, maxAgents) };
}
