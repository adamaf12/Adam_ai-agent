import type { ModelAssignment } from './types';

export function scheduleWaves(assignments: readonly ModelAssignment[], parallelism = 4): ModelAssignment[][] {
  const size = Math.max(1, parallelism);
  const waves: ModelAssignment[][] = [];
  for (let i = 0; i < assignments.length; i += size) waves.push([...assignments.slice(i, i + size)]);
  return waves;
}
