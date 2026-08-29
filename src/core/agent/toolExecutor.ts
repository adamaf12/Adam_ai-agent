import type { Memory, Task } from '../domain';
import { loadMemories, loadTasks, saveMemories, saveTasks } from '../storage/collections';
import type { ToolName } from './tooling';

export type AgentToolCall = { id?: string; name: ToolName; input?: Record<string, unknown> };
export type AgentToolResult = { ok: boolean; data?: unknown; error?: string; code?: string };

const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export async function executeAgentTool(call: AgentToolCall, signal?: AbortSignal): Promise<AgentToolResult> {
  if (signal?.aborted) return { ok: false, code: 'ABORTED', error: 'Tool execution was cancelled.' };
  try {
    const input = call.input ?? {};
    switch (call.name) {
      case 'task.list': return { ok: true, data: loadTasks() };
      case 'task.create': {
        const title = text(input.title);
        if (!title) return { ok: false, code: 'INVALID_TITLE', error: 'A task title is required.' };
        const now = Date.now();
        const task: Task = { id: id(), title, notes: text(input.notes), completed: false, priority: input.priority === 'high' || input.priority === 'low' ? input.priority : 'medium', ...(typeof input.dueAt === 'number' ? { dueAt: input.dueAt } : {}), createdAt: now, updatedAt: now };
        saveTasks([task, ...loadTasks()]);
        return { ok: true, data: task };
      }
      case 'task.complete': {
        const taskId = text(input.id); const tasks = loadTasks();
        if (!tasks.some(t => t.id === taskId)) return { ok: false, code: 'NOT_FOUND', error: 'Task not found.' };
        const task = tasks.find(t => t.id === taskId)!; const updated = { ...task, completed: true, updatedAt: Date.now() };
        saveTasks(tasks.map(t => t.id === taskId ? updated : t)); return { ok: true, data: updated };
      }
      case 'task.delete': {
        const taskId = text(input.id); const tasks = loadTasks();
        if (!tasks.some(t => t.id === taskId)) return { ok: false, code: 'NOT_FOUND', error: 'Task not found.' };
        saveTasks(tasks.filter(t => t.id !== taskId)); return { ok: true, data: { id: taskId, deleted: true } };
      }
      case 'memory.search': {
        const query = text(input.query).toLowerCase(); const memories = loadMemories();
        return { ok: true, data: query ? memories.filter(m => `${m.content} ${m.category}`.toLowerCase().includes(query)) : memories };
      }
      case 'memory.remember': {
        const content = text(input.content);
        if (!content) return { ok: false, code: 'INVALID_CONTENT', error: 'Memory content is required.' };
        const now = Date.now(); const category: Memory['category'] = ['preference','fact','goal','instruction'].includes(String(input.category)) ? input.category as Memory['category'] : 'fact';
        const memory: Memory = { id: id(), content, category, createdAt: now, updatedAt: now };
        saveMemories([memory, ...loadMemories()]); return { ok: true, data: memory };
      }
      case 'memory.delete': {
        const memoryId = text(input.id); const memories = loadMemories();
        if (!memories.some(m => m.id === memoryId)) return { ok: false, code: 'NOT_FOUND', error: 'Memory not found.' };
        saveMemories(memories.filter(m => m.id !== memoryId)); return { ok: true, data: { id: memoryId, deleted: true } };
      }
    }
  } catch (error) { return { ok: false, code: 'TOOL_ERROR', error: error instanceof Error ? error.message : 'Tool execution failed.' }; }
}
