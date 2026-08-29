export type AgentEventName = 'run_started' | 'plan_created' | 'tool_started' | 'tool_finished' | 'verification_finished' | 'run_finished';

export type AgentEvent = {
  name: AgentEventName;
  requestId: string;
  at: number;
  durationMs?: number;
  success?: boolean;
  metadata?: Record<string, string | number | boolean>;
};

export type TelemetrySink = (event: AgentEvent) => void;

export function createTelemetry(sink: TelemetrySink = () => {}) {
  const started = new Map<string, number>();
  return {
    start(requestId: string, now = Date.now()) {
      started.set(requestId, now);
      sink({ name: 'run_started', requestId, at: now });
    },
    emit(event: Omit<AgentEvent, 'requestId'> & { requestId: string }) { sink(event); },
    finish(requestId: string, success: boolean, now = Date.now()) {
      const start = started.get(requestId);
      sink({ name: 'run_finished', requestId, at: now, success, durationMs: start === undefined ? undefined : Math.max(0, now - start) });
      started.delete(requestId);
    },
  };
}
