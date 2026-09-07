import { createId } from '../storage.ts';
import { loadTasks } from '../storage/collections.ts';
import type { Task } from '../domain.ts';

export type ProactiveEventType =
  | 'task_due'
  | 'task_stale'
  | 'goal_check'
  | 'proactive_insight'
  | 'scheduled_routine';

export type ProactiveSeverity = 'info' | 'warning' | 'critical';

export interface ProactiveEvent {
  id: string;
  type: ProactiveEventType;
  title: string;
  description: string;
  severity: ProactiveSeverity;
  timestamp: number;
  relatedId?: string;
  suggestedAction?: {
    label: string;
    type: string;
    payload?: unknown;
  };
  dismissed: boolean;
}

export interface ProactiveEngineConfig {
  heartbeatIntervalMs: number;
  enableBrowserNotifications: boolean;
  onEvent?: (event: ProactiveEvent) => void;
}

const STORAGE_KEY = 'adam:proactive:events:v1';
const MAX_EVENT_HISTORY = 50;

class ProactiveAutonomousEngine {
  private timer: any = null;
  private isRunning = false;
  private listeners = new Set<(events: ProactiveEvent[]) => void>();
  private activeEvents: ProactiveEvent[] = [];
  private config: ProactiveEngineConfig = {
    heartbeatIntervalMs: 25_000,
    enableBrowserNotifications: true,
  };

  constructor() {
    this.loadState();
  }

  private loadState() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ProactiveEvent[];
        if (Array.isArray(parsed)) {
          this.activeEvents = parsed.slice(-MAX_EVENT_HISTORY);
        }
      }
    } catch {
      this.activeEvents = [];
    }
  }

  private persistState() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.activeEvents));
    } catch {
      // Ignore
    }
  }

  public subscribe(listener: (events: ProactiveEvent[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.activeEvents]);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const unDismissed = this.activeEvents.filter((e) => !e.dismissed);
    this.listeners.forEach((listener) => listener(unDismissed));
  }

  public start(customConfig?: Partial<ProactiveEngineConfig>) {
    if (this.isRunning) return;
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }
    this.isRunning = true;

    // Run first check after a brief start delay
    setTimeout(() => this.tick(), 2000);

    this.timer = setInterval(() => {
      this.tick();
    }, this.config.heartbeatIntervalMs);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  /**
   * Heartbeat execution step: evaluates background conditions, tasks, and monitors
   */
  public tick() {
    try {
      this.evaluateTaskConditions();
    } catch (err) {
      console.warn('[ProactiveEngine] Heartbeat tick error:', err);
    }
  }

  /**
   * Checks tasks for upcoming deadlines and high-priority uncompleted work
   */
  private evaluateTaskConditions() {
    const tasks = loadTasks();
    if (!tasks || !tasks.length) return;

    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    for (const task of tasks) {
      if (task.completed) continue;

      // 1. Check if due within 2 hours or overdue
      if (task.dueAt) {
        const timeDiff = task.dueAt - now;
        if (timeDiff <= TWO_HOURS && timeDiff > -TWENTY_FOUR_HOURS) {
          const isOverdue = timeDiff < 0;
          const eventId = `due_${task.id}_${Math.floor(now / (30 * 60 * 1000))}`; // Throttle per 30 mins

          if (!this.hasRecentEvent(task.id, 'task_due')) {
            this.emitProactiveEvent({
              id: createId('proact'),
              type: 'task_due',
              title: isOverdue ? `مهمة متأخرة: ${task.title}` : `اقترب موعد المهمة: ${task.title}`,
              description: isOverdue
                ? `تجاوزت هذه المهمة موعد استحقاقها المحدد. هل تود إنجازها الآن؟`
                : `الموعد المحدد لهذه المهمة خلال أقل من ساعتين.`,
              severity: isOverdue ? 'critical' : 'warning',
              timestamp: now,
              relatedId: task.id,
              suggestedAction: {
                label: 'فتح المهمة',
                type: 'view_task',
                payload: { taskId: task.id },
              },
              dismissed: false,
            });
          }
        }
      }

      // 2. High priority task pending for > 24 hours without updates
      if (task.priority === 'high' && (now - task.updatedAt) > TWENTY_FOUR_HOURS) {
        if (!this.hasRecentEvent(task.id, 'task_stale')) {
          this.emitProactiveEvent({
            id: createId('proact'),
            type: 'task_stale',
            title: `متابعة أولوية قصوى: ${task.title}`,
            description: `هذه المهمة ذات أولوية عالية وما زالت قيد الانتظار منذ أكثر من 24 ساعة.`,
            severity: 'warning',
            timestamp: now,
            relatedId: task.id,
            dismissed: false,
          });
        }
      }
    }
  }

  private hasRecentEvent(relatedId: string, type: ProactiveEventType): boolean {
    const ONE_HOUR = 60 * 60 * 1000;
    const now = Date.now();
    return this.activeEvents.some(
      (e) => e.relatedId === relatedId && e.type === type && (now - e.timestamp) < ONE_HOUR
    );
  }

  public emitProactiveEvent(event: ProactiveEvent) {
    this.activeEvents.unshift(event);
    if (this.activeEvents.length > MAX_EVENT_HISTORY) {
      this.activeEvents = this.activeEvents.slice(0, MAX_EVENT_HISTORY);
    }
    this.persistState();
    this.notifyListeners();

    // Trigger browser notification if supported and allowed
    if (this.config.enableBrowserNotifications && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(event.title, {
            body: event.description,
            icon: '/favicon.ico',
          });
        } catch {
          // Ignore
        }
      }
    }

    if (this.config.onEvent) {
      this.config.onEvent(event);
    }
  }

  public dismissEvent(id: string) {
    const target = this.activeEvents.find((e) => e.id === id);
    if (target) {
      target.dismissed = true;
      this.persistState();
      this.notifyListeners();
    }
  }

  public getActiveEvents(): ProactiveEvent[] {
    return this.activeEvents.filter((e) => !e.dismissed);
  }
}

export const proactiveEngine = new ProactiveAutonomousEngine();
