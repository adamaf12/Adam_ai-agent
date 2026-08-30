import test from 'node:test';
import assert from 'node:assert/strict';
import { fuseResults } from '../src/core/swarm/ensemble.ts';

test('fuseResults ranks swarm outputs by confidence', () => {
  const result = fuseResults([
    { agentId: 'slow', modelId: 'm2', output: 'lower', durationMs: 20, ok: true, confidence: 0.2 },
    { agentId: 'fast', modelId: 'm1', output: 'higher', durationMs: 10, ok: true, confidence: 0.9 },
  ]);

  assert.match(result, /^\[1\] higher/);
  assert.match(result, /\[2\] lower/);
});
