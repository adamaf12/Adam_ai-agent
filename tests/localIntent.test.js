import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLocalIntent } from '../src/core/agent/localIntent.ts';

test('parses explicit task requests into a deterministic local action', () => {
  const result = parseLocalIntent('ذكرني أن أراجع مشروع Adam غدًا');
  assert.deepEqual(result, { type: 'task.create', title: 'أراجع مشروع Adam غدًا' });
});

test('parses explicit memory requests into a deterministic local action', () => {
  const result = parseLocalIntent('تذكر أنني أفضل الإجابات المختصرة');
  assert.deepEqual(result, { type: 'memory.remember', content: 'أنني أفضل الإجابات المختصرة', category: 'preference' });
});

test('does not mutate local state for ordinary conversation', () => {
  assert.equal(parseLocalIntent('اشرح لي الفرق بين React وVue'), null);
});
