import type { SwarmResult, VerificationResult } from './types';
export function verifyResults(results: readonly SwarmResult[]): VerificationResult {
  const issues: string[] = [];
  if (!results.length) issues.push('No swarm result was produced.');
  if (results.some((result) => !result.ok)) issues.push('One or more agents failed.');
  if (results.some((result) => !result.output.trim())) issues.push('One or more agents returned empty output.');
  const score = results.length ? Math.max(0, results.filter((result) => result.ok && result.output.trim()).length / results.length) : 0;
  return { ok: issues.length === 0, score, issues };
}
