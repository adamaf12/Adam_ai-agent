import type { AgentProfile, SwarmTask } from './types';
import { routeModel } from './modelRouter';

export interface TeamMember { agent: AgentProfile; modelId: string; score: number; }

export function buildTeam(task: SwarmTask, agents: readonly AgentProfile[]): TeamMember[] {
  return agents.filter((a) => a.enabled).map((agent) => {
    const assignment = routeModel(agent, task.requiredCapabilities);
    return { agent, modelId: assignment.modelId, score: assignment.score };
  }).sort((a, b) => b.score - a.score).slice(0, Math.max(1, task.maxAgents));
}
