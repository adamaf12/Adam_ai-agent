import { randomUUID } from 'node:crypto';

export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface BackgroundTask<T = any> {
  id: string;
  userId: string;
  name: string;
  status: TaskStatus;
  progress: number; // 0 - 100
  result?: T;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

class BackgroundTaskQueue {
  private tasks = new Map<string, BackgroundTask>();
  private readonly DEFAULT_TIMEOUT_MS = 120_000; // 2 minutes

  /**
   * Enqueue a new asynchronous task
   */
  public enqueue<T>(userId: string, name: string, taskFn: (updateProgress: (p: number) => void) => Promise<T>): BackgroundTask<T> {
    const task: BackgroundTask<T> = {
      id: `task_${randomUUID()}`,
      userId,
      name,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
    };

    this.tasks.set(task.id, task);

    // Execute in background
    setTimeout(async () => {
      task.status = 'running';
      task.startedAt = Date.now();

      const timeoutTimer = setTimeout(() => {
        if (task.status === 'running') {
          task.status = 'failed';
          task.error = 'Task execution timed out after 120 seconds';
          task.completedAt = Date.now();
        }
      }, this.DEFAULT_TIMEOUT_MS);

      try {
        const result = await taskFn((progress: number) => {
          task.progress = Math.min(100, Math.max(0, Math.round(progress)));
        });

        clearTimeout(timeoutTimer);
        if (task.status === 'running') {
          task.status = 'completed';
          task.progress = 100;
          task.result = result;
          task.completedAt = Date.now();
        }
      } catch (err: any) {
        clearTimeout(timeoutTimer);
        if (task.status === 'running') {
          task.status = 'failed';
          task.error = err?.message || 'Task execution failed';
          task.completedAt = Date.now();
        }
      }
    }, 10);

    return task;
  }

  public getTask(taskId: string, userId: string): BackgroundTask | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;
    if (task.userId !== userId) return null; // Enforce user isolation
    return task;
  }

  public getUserTasks(userId: string): BackgroundTask[] {
    const list: BackgroundTask[] = [];
    for (const task of this.tasks.values()) {
      if (task.userId === userId) {
        list.push(task);
      }
    }
    return list.sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
  }

  public cancelTask(taskId: string, userId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.userId !== userId) return false;
    if (task.status === 'queued' || task.status === 'running') {
      task.status = 'cancelled';
      task.completedAt = Date.now();
      return true;
    }
    return false;
  }
}

export const backgroundTaskQueue = new BackgroundTaskQueue();
