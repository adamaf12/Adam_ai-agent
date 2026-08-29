export type ToolOutcome<T = unknown> = {
  ok: boolean;
  tool: string;
  value?: T;
  error?: { code: string; message: string };
  startedAt: number;
  finishedAt: number;
};

export function toolSuccess<T>(tool: string, value: T, startedAt: number, finishedAt = Date.now()): ToolOutcome<T> {
  return { ok: true, tool, value, startedAt, finishedAt };
}

export function toolFailure(tool: string, code: string, message: string, startedAt: number, finishedAt = Date.now()): ToolOutcome<never> {
  return { ok: false, tool, error: { code, message }, startedAt, finishedAt };
}

export function summarizeToolOutcome(outcome: ToolOutcome): string {
  if (outcome.ok) return `${outcome.tool}: success`;
  return `${outcome.tool}: ${outcome.error?.code ?? 'unknown_error'}`;
}
