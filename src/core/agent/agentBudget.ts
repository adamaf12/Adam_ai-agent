export interface AgentBudget {
  maxSteps: number;
  maxToolCalls: number;
  maxContextChars: number;
  maxResponseChars: number;
  timeoutMs: number;
}

export const DEFAULT_AGENT_BUDGET: Readonly<AgentBudget> = Object.freeze({
  maxSteps: 8,
  maxToolCalls: 6,
  maxContextChars: 48_000,
  maxResponseChars: 16_000,
  timeoutMs: 45_000,
});

export function normalizeAgentBudget(input?: Partial<AgentBudget>): AgentBudget {
  const clamp = (value: unknown, fallback: number, min: number, max: number) => {
    const number = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback;
    return Math.min(max, Math.max(min, number));
  };
  return {
    maxSteps: clamp(input?.maxSteps, DEFAULT_AGENT_BUDGET.maxSteps, 1, 20),
    maxToolCalls: clamp(input?.maxToolCalls, DEFAULT_AGENT_BUDGET.maxToolCalls, 0, 20),
    maxContextChars: clamp(input?.maxContextChars, DEFAULT_AGENT_BUDGET.maxContextChars, 4_000, 200_000),
    maxResponseChars: clamp(input?.maxResponseChars, DEFAULT_AGENT_BUDGET.maxResponseChars, 1_000, 64_000),
    timeoutMs: clamp(input?.timeoutMs, DEFAULT_AGENT_BUDGET.timeoutMs, 2_000, 180_000),
  };
}

export function canSpendStep(spent: number, budget: AgentBudget): boolean {
  return Number.isFinite(spent) && spent >= 0 && spent < budget.maxSteps;
}

export function canSpendToolCall(spent: number, budget: AgentBudget): boolean {
  return Number.isFinite(spent) && spent >= 0 && spent < budget.maxToolCalls;
}
