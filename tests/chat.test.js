import test from 'node:test';
import assert from 'node:assert/strict';
const model = await import('../src/features/chat/chatModel.ts');

test('chat creates trimmed user messages with stable ids', () => {
  const message = model.createUserMessage('  hello Adam  ');
  assert.equal(message.role, 'user');
  assert.equal(message.content, 'hello Adam');
  assert.match(message.id, /^msg_/);
});

test('chat event parser ignores blank and malformed lines', () => {
  assert.equal(model.parseChatEvent(''), null);
  assert.equal(model.parseChatEvent('{broken'), null);
  assert.deepEqual(model.parseChatEvent('{"type":"delta","text":"Hi"}'), { type: 'delta', text: 'Hi' });
});
