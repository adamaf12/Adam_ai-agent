export type ToolRisk = 'read' | 'write';

export type ToolContext = {
  userId?: string;
  signal?: AbortSignal;
};

export type ToolDefinition<TArgs = unknown, TResult = unknown> = {
  name: string;
  description: string;
  risk: ToolRisk;
  execute: (args: TArgs, context: ToolContext) => Promise<TResult>;
};

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition<any, any>>();

  register<TArgs, TResult>(tool: ToolDefinition<TArgs, TResult>) {
    if (!/^[a-z][a-z0-9_]{1,63}$/.test(tool.name)) {
      throw new Error(`Invalid tool name: ${tool.name}`);
    }
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
    return this;
  }

  get(name: string) {
    return this.tools.get(name);
  }

  list() {
    return [...this.tools.values()].map(({ execute: _execute, ...definition }) => definition);
  }

  async execute(name: string, args: unknown, context: ToolContext = {}) {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Unknown tool: ${name}`);
    if (context.signal?.aborted) throw new Error('Tool execution aborted');
    return tool.execute(args, context);
  }
}

export const createDefaultToolRegistry = () => new ToolRegistry();
