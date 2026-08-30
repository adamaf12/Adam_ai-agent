import type { AgentProfile, SwarmPlan, SwarmTask } from './types';
import { buildTeam } from './teamBuilder';
import { scheduleWaves } from './scheduler';

export function planSwarm(task: SwarmTask, agents: readonly AgentProfile[]): SwarmPlan {
  const team = buildTeam(task, agents);
  const assignments = team.map(({ agent, modelId, score }) => ({ agentId: agent.id, modelId, score }));
  return { task, assignments, waves: scheduleWaves(assignments, task.parallelism) };
}
