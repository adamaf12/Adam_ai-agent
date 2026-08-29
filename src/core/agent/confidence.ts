export interface ConfidenceSignals {
  route: number;
  evidence: number;
  execution: number;
  consistency: number;
}

export function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

export function calculateConfidence(signals: ConfidenceSignals): number {
  const weighted = signals.route * 0.2 + signals.evidence * 0.4 + signals.execution * 0.25 + signals.consistency * 0.15;
  return Math.round(clampConfidence(weighted) * 100) / 100;
}

export function confidenceLabel(value: number): 'low' | 'medium' | 'high' {
  const score = clampConfidence(value);
  if (score >= 0.8) return 'high';
  if (score >= 0.55) return 'medium';
  return 'low';
}

export function shouldAskForClarification(value: number, hasCriticalMissingInput: boolean): boolean {
  return hasCriticalMissingInput || clampConfidence(value) < 0.42;
}
