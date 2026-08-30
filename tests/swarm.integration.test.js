import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMission, selectAgents } from '../src/core/swarm/missionPlanner.ts';
import { agentRegistry } from '../src/core/swarm/agentRegistry.ts';
import { inferCapabilities } from '../src/core/swarm/capabilityRouter.ts';
import { verifyResults } from '../src/core/swarm/verifier.ts';

test('mission planner infers coding and reasoning capabilities', () => {
  const task = buildMission('Design and debug an Android authentication architecture');
  assert.ok(task.requiredCapabilities.includes('coding'));
  assert.ok(task.requiredCapabilities.includes('reasoning'));
  assert.ok(task.maxAgents > 1);
});

test('agent registry selects relevant engineering agents', () => {
  const task = buildMission('Build a TypeScript frontend');
  const selected = selectAgents(task, agentRegistry.all());
  assert.ok(selected.some((agent) => agent.id === 'frontend-engineer'));
});

test('capability router provides a safe default', () => {
  assert.deepEqual(inferCapabilities('hello'), ['fast']);
});

test('verifier rejects failed or empty swarm results', () => {
  const result = verifyResults([{ agentId: 'a', modelId: 'm', output: '', durationMs: 1, ok: false }]);
  assert.equal(result.ok, false);
  assert.ok(result.issues.length > 0);
});
