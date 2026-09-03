import test from 'node:test';
import assert from 'node:assert/strict';
const { createId, normalizePreferences, safeJsonParse } = await import('../src/core/storage.ts');
test('createId returns a stable prefixed unique identifier', () => { const first = createId('msg'); const second = createId('msg'); assert.match(first, /^msg_/); assert.match(second, /^msg_/); assert.notEqual(first, second); });
test('safeJsonParse returns fallback for malformed data', () => { assert.deepEqual(safeJsonParse('{broken', { ok: false }), { ok: false }); });
test('normalizePreferences supplies safe defaults without losing explicit values', () => { assert.deepEqual(normalizePreferences({ agentName:'Adam', language:'ar' }), { agentName:'Adam', language:'ar', theme:'system', glassEnabled:false, onboardingComplete:false }); });
test('normalizePreferences migrates legacy Glass themes into the optional Glass layer', () => { assert.deepEqual(normalizePreferences({ agentName:'Adam', language:'ar', theme:'glass-dark' }), { agentName:'Adam', language:'ar', theme:'dark', glassEnabled:true, onboardingComplete:false }); });
