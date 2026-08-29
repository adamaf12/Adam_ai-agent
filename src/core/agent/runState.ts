export type RunPhase = 'idle' | 'planning' | 'executing' | 'verifying' | 'responding' | 'complete' | 'cancelled' | 'failed';

const TERMINAL = new Set<RunPhase>(['complete', 'cancelled', 'failed']);
const NEXT: Record<RunPhase, RunPhase[]> = {
  idle: ['planning'],
  planning: ['executing', 'cancelled', 'failed'],
  executing: ['executing', 'verifying', 'cancelled', 'failed'],
  verifying: ['executing', 'responding', 'cancelled', 'failed'],
  responding: ['complete', 'cancelled', 'failed'],
  complete: [], cancelled: [], failed: [],
};

export function canTransition(from: RunPhase, to: RunPhase): boolean {
  return !TERMINAL.has(from) && NEXT[from].includes(to);
}

export function transition(from: RunPhase, to: RunPhase): RunPhase {
  if (!canTransition(from, to)) throw new Error(`Invalid agent transition: ${from} -> ${to}`);
  return to;
}

export function isTerminal(phase: RunPhase): boolean {
  return TERMINAL.has(phase);
}
