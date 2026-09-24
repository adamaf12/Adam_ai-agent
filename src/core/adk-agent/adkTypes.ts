/**
 * Google Agent Development Kit (ADK - adk.dev) Standard Architecture
 * Core types for Multi-Agent Systems, Workflows, Tools, and Telemetry Events.
 */

export type AgentRole = 'orchestrator' | 'coder' | 'researcher' | 'security' | 'hardware' | 'evaluator';

export interface ToolDefinition<TParams = any, TResult = any> {
  name: string;
  description: string;
  parameters: {
    type: 'OBJECT' | 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      items?: any;
    }>;
    required?: string[];
  };
  execute: (params: TParams, context: AgentRunContext) => Promise<TResult> | TResult;
}

export interface AgentRunContext {
  sessionId: string;
  language: 'ar' | 'en';
  state: Record<string, any>;
  memory: Array<{ role: string; content: string }>;
  delegationDepth: number;
  maxIterations?: number;
  emitEvent: (event: AgentTelemetryEvent) => void;
}

export type AgentTelemetryEventType =
  | 'agent_start'
  | 'thought_step'
  | 'tool_call'
  | 'tool_result'
  | 'agent_delegation'
  | 'evaluator_correction'
  | 'parallel_branch'
  | 'agent_complete'
  | 'agent_error';

export interface AgentTelemetryEvent {
  id: string;
  timestamp: number;
  type: AgentTelemetryEventType;
  agentName: string;
  agentRole: AgentRole;
  message: string;
  details?: Record<string, any>;
}

export interface BaseAgent {
  name: string;
  role: AgentRole;
  description: string;
  run: (input: string, context: AgentRunContext) => Promise<string>;
}

export interface LlmAgentConfig {
  name: string;
  role: AgentRole;
  description: string;
  systemInstruction: string;
  modelId?: string;
  tools?: ToolDefinition[];
  subAgents?: BaseAgent[];
}

export interface AdkWorkflowStep {
  agent: BaseAgent;
  condition?: (state: Record<string, any>) => boolean;
}

export interface MultiAgentExecutionPlan {
  planId: string;
  goal: string;
  mode: 'sequential' | 'parallel' | 'evaluator_loop' | 'direct';
  agentsInvolved: { name: string; role: AgentRole; responsibility: string }[];
  steps: { stepNumber: number; description: string; assignedAgent: string }[];
}
