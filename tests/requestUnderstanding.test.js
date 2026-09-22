import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRequestContract } from '../src/core/agent/requestUnderstanding.ts';
import { buildExecutionPlan } from '../src/core/agent/executionPlanner.ts';

test('request contract preserves protected paths and constraints', () => {
  const c = buildRequestContract(
    'عدّل server.ts بدون تغيير التصميم، وحافظ على gemini-3.8-flash',
    [],
  );
  assert.equal(c.taskType, 'modify');
  assert.equal(c.executionRoute, 'agent_plan');
  assert.ok(c.protectedItems.includes('server.ts'));
  assert.ok(c.protectedItems.some(v => /gemini-3\.8-flash/i.test(v)));
  assert.ok(c.explicitConstraints.some(v => /بدون تغيير التصميم/i.test(v)));
});

test('request contract routes fresh-information requests to web research', () => {
  const c = buildRequestContract('ابحث عن آخر تحديثات Gemini اليوم', []);
  assert.equal(c.taskType, 'research');
  assert.equal(c.executionRoute, 'web_research');
  assert.equal(c.needsFreshKnowledge, true);
  assert.equal(c.recommendedModelDepth, 'deep');
});

test('short confirmations continue the previous task', () => {
  const c = buildRequestContract('نفذ', [
    { role: 'user', text: 'أضف الاختبارات إلى المشروع' },
    { role: 'assistant', text: 'تم تجهيز الخطة' },
  ]);
  assert.equal(c.continuation, true);
  assert.equal(c.taskType, 'continue');
  assert.equal(c.executionRoute, 'agent_plan');
});

test('execution plan always verifies before responding', () => {
  const c = buildRequestContract('أصلح الخطأ في server.ts', []);
  const plan = buildExecutionPlan(c);
  assert.equal(plan.steps[0].kind, 'understand');
  assert.equal(plan.steps.at(-2)?.kind, 'verify');
  assert.equal(plan.steps.at(-1)?.kind, 'respond');
  assert.ok(plan.steps.some(step => step.kind === 'plan'));
});

test('answer requests stay on the answer route', () => {
  const c = buildRequestContract('اشرح لي ما هو React', []);
  const plan = buildExecutionPlan(c);
  assert.equal(c.executionRoute, 'answer');
  assert.deepEqual(plan.steps.map(step => step.kind), ['understand', 'verify', 'respond']);
});
