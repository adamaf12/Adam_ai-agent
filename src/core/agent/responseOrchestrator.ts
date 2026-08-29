export type Plan = { needsTool: boolean; tool?: string; input?: unknown };
export type ToolResult = { ok: boolean; data?: unknown; error?: string };
export type Verification = { ok: boolean; facts: unknown; warning?: string };

export type ResponseOrchestratorDeps = {
  plan: (input: { text: string; history: unknown[] }) => Promise<Plan>;
  executeTool: (tool: string, input: unknown, signal?: AbortSignal) => Promise<ToolResult>;
  verify: (result: ToolResult, input: { text: string; history: unknown[] }) => Promise<Verification>;
  compose: (context: unknown, input: { text: string; history: unknown[] }) => Promise<string>;
};

export type ResponseRunResult = { text: string; usedTool: boolean; tool?: string; warning?: string };

export function createResponseOrchestrator(deps: ResponseOrchestratorDeps) {
  return {
    async run(input: { text: string; history: unknown[]; signal?: AbortSignal }): Promise<ResponseRunResult> {
      const plan = await deps.plan(input);
      if (!plan.needsTool) {
        return { text: await deps.compose(undefined, input), usedTool: false };
      }
      if (!plan.tool) throw new Error('Agent selected a tool without a tool name.');
      const result = await deps.executeTool(plan.tool, plan.input ?? {}, input.signal);
      if (!result.ok) {
        const text = await deps.compose({ toolError: result.error ?? 'Tool execution failed.' }, input);
        return { text, usedTool: true, tool: plan.tool, warning: result.error };
      }
      const verified = await deps.verify(result, input);
      const text = await deps.compose(verified, input);
      return { text, usedTool: true, tool: plan.tool, warning: verified.warning };
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
