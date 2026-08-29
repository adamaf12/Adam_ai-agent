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

test('uses the strongest intent when a prompt contains competing signals', () => {
  assert.equal(routePrompt('remember this preference for later').intent, 'memory');
  assert.equal(routePrompt('schedule a reminder for today').intent, 'task');
  assert.equal(routePrompt('generate an image of today\'s weather').intent, 'creative');
});

test('returns bounded confidence and a useful reason for every routed prompt', () => {
  for (const prompt of ['hello', 'latest news', 'save this', 'draw a logo']) {
    const result = routePrompt(prompt);
    assert.ok(result.confidence >= 0 && result.confidence <= 1);
    assert.ok(result.reason.length > 0);
  }
});
