export type AppEventName =
  | 'chat.message.created'
  | 'chat.message.updated'
  | 'agent.run.started'
  | 'agent.run.completed'
  | 'agent.run.failed'
  | 'storage.changed';

export interface AppEventPayloads {
  'chat.message.created': { messageId: string };
  'chat.message.updated': { messageId: string };
  'agent.run.started': { runId: string };
  'agent.run.completed': { runId: string };
  'agent.run.failed': { runId: string; code: string };
  'storage.changed': { key: string };
}

export interface AppEvent<K extends AppEventName = AppEventName> {
  id: string;
  name: K;
  timestamp: number;
  payload: AppEventPayloads[K];
}

const eventId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
};

export function createAppEvent<K extends AppEventName>(
  name: K,
  payload: AppEventPayloads[K],
  timestamp = Date.now(),
): AppEvent<K> {
  return { id: eventId(), name, timestamp, payload };
}

export interface EventBus {
  publish<K extends AppEventName>(event: AppEvent<K>): void;
  subscribe<K extends AppEventName>(name: K, listener: (event: AppEvent<K>) => void): () => void;
}

export function createEventBus(): EventBus {
  const listeners = new Map<AppEventName, Set<(event: AppEvent) => void>>();

  return {
    publish(event) {
      listeners.get(event.name)?.forEach((listener) => listener(event));
    },
    subscribe(name, listener) {
      const set = listeners.get(name) ?? new Set<(event: AppEvent) => void>();
      set.add(listener as (event: AppEvent) => void);
      listeners.set(name, set);
      return () => {
        set.delete(listener as (event: AppEvent) => void);
        if (set.size === 0) listeners.delete(name);
      };
    },
  };
}
