export type PlanStep = {
  id: string;
  tool: string;
  input?: unknown;
  dependsOn?: string[];
};

export type Plan = {
  needsTool: boolean;
  tool?: string;
  input?: unknown;
  steps?: PlanStep[];
};
export type ToolResult = { ok: boolean; data?: unknown; error?: string };
export type Verification = { ok: boolean; facts: unknown; warning?: string };

export type ResponseOrchestratorDeps = {
  plan: (input: { text: string; history: unknown[] }) => Promise<Plan>;
  executeTool: (tool: string, input: unknown, signal?: AbortSignal) => Promise<ToolResult>;
  verify: (result: ToolResult, input: { text: string; history: unknown[] }) => Promise<Verification>;
  compose: (context: unknown, input: { text: string; history: unknown[] }) => Promise<string>;
};

export type ResponseRunResult = { text: string; usedTool: boolean; tool?: string; warning?: string };

const MAX_STEPS = 6;

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('The agent run was aborted.', 'AbortError');
}

function normalizeSteps(plan: Plan): PlanStep[] {
  if (Array.isArray(plan.steps) && plan.steps.length) return plan.steps.slice(0, MAX_STEPS);
  if (plan.needsTool && plan.tool) return [{ id: 'tool-1', tool: plan.tool, input: plan.input ?? {} }];
  return [];
}

function orderSteps(steps: PlanStep[]): PlanStep[] {
  const byId = new Map(steps.map(step => [step.id, step]));
  const ordered: PlanStep[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (id: string) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error(`Agent execution cycle detected at step: ${id}`);
    const step = byId.get(id);
    if (!step || !step.id.trim() || !step.tool.trim()) throw new Error(`Invalid agent execution step: ${id}`);
    visiting.add(id);
    for (const dependency of [...new Set(step.dependsOn ?? [])]) {
      if (!byId.has(dependency)) throw new Error(`Missing agent execution dependency: ${dependency}`);
      visit(dependency);
    }
    visiting.delete(id);
    visited.add(id);
    ordered.push(step);
  };

  for (const step of steps) visit(step.id);
  return ordered;
}

export function createResponseOrchestrator(deps: ResponseOrchestratorDeps) {
  return {
    async run(input: { text: string; history: unknown[]; signal?: AbortSignal }): Promise<ResponseRunResult> {
      throwIfAborted(input.signal);
      const plan = await deps.plan(input);
      throwIfAborted(input.signal);

      const steps = normalizeSteps(plan);
      if (!steps.length) {
        return { text: await deps.compose(undefined, input), usedTool: false };
      }

      const orderedSteps = orderSteps(steps);
      const results: Record<string, { tool: string; result: ToolResult; verification: Verification }> = {};
      let warning: string | undefined;

      for (const step of orderedSteps) {
        throwIfAborted(input.signal);
        const result = await deps.executeTool(step.tool, step.input ?? {}, input.signal);
        throwIfAborted(input.signal);

        if (!result.ok) {
          warning = result.error ?? 'Tool execution failed.';
          return {
            text: await deps.compose({ toolError: warning, results }, input),
            usedTool: true,
            tool: step.tool,
            warning,
          };
        }

        const verification = await deps.verify(result, input);
        throwIfAborted(input.signal);
        results[step.id] = { tool: step.tool, result, verification };
        warning ??= verification.warning;
      }

      const firstTool = orderedSteps[0]?.tool;
      const text = await deps.compose({ results, verificationCount: orderedSteps.length }, input);
      return { text, usedTool: true, tool: firstTool, warning };
    },
  };
}

export function normalizeResponseError(error: unknown) {
  const status = Number((error as { status?: number })?.status ?? 0);
  const raw = String((error as Error)?.message ?? '').toLowerCase();
  if (status === 429 || raw.includes('quota') || raw.includes('rate limit')) return { code: 'AI_RATE_LIMIT', message: 'Adam is temporarily rate-limited. Please try again in a moment.' };
  if (status === 401 || status === 403 || raw.includes('permission') || raw.includes('api key')) return { code: 'AI_AUTH', message: 'Adam could not authenticate with the AI provider.' };
  if (status >= 500 || raw.includes('unavailable') || raw.includes('timeout')) return { code: 'AI_PROVIDER', message: 'Adam’s AI service is temporarily unavailable.' };
  return { code: 'AI_ERROR', message: 'Adam could not complete the request. Please try again.' };
}
