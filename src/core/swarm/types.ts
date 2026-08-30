export type ModelCapability = 'reasoning' | 'coding' | 'research' | 'vision' | 'fast' | 'arabic';
export type ModelProvider = 'local' | 'open' | 'gemini' | 'custom';

export interface ModelProfile {
  id: string;
  provider: ModelProvider;
  capabilities: readonly ModelCapability[];
  contextLength: number;
  costTier: 0 | 1 | 2 | 3;
  speedTier: 1 | 2 | 3 | 4 | 5;
  enabled: boolean;
}

export interface AgentProfile {
  id: string;
  name: string;
  division: string;
  capabilities: readonly string[];
  preferredModels?: readonly string[];
  enabled: boolean;
}

export interface SwarmTask {
  id: string;
  mission: string;
  requiredCapabilities: readonly string[];
  maxAgents: number;
  parallelism: number;
}

export interface ModelAssignment {
  agentId: string;
  modelId: string;
  score: number;
}

export interface SwarmPlan {
  task: SwarmTask;
  assignments: ModelAssignment[];
  waves: ModelAssignment[][];
}
