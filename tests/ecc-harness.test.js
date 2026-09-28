import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHarnessPlan, verifyHarnessOutput } from '../server/ecc/index.ts';

test('ECC harness selects engineering skills for code tasks', () => {
  const plan = buildHarnessPlan('Debug the TypeScript API and run a security review.');
  assert.equal(plan.taskType, 'engineering');
  assert.ok(plan.skills.some(skill => skill.id === 'agent-harness'));
  assert.ok(plan.skills.some(skill => skill.id === 'security-review'));
  assert.ok(plan.agents.some(agent => agent.id === 'debugger' || agent.id === 'code-reviewer'));
  assert.equal(plan.requiresVerification, true);
});

test('ECC harness keeps deterministic verification bounded and usable', () => {
  const result = verifyHarnessOutput('2 + 2 = 5');
  assert.equal(result.passed, true);
  assert.equal(result.isModified, true);
  assert.match(result.verifiedText, /2 \+ 2 = 4/);
});
