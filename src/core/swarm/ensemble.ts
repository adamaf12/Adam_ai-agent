export interface SwarmResult { agentId: string; modelId: string; output: string; confidence?: number; }

export function fuseResults(results: readonly SwarmResult[]): string {
  if (!results.length) return '';
  const ranked = [...results].sort((a, b) => (b.confidence ?? 0.5) - (a.confidence ?? 0.5));
  const unique = [...new Map(ranked.map((r) => [r.output.trim(), r])).values()];
  return unique.map((r, i) => `[${i + 1}] ${r.output.trim()}`).join('\n\n');
}
