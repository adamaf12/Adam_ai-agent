import type { Memory, Task } from '../domain';
import { loadMemories, loadTasks, saveMemories, saveTasks } from '../storage/collections';
import type { ToolName } from './tooling';

export type AgentToolCall = { id?: string; name: ToolName; input?: Record<string, unknown> };
export type AgentToolResult = { ok: boolean; data?: unknown; error?: string; code?: string };

const MAX_TEXT = 10_000;
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

function boundedText(value: unknown, field: string, required = false): string {
  const result = text(value);
  if (required && !result) throw new Error(`${field} is required.`);
  if (result.length > MAX_TEXT) throw new Error(`${field} is too long.`);
  return result;
}

export function normalizeToolInput(name: ToolName, input: Record<string, unknown>): Record<string, unknown> {
  switch (name) {
    case 'task.create': {
      const title = boundedText(input.title, 'A task title', true);
      const notes = boundedText(input.notes, 'Task notes');
      const priority = input.priority === 'high' || input.priority === 'low' || input.priority === 'medium' ? input.priority : 'medium';
      const dueAt = typeof input.dueAt === 'number' && Number.isFinite(input.dueAt) ? input.dueAt : undefined;
      return { title, notes, priority, ...(dueAt !== undefined ? { dueAt } : {}) };
    }
    case 'task.complete':
    case 'task.delete':
      return { id: boundedText(input.id, 'Task id', true) };
    case 'task.list':
      return {};
    case 'memory.search':
      return { query: boundedText(input.query, 'Memory query') };
    case 'memory.remember': {
      const content = boundedText(input.content, 'Memory content', true);
      const category = ['preference', 'fact', 'goal', 'instruction'].includes(String(input.category)) ? input.category as Memory['category'] : 'fact';
      return { content, category };
    }
    case 'memory.delete':
      return { id: boundedText(input.id, 'Memory id', true) };
  }
}

export async function executeAgentTool(call: AgentToolCall, signal?: AbortSignal): Promise<AgentToolResult> {
  if (signal?.aborted) return { ok: false, code: 'ABORTED', error: 'Tool execution was cancelled.' };
  try {
    const input = normalizeToolInput(call.name, call.input ?? {});
    switch (call.name) {
      case 'task.list': return { ok: true, data: loadTasks() };
      case 'task.create': {
        const title = input.title as string;
        const now = Date.now();
        const task: Task = { id: id(), title, notes: input.notes as string, completed: false, priority: input.priority as Task['priority'], ...(typeof input.dueAt === 'number' ? { dueAt: input.dueAt } : {}), createdAt: now, updatedAt: now };
        saveTasks([task, ...loadTasks()]);
        return { ok: true, data: task };
      }
      case 'task.complete': {
        const taskId = input.id as string; const tasks = loadTasks();
        if (!tasks.some(t => t.id === taskId)) return { ok: false, code: 'NOT_FOUND', error: 'Task not found.' };
        const task = tasks.find(t => t.id === taskId)!; const updated = { ...task, completed: true, updatedAt: Date.now() };
        saveTasks(tasks.map(t => t.id === taskId ? updated : t)); return { ok: true, data: updated };
      }
      case 'task.delete': {
        const taskId = input.id as string; const tasks = loadTasks();
        if (!tasks.some(t => t.id === taskId)) return { ok: false, code: 'NOT_FOUND', error: 'Task not found.' };
        saveTasks(tasks.filter(t => t.id !== taskId)); return { ok: true, data: { id: taskId, deleted: true } };
      }
      case 'memory.search': {
        const query = input.query as string; const memories = loadMemories();
        return { ok: true, data: query ? memories.filter(m => `${m.content} ${m.category}`.toLowerCase().includes(query.toLowerCase())) : memories };
      }
      case 'memory.remember': {
        const now = Date.now(); const content = input.content as string; const category = input.category as Memory['category'];
        const memory: Memory = { id: id(), content, category, createdAt: now, updatedAt: now };
        saveMemories([memory, ...loadMemories()]); return { ok: true, data: memory };
      }
      case 'memory.delete': {
        const memoryId = input.id as string; const memories = loadMemories();
        if (!memories.some(m => m.id === memoryId)) return { ok: false, code: 'NOT_FOUND', error: 'Memory not found.' };
        saveMemories(memories.filter(m => m.id !== memoryId)); return { ok: true, data: { id: memoryId, deleted: true } };
      }
    }
  } catch (error) { return { ok: false, code: 'TOOL_ERROR', error: error instanceof Error ? error.message : 'Tool execution failed.' }; }
}
