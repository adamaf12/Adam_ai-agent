export type ToolRisk = 'read' | 'write';

export type ToolContext = {
  userId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type ToolDefinition<TArgs = unknown, TResult = unknown> = {
  name: string;
  description: string;
  risk: ToolRisk;
  execute: (args: TArgs, context: ToolContext) => Promise<TResult>;
};

const DEFAULT_TIMEOUT_MS = 30_000;

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition<any, any>>();

  register<TArgs, TResult>(tool: ToolDefinition<TArgs, TResult>) {
    if (!/^[a-z][a-z0-9_]{1,63}$/.test(tool.name)) throw new Error(`Invalid tool name: ${tool.name}`);
    if (!tool.description.trim()) throw new Error(`Tool description is required: ${tool.name}`);
    if (this.tools.has(tool.name)) throw new Error(`Tool already registered: ${tool.name}`);
    this.tools.set(tool.name, tool);
    return this;
  }

  get(name: string) { return this.tools.get(name); }

  list() {
    return [...this.tools.values()].map(({ execute: _execute, ...definition }) => definition);
  }

  async execute(name: string, args: unknown, context: ToolContext = {}) {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Unknown tool: ${name}`);
    if (context.signal?.aborted) throw new Error('Tool execution aborted');

    const timeoutMs = Math.max(100, Math.min(context.timeoutMs ?? DEFAULT_TIMEOUT_MS, 120_000));
    const timeoutController = new AbortController();

    let timer: ReturnType<typeof setTimeout> | undefined;
    let rejectAbort: ((reason?: unknown) => void) | undefined;
    const abortPromise = context.signal
      ? new Promise<never>((_, reject) => { rejectAbort = reject; })
      : new Promise<never>(() => {});
    const parentAbort = () => {
      timeoutController.abort();
      rejectAbort?.(new Error('Tool execution aborted'));
    };
    context.signal?.addEventListener('abort', parentAbort, { once: true });

    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        timeoutController.abort();
        reject(new Error(`Tool execution timed out: ${name}`));
      }, timeoutMs);
    });

    try {
      const execution = Promise.resolve().then(() => tool.execute(args, { ...context, signal: timeoutController.signal }));
      return await Promise.race([execution, timeoutPromise, abortPromise]);
    } finally {
      if (timer) clearTimeout(timer);
      context.signal?.removeEventListener('abort', parentAbort);
    }
  }
}

export const createDefaultToolRegistry = () => new ToolRegistry();
