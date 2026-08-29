import type { ToolName } from './tooling';

const WRITE_TOOLS = new Set<ToolName>([
  'task.create', 'task.complete', 'task.delete',
  'memory.remember', 'memory.delete',
]);

export type AgentPolicyDecision =
  | { allowed: true; reason: 'read' | 'explicit-write' }
  | { allowed: false; reason: 'missing-input' | 'unsupported' };

export function authorizeTool(name: string, input: unknown): AgentPolicyDecision {
  if (!name) return { allowed: false, reason: 'unsupported' };
  if (!WRITE_TOOLS.has(name as ToolName)) return { allowed: true, reason: 'read' };
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { allowed: false, reason: 'missing-input' };
  }

  const values = input as Record<string, unknown>;
  const required = name.startsWith('task.')
    ? (name === 'task.create' ? 'title' : 'id')
    : (name === 'memory.remember' ? 'content' : 'id');
  const value = values[required];
  if (typeof value !== 'string' || !value.trim()) return { allowed: false, reason: 'missing-input' };
  return { allowed: true, reason: 'explicit-write' };
}
