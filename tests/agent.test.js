import test from 'node:test';
import assert from 'node:assert/strict';
import { routePrompt } from '../src/core/agent/agentTypes.ts';

test('routes current-information prompts to grounded web mode', () => {
  assert.equal(routePrompt('What are the latest AI news today?').intent, 'web');
  assert.equal(routePrompt('ما آخر أخبار التقنية اليوم؟').intent, 'web');
});

test('routes task and memory requests without pretending they are web searches', () => {
  assert.equal(routePrompt('remind me to finish the project').intent, 'task');
  assert.equal(routePrompt('تذكر أنني أحب الاختصار').intent, 'memory');
});
