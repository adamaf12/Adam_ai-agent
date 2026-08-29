import type { ToolCall, ToolName } from './tooling';

const READ_ONLY: ToolName[] = ['task.list', 'memory.search'];
const MUTATING: ToolName[] = ['task.create', 'task.complete', 'task.delete', 'memory.remember', 'memory.delete'];

export function isReadOnlyTool(name: ToolName): boolean {
  return READ_ONLY.includes(name);
}

export function requiresConfirmation(name: ToolName): boolean {
  // Local task/memory mutations are reversible application actions, but the
  // UI may still request confirmation for destructive operations.
  return name === 'task.delete' || name === 'memory.delete';
}

export function validateExecution(call: ToolCall): void {
  if (READ_ONLY.includes(call.name) || MUTATING.includes(call.name)) return;
  throw new Error(`Tool is not allowed: ${call.name}`);
}
