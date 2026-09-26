import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyChatError, toUserFacingChatError } from '../src/core/ai/errors.ts';

test('classifies startup and stream timeouts separately', () => {
  assert.equal(classifyChatError({ code: 'REQUEST_TIMEOUT' }), 'timeout');
  assert.equal(classifyChatError({ code: 'STREAM_TIMEOUT' }), 'timeout');
  assert.equal(toUserFacingChatError({ code: 'REQUEST_TIMEOUT' }).code, 'REQUEST_TIMEOUT');
});

test('classifies Gemini quota and auth failures', () => {
  assert.equal(classifyChatError({ status: 429, message: 'quota exceeded' }), 'rate_limit');
  assert.equal(classifyChatError({ status: 401, message: 'invalid api key' }), 'auth');
});

test('classifies provider failures as server errors', () => {
  assert.equal(classifyChatError({ status: 502, code: 'AI_PROVIDER' }), 'server');
});
