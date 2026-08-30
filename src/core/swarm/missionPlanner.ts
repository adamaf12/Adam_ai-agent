import type { AgentProfile, ModelAssignment, SwarmTask } from './types';
import { routeModel } from './modelRouter';
import { inferCapabilities } from './capabilityRouter';

export function buildMission(mission: string, id = 'mission'): SwarmTask {
  const requiredCapabilities = inferCapabilities(mission);
  const complex = requiredCapabilities.length > 1;
  return { id, mission, requiredCapabilities, maxAgents: complex ? 5 : 2, parallelism: complex ? 3 : 1 };
}

export function selectAgents(task: SwarmTask, agents: readonly AgentProfile[]): AgentProfile[] {
  const required = new Set(task.requiredCapabilities.map((value) => value.toLowerCase()));
  return agents.filter((agent) => agent.enabled)
    .map((agent) => ({ agent, score: agent.capabilities.filter((capability) => required.has(capability.toLowerCase())).length }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, task.maxAgents))
    .map((item) => item.agent);
}

export function assignModels(task: SwarmTask, agents: readonly AgentProfile[]): ModelAssignment[] {
  return selectAgents(task, agents).map((agent) => routeModel(agent, task.requiredCapabilities));
}
