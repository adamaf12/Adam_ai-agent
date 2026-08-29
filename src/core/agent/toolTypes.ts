export type ToolContext = {
  signal?: AbortSignal;
  requestId: string;
};

export type ToolResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export type AgentTool<TInput = unknown, TOutput = unknown> = {
  name: string;
  description: string;
  timeoutMs?: number;
  execute: (input: TInput, context: ToolContext) => Promise<ToolResult<TOutput>>;
};

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
