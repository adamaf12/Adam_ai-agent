import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyChatError, getRetryDelayMs, shouldRetryChatError, toUserFacingChatError } from '../src/core/ai/errors.ts';
import { parseStream } from '../src/core/ai/streamParser.ts';
import { createAssistantMessage, createUserMessage, isMessage } from '../src/core/domain.ts';
import { normalizePreferences } from '../src/core/storage.ts';

// ...

test('chat errors are classified without retrying billing or auth failures', () => {
  assert.equal(classifyChatError({ status: 403, code: 'BILLING_REQUIRED' }), 'billing');
  assert.equal(classifyChatError({ status: 401 }), 'auth');
  assert.equal(classifyChatError({ status: 429 }), 'rate_limit');
  assert.equal(classifyChatError({ status: 503 }), 'server');
  assert.equal(classifyChatError(new TypeError('Failed to fetch')), 'network');
  assert.equal(shouldRetryChatError('billing', 0), false);
  assert.equal(shouldRetryChatError('auth', 0), false);
  assert.equal(shouldRetryChatError('rate_limit', 0), true);
  assert.equal(shouldRetryChatError('server', 1), true);
  assert.equal(getRetryDelayMs(0), 250);
  assert.equal(getRetryDelayMs(2), 1000);
  const message = toUserFacingChatError({ status: 403, code: 'BILLING_REQUIRED' }).message;
  assert.ok(/billing|credit|payment|رصيد|صلاحية/i.test(message));
});
