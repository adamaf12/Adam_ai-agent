import test from 'node:test';
import assert from 'node:assert/strict';
import { createExecutionPlan } from '../src/core/agent/executionPlan.ts';

test('execution plans reject dependency cycles before execution', () => {
  assert.throws(
    () => createExecutionPlan([
      { id: 'a', kind: 'context', label: 'A', dependsOn: ['b'] },
      { id: 'b', kind: 'tool', label: 'B', dependsOn: ['a'] },
    ]),
    /cycle/i,
  );
});

test('execution plans still accept valid dependency chains', () => {
  const plan = createExecutionPlan([
    { id: 'context', kind: 'context', label: 'Context' },
    { id: 'tool', kind: 'tool', label: 'Tool', dependsOn: ['context'] },
    { id: 'response', kind: 'response', label: 'Response', dependsOn: ['tool'] },
  ]);
  assert.equal(plan.steps.length, 3);
});
