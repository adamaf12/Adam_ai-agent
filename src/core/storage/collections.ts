import type { Memory, Task } from '../domain';

const read = <T,>(key: string, fallback: T): T => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
};
const write = <T,>(key: string, value: T) => localStorage.setItem(key, JSON.stringify(value));

export const loadTasks = () => read<Task[]>('adam:v2:tasks', []);
export const saveTasks = (tasks: Task[]) => write('adam:v2:tasks', tasks);
export const loadMemories = () => read<Memory[]>('adam:v2:memories', []);
export const saveMemories = (memories: Memory[]) => write('adam:v2:memories', memories);
