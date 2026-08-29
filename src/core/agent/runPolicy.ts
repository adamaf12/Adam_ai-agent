export type RunPolicy = {
  maxSteps: number;
  maxToolCalls: number;
  maxTotalMs: number;
  maxResponseChars: number;
};

export const DEFAULT_RUN_POLICY: RunPolicy = {
  maxSteps: 8,
  maxToolCalls: 12,
  maxTotalMs: 120_000,
  maxResponseChars: 40_000,
};

export type RunUsage = { steps: number; toolCalls: number; elapsedMs: number; responseChars: number };

export function assertRunBudget(policy: RunPolicy, usage: RunUsage): void {
  if (usage.steps > policy.maxSteps) throw new Error('Agent step budget exceeded.');
  if (usage.toolCalls > policy.maxToolCalls) throw new Error('Agent tool-call budget exceeded.');
  if (usage.elapsedMs > policy.maxTotalMs) throw new Error('Agent run time budget exceeded.');
  if (usage.responseChars > policy.maxResponseChars) throw new Error('Agent response budget exceeded.');
}

export function mergeRunPolicy(base: RunPolicy, override?: Partial<RunPolicy>): RunPolicy {
  const next = { ...base, ...override };
  for (const [key, value] of Object.entries(next)) {
    if (!Number.isFinite(value) || value <= 0) throw new Error(`Invalid run policy: ${key}`);
  }
  return {
    maxSteps: Math.floor(next.maxSteps),
    maxToolCalls: Math.floor(next.maxToolCalls),
    maxTotalMs: Math.floor(next.maxTotalMs),
    maxResponseChars: Math.floor(next.maxResponseChars),
  };
}
