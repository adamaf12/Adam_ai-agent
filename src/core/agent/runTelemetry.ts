export type AgentRunEvent = {
  runId: string;
  phase: 'received' | 'planning' | 'executing' | 'verifying' | 'responding' | 'completed' | 'failed' | 'cancelled';
  at: number;
  attempt?: number;
  tool?: string;
  detail?: string;
};

export type AgentRunSummary = {
  runId: string;
  startedAt: number;
  completedAt?: number;
  events: AgentRunEvent[];
  status: 'running' | 'completed' | 'failed' | 'cancelled';
};

export function createRunSummary(runId: string, startedAt = Date.now()): AgentRunSummary {
  return { runId, startedAt, events: [{ runId, phase: 'received', at: startedAt }], status: 'running' };
}

export function appendRunEvent(summary: AgentRunSummary, event: Omit<AgentRunEvent, 'runId'>): AgentRunSummary {
  if (summary.status !== 'running') return summary;
  const next = { ...summary, events: [...summary.events, { ...event, runId: summary.runId }] };
  if (event.phase === 'completed' || event.phase === 'failed' || event.phase === 'cancelled') {
    return { ...next, status: event.phase, completedAt: event.at };
  }
  return next;
}

export function getRunDurationMs(summary: AgentRunSummary): number {
  return Math.max(0, (summary.completedAt ?? Date.now()) - summary.startedAt);
}
