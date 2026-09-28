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
  { id: 'code-explorer', name: 'Code Explorer', division: 'engineering', capabilities: ['codebase-analysis', 'debugging', 'research', 'coding'], preferredModels: ['reasoning-default', 'coding-default'], enabled: true },
  { id: 'code-reviewer', name: 'Code Reviewer', division: 'quality', capabilities: ['review', 'security', 'coding', 'testing'], preferredModels: ['reasoning-default'], enabled: true },
  { id: 'build-error-resolver', name: 'Build Error Resolver', division: 'engineering', capabilities: ['build', 'debugging', 'coding', 'recovery'], preferredModels: ['coding-default'], enabled: true },
  { id: 'test-engineer', name: 'Test Engineer', division: 'quality', capabilities: ['testing', 'regression', 'qa', 'coding'], preferredModels: ['coding-default'], enabled: true },
  { id: 'deployment-engineer', name: 'Deployment Engineer', division: 'operations', capabilities: ['deployment', 'devops', 'security', 'debugging'], preferredModels: ['reasoning-default'], enabled: true },
  { id: 'performance-engineer', name: 'Performance Engineer', division: 'quality', capabilities: ['performance', 'optimization', 'analysis'], preferredModels: ['reasoning-default'], enabled: true },
  { id: 'database-engineer', name: 'Database Engineer', division: 'data', capabilities: ['database', 'sql', 'security', 'coding'], preferredModels: ['coding-default'], enabled: true },
  { id: 'accessibility-engineer', name: 'Accessibility Engineer', division: 'quality', capabilities: ['accessibility', 'ui', 'testing'], preferredModels: ['reasoning-default'], enabled: true },
  { id: 'documentation-agent', name: 'Documentation Agent', division: 'knowledge', capabilities: ['documentation', 'analysis'], enabled: true },
  { id: 'debugger', name: 'Root Cause Debugger', division: 'engineering', capabilities: ['debugging', 'root-cause', 'recovery', 'reasoning'], preferredModels: ['reasoning-default'], enabled: true },
  { id: 'orchestrator', name: 'Master Orchestrator', division: 'orchestration', capabilities: ['planning', 'reasoning', 'coordination'], preferredModels: ['reasoning-default'], enabled: true },
  { id: 'software-architect', name: 'Software Architect', division: 'engineering', capabilities: ['architecture', 'coding', 'reasoning'], preferredModels: ['reasoning-default', 'coding-default'], enabled: true },
  { id: 'frontend-engineer', name: 'Frontend Engineer', division: 'engineering', capabilities: ['frontend', 'coding', 'ui'], preferredModels: ['coding-default'], enabled: true },
  { id: 'researcher', name: 'Research Specialist', division: 'research', capabilities: ['research', 'analysis', 'fact-checking'], enabled: true },
  { id: 'security-reviewer', name: 'Security Reviewer', division: 'security', capabilities: ['security', 'audit', 'reasoning'], preferredModels: ['reasoning-default'], enabled: true },
  { id: 'qa-engineer', name: 'QA Engineer', division: 'quality', capabilities: ['testing', 'qa', 'coding'], preferredModels: ['coding-default'], enabled: true },
]);
