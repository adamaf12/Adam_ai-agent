import type { SwarmResult } from './types';
export function critiqueResults(results: readonly SwarmResult[]): string[] {
  const notes: string[] = [];
  const successful = results.filter((result) => result.ok && result.output.trim());
  if (successful.length === 0) return ['No successful result is available for critique.'];
  const uniqueOutputs = new Set(successful.map((result) => result.output.trim()));
  if (uniqueOutputs.size < successful.length) notes.push('Multiple agents returned identical output; independent verification is recommended.');
  if (successful.some((result) => result.output.length < 40)) notes.push('At least one answer is unusually short; request more evidence or detail.');
  return notes;
}
