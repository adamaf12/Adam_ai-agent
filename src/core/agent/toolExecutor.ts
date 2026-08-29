import type { Memory, Task } from '../domain';
import { loadMemories, loadTasks, saveMemories, saveTasks } from '../storage/collections';

export type AgentToolName =
  | 'task.list'
  | 'task.create'
  | 'task.complete'
  | 'task.delete'
  | 'memory.search'
  | 'memory.remember'
  | 'memory.delete';

export type AgentToolCall = { name: AgentToolName; input?: Record<string, unknown> };
export type AgentToolResult = { ok: boolean; data?: unknown; error?: string };

const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export async function executeAgentTool(call: AgentToolCall): Promise<AgentToolResult> {
  try {
    const input = call.input ?? {};
    switch (call.name) {
      case 'task.list': {
        const tasks = loadTasks();
        return { ok: true, data: tasks };
      }
      case 'task.create': {
        const title = text(input.title);
        if (!title) return { ok: false, error: 'A task title is required.' };
        const now = Date.now();
        const task: Task = {
          id: id(), title, notes: text(input.notes),
          completed: false,
          priority: input.priority === 'high' || input.priority === 'low' ? input.priority : 'medium',
          ...(typeof input.dueAt === 'number' ? { dueAt: input.dueAt } : {}),
          createdAt: now, updatedAt: now,
        };
        saveTasks([task, ...loadTasks()]);
        return { ok: true, data: task };
      }
      case 'task.complete': {
        const taskId = text(input.id);
        const tasks = loadTasks();
        const found = tasks.find(t => t.id === taskId);
        if (!found) return { ok: false, error: 'Task not found.' };
        const updated = tasks.map(t => t.id === taskId ? { ...t, completed: true, updatedAt: Date.now() } : t);
        saveTasks(updated);
        return { ok: true, data: updated.find(t => t.id === taskId) };
      }
      case 'task.delete': {
        const taskId = text(input.id);
        const tasks = loadTasks();
        if (!tasks.some(t => t.id === taskId)) return { ok: false, error: 'Task not found.' };
        saveTasks(tasks.filter(t => t.id !== taskId));
        return { ok: true, data: { id: taskId, deleted: true } };
      }
      case 'memory.search': {
        const query = text(input.query).toLowerCase();
        const memories = loadMemories();
        return { ok: true, data: query ? memories.filter(m => m.content.toLowerCase().includes(query)) : memories };
      }
      case 'memory.remember': {
        const content = text(input.content);
        if (!content) return { ok: false, error: 'Memory content is required.' };
        const now = Date.now();
        const memory: Memory = {
          id: id(), content,
          category: input.category === 'preference' || input.category === 'goal' || input.category === 'instruction' ? input.category : 'fact',
          createdAt: now, updatedAt: now,
        };
        saveMemories([memory, ...loadMemories()]);
        return { ok: true, data: memory };
      }
      case 'memory.delete': {
        const memoryId = text(input.id);
        const memories = loadMemories();
        if (!memories.some(m => m.id === memoryId)) return { ok: false, error: 'Memory not found.' };
        saveMemories(memories.filter(m => m.id !== memoryId));
        return { ok: true, data: { id: memoryId, deleted: true } };
      }
      default:
        return { ok: false, error: 'Unsupported agent tool.' };
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Tool execution failed.' };
  }
}
