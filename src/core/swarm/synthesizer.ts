import type { SwarmResult } from './types';
export function synthesizeResults(mission: string, results: readonly SwarmResult[]): string {
  const usable = results.filter((result) => result.ok && result.output.trim());
  if (!usable.length) return `Unable to complete mission: ${mission}`;
  if (usable.length === 1) return usable[0].output;
  return usable.map((result, index) => `Agent ${index + 1} (${result.agentId}):\n${result.output.trim()}`).join('\n\n');
}
