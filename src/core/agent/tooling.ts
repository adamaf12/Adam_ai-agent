export type ToolName = 'task.create' | 'task.list' | 'task.complete' | 'task.delete' | 'memory.remember' | 'memory.search' | 'memory.delete';

export type ToolCall = {
  id: string;
  name: ToolName;
  arguments: Record<string, unknown>;
};

export type ToolResult = {
  id: string;
  name: ToolName;
  ok: boolean;
  data?: unknown;
  error?: { code: string; message: string };
};

export type ToolContext = {
  userId: string;
  locale: 'ar' | 'en';
  signal: AbortSignal;
};

export type ToolDefinition = {
  name: ToolName;
  description: string;
  parameters: Record<string, unknown>;
  execute: (call: ToolCall, context: ToolContext) => Promise<ToolResult>;
};

export function isToolName(value: unknown): value is ToolName {
  return typeof value === 'string' && [
    'task.create', 'task.list', 'task.complete', 'task.delete',
    'memory.remember', 'memory.search', 'memory.delete',
  ].includes(value);
}

export function validateToolCall(value: unknown): ToolCall {
  if (!value || typeof value !== 'object') throw new Error('Invalid tool call.');
  const call = value as Partial<ToolCall>;
  if (typeof call.id !== 'string' || !call.id) throw new Error('Tool call id is required.');
  if (!isToolName(call.name)) throw new Error('Unsupported tool.');
  if (!call.arguments || typeof call.arguments !== 'object' || Array.isArray(call.arguments)) {
    throw new Error('Tool arguments must be an object.');
  }
  return { id: call.id, name: call.name, arguments: call.arguments as Record<string, unknown> };
}
