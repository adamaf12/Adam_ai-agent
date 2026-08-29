export type QualitySignal = 'grounded' | 'executed' | 'consistent' | 'complete';

export type QualityReport = {
  score: number;
  confidence: 'low' | 'medium' | 'high';
  missing: QualitySignal[];
};

export function assessResponse(signals: Partial<Record<QualitySignal, boolean>>): QualityReport {
  const all: QualitySignal[] = ['grounded', 'executed', 'consistent', 'complete'];
  const passed = all.filter((signal) => signals[signal] === true).length;
  const missing = all.filter((signal) => signals[signal] !== true);
  const score = passed / all.length;
  return {
    score,
    confidence: score >= 0.9 ? 'high' : score >= 0.6 ? 'medium' : 'low',
    missing,
  };
}

export function shouldVerify(report: QualityReport): boolean {
  return report.confidence !== 'high' || report.missing.includes('grounded') || report.missing.includes('executed');
}
