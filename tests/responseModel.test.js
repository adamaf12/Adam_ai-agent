import test from 'node:test';
import assert from 'node:assert/strict';
import { createResponseState, reduceResponseEvent } from '../src/core/agent/responseModel.ts';

test('response starts in thinking state and records route metadata', () => {
  const state = createResponseState('web');
  assert.equal(state.status, 'thinking');
  assert.equal(state.route, 'web');
  assert.equal(state.content, '');
});

test('stream events accumulate content without losing status metadata', () => {
  let state = createResponseState('chat');
  state = reduceResponseEvent(state, { type: 'delta', text: 'Hello' });
  state = reduceResponseEvent(state, { type: 'delta', text: ' world' });
  assert.equal(state.content, 'Hello world');
  assert.equal(state.status, 'streaming');
});

test('done and error events become explicit terminal states', () => {
  let state = reduceResponseEvent(createResponseState('chat'), { type: 'delta', text: 'x' });
  state = reduceResponseEvent(state, { type: 'done' });
  assert.equal(state.status, 'complete');
  state = reduceResponseEvent(state, { type: 'error', code: 'AI_RATE_LIMIT', message: 'Try again.' });
  assert.equal(state.status, 'error');
  assert.equal(state.error?.code, 'AI_RATE_LIMIT');
});
