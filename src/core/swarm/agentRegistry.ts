import type { AgentProfile } from './types';

export class AgentRegistry {
  private readonly agents = new Map<string, AgentProfile>();
  register(agent: AgentProfile): void { this.agents.set(agent.id, agent); }
  registerMany(agents: readonly AgentProfile[]): void { agents.forEach((agent) => this.register(agent)); }
  get(id: string): AgentProfile | undefined { return this.agents.get(id); }
  all(): AgentProfile[] { return [...this.agents.values()]; }
  enabled(): AgentProfile[] { return this.all().filter((agent) => agent.enabled); }
  byDivision(division: string): AgentProfile[] { return this.enabled().filter((agent) => agent.division === division); }
  capableOf(capability: string): AgentProfile[] { return this.enabled().filter((agent) => agent.capabilities.some((c) => c.toLowerCase() === capability.toLowerCase())); }
  size(): number { return this.agents.size; }
}

export const agentRegistry = new AgentRegistry();
agentRegistry.registerMany([
  { id: 'orchestrator', name: 'Master Orchestrator', division: 'orchestration', capabilities: ['planning', 'reasoning', 'coordination'], preferredModels: ['reasoning-default'], enabled: true },
  { id: 'software-architect', name: 'Software Architect', division: 'engineering', capabilities: ['architecture', 'coding', 'reasoning'], preferredModels: ['reasoning-default', 'coding-default'], enabled: true },
  { id: 'frontend-engineer', name: 'Frontend Engineer', division: 'engineering', capabilities: ['frontend', 'coding', 'ui'], preferredModels: ['coding-default'], enabled: true },
  { id: 'researcher', name: 'Research Specialist', division: 'research', capabilities: ['research', 'analysis', 'fact-checking'], enabled: true },
  { id: 'security-reviewer', name: 'Security Reviewer', division: 'security', capabilities: ['security', 'audit', 'reasoning'], preferredModels: ['reasoning-default'], enabled: true },
  { id: 'qa-engineer', name: 'QA Engineer', division: 'quality', capabilities: ['testing', 'qa', 'coding'], preferredModels: ['coding-default'], enabled: true },
]);
