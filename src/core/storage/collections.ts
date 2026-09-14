import type { Memory, Task } from '../domain';

const memoryStore = new Map<string, string>();

const read = <T,>(key: string, fallback: T): T => {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    }
    const mem = memoryStore.get(key);
    return mem ? (JSON.parse(mem) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = <T,>(key: string, value: T) => {
  try {
    const serialized = JSON.stringify(value);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, serialized);
    } else {
      memoryStore.set(key, serialized);
    }
  } catch {}
};

export const loadTasks = () => read<Task[]>('adam:v2:tasks', []);
export const saveTasks = (tasks: Task[]) => write('adam:v2:tasks', tasks);
export const loadMemories = () => read<Memory[]>('adam:v2:memories', []);
export const saveMemories = (memories: Memory[]) => write('adam:v2:memories', memories);
