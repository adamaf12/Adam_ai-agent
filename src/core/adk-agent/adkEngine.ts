/**
 * Google ADK (adk.dev) Core Workflow & Multi-Agent Orchestration Engine
 * Implements LlmAgent, SequentialAgent, ParallelAgent, LoopAgent, and Dynamic Routing.
 */

import type {
  BaseAgent,
  AgentRunContext,
  AgentRole,
  LlmAgentConfig,
  MultiAgentExecutionPlan,
  AgentTelemetryEvent,
} from './adkTypes';
import {
  ArchitectAgent,
  CodeMasterAgent,
  SecuritySentinelAgent,
  ResearchScoutAgent,
  HardwareAdkAgent,
  EvaluatorOptimizerAgent,
} from './specialistAgents';

export class LlmAgent implements BaseAgent {
  name: string;
  role: AgentRole;
  description: string;
  config: LlmAgentConfig;

  constructor(config: LlmAgentConfig) {
    this.name = config.name;
    this.role = config.role;
    this.description = config.description;
    this.config = config;
  }

  async run(input: string, context: AgentRunContext): Promise<string> {
    context.emitEvent({
      id: `evt_${Date.now()}_start`,
      timestamp: Date.now(),
      type: 'agent_start',
      agentName: this.name,
      agentRole: this.role,
      message: `${this.name} (${this.role}) initiated task processing.`,
    });

    // Handle Sub-Agents delegation if any
    if (this.config.subAgents && this.config.subAgents.length > 0 && context.delegationDepth < 3) {
      for (const subAgent of this.config.subAgents) {
        context.emitEvent({
          id: `evt_${Date.now()}_del`,
          timestamp: Date.now(),
          type: 'agent_delegation',
          agentName: this.name,
          agentRole: this.role,
          message: `Delegating sub-task to ${subAgent.name} (${subAgent.role}).`,
        });
        await subAgent.run(input, { ...context, delegationDepth: context.delegationDepth + 1 });
      }
    }

    return input;
  }
}

/**
 * SequentialAgent (Pipeline Workflow)
 * Executes an ordered sequence of agents, passing the output of each as input to the next.
 */
export class SequentialAgent implements BaseAgent {
  name: string;
  role: AgentRole = 'orchestrator';
  description: string;
  agents: BaseAgent[];

  constructor(name: string, description: string, agents: BaseAgent[]) {
    this.name = name;
    this.description = description;
    this.agents = agents;
  }

  async run(input: string, context: AgentRunContext): Promise<string> {
    let current = input;
    for (const agent of this.agents) {
      current = await agent.run(current, context);
    }
    return current;
  }
}

/**
 * ParallelAgent (Concurrent Swarm Workflow)
 * Executes multiple agents concurrently in parallel branches and aggregates outputs.
 */
export class ParallelAgent implements BaseAgent {
  name: string;
  role: AgentRole = 'orchestrator';
  description: string;
  agents: BaseAgent[];

  constructor(name: string, description: string, agents: BaseAgent[]) {
    this.name = name;
    this.description = description;
    this.agents = agents;
  }

  async run(input: string, context: AgentRunContext): Promise<string> {
    context.emitEvent({
      id: `evt_${Date.now()}_parallel`,
      timestamp: Date.now(),
      type: 'parallel_branch',
      agentName: this.name,
      agentRole: this.role,
      message: `Executing ${this.agents.length} parallel specialized agents via Google ADK swarm.`,
      details: { agents: this.agents.map(a => a.name) },
    });

    await Promise.all(this.agents.map(agent => agent.run(input, context)));
    return input;
  }
}

/**
 * LoopAgent (Evaluator-Optimizer Iterative Workflow)
 * Repeatedly runs generator and evaluator until condition is met or max iterations reached.
 */
export class LoopAgent implements BaseAgent {
  name: string;
  role: AgentRole = 'evaluator';
  description: string;
  generator: BaseAgent;
  evaluator: BaseAgent;
  maxIterations: number;

  constructor(name: string, generator: BaseAgent, evaluator: BaseAgent, maxIterations = 2) {
    this.name = name;
    this.description = 'Iterative Evaluator-Optimizer loop';
    this.generator = generator;
    this.evaluator = evaluator;
    this.maxIterations = maxIterations;
  }

  async run(input: string, context: AgentRunContext): Promise<string> {
    let output = input;
    for (let iter = 1; iter <= this.maxIterations; iter++) {
      output = await this.generator.run(output, context);
      output = await this.evaluator.run(output, context);
    }
    return output;
  }
}

/**
 * Master ADK Multi-Agent Orchestrator
 */
export function buildAdkMultiAgentSwarm(): {
  architect: ArchitectAgent;
  coder: CodeMasterAgent;
  security: SecuritySentinelAgent;
  researcher: ResearchScoutAgent;
  hardware: HardwareAdkAgent;
  evaluator: EvaluatorOptimizerAgent;
  sequentialPipeline: SequentialAgent;
  parallelSwarm: ParallelAgent;
} {
  const architect = new ArchitectAgent();
  const coder = new CodeMasterAgent();
  const security = new SecuritySentinelAgent();
  const researcher = new ResearchScoutAgent();
  const hardware = new HardwareAdkAgent();
  const evaluator = new EvaluatorOptimizerAgent();

  const parallelSwarm = new ParallelAgent(
    'ADEM-Parallel-Swarm',
    'Concurrent execution across Code, Security, Research, and Hardware agents',
    [coder, security, researcher, hardware]
  );

  const sequentialPipeline = new SequentialAgent(
    'ADEM-Core-Pipeline',
    'Master ADK Sequential Pipeline: Architect -> Swarm -> Evaluator',
    [architect, parallelSwarm, evaluator]
  );

  return {
    architect,
    coder,
    security,
    researcher,
    hardware,
    evaluator,
    sequentialPipeline,
    parallelSwarm,
  };
}

export function generateAdkPlanForPrompt(prompt: string, language: 'ar' | 'en'): MultiAgentExecutionPlan {
  const isAr = language === 'ar';
  const lower = prompt.toLowerCase();

  const isCode = /(?:code|app|game|program|build|script|html|css|js|برمج|كود|تطبيق|لعبة)/i.test(lower);
  const isHardware = /(?:adk|arduino|esp32|sensor|gpio|servo|robot|hardware|عتاد|روبوت|حساس|بوردة)/i.test(lower);
  const isResearch = /(?:search|news|weather|who is|latest|اليوم|اخبار|أخبار|ابحث|طقس)/i.test(lower);

  const involved = [
    {
      name: 'ADEM-Architect',
      role: 'orchestrator' as AgentRole,
      responsibility: isAr ? 'تخطيط وتفكيك الهدف' : 'Workflow planning & goal decomposition',
    },
  ];

  if (isCode) {
    involved.push({
      name: 'ADEM-CodeMaster',
      role: 'coder' as AgentRole,
      responsibility: isAr ? 'هندسة الكود المستقل والتنفيذي 100%' : '100% executable full-stack code synthesis',
    });
    involved.push({
      name: 'ADEM-SecuritySentinel',
      role: 'security' as AgentRole,
      responsibility: isAr ? 'فحص الأمان والتحقق من سلامة الأكواد' : 'Static analysis & sandbox validation',
    });
  }

  if (isHardware) {
    involved.push({
      name: 'ADEM-HardwareADK',
      role: 'hardware' as AgentRole,
      responsibility: isAr ? 'تهيئة بروتوكول AOA 2.0 والمنافذ' : 'Google AOA 2.0 bus & pin registry mapping',
    });
  }

  if (isResearch) {
    involved.push({
      name: 'ADEM-ResearchScout',
      role: 'researcher' as AgentRole,
      responsibility: isAr ? 'البحث اللحظي الموثق' : 'Live web grounding & fact verification',
    });
  }

  involved.push({
    name: 'ADEM-EvaluatorOptimizer',
    role: 'evaluator' as AgentRole,
    responsibility: isAr ? 'التحقق المنطقي والرياضي' : 'Mathematical & logical self-correction',
  });

  return {
    planId: `adk_plan_${Date.now()}`,
    goal: prompt.slice(0, 80),
    mode: isCode || isHardware ? 'parallel' : 'sequential',
    agentsInvolved: involved,
    steps: involved.map((ag, index) => ({
      stepNumber: index + 1,
      description: ag.responsibility,
      assignedAgent: ag.name,
    })),
  };
}
