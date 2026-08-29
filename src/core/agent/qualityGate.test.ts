import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateResponseQuality } from './qualityGate.ts';
import { sanitizeResponse } from './responseSanitizer.ts';

test('quality gate records concrete weaknesses', () => {
  const result = evaluateResponseQuality({
    hasEvidence: false,
    evidenceStrength: 0.2,
    executionSucceeded: false,
    consistency: 0.4,
    requestedActionCompleted: false,
  });
  assert.equal(result.decision, 'qualify');
  assert.deepEqual(result.reasons, [
    'no_evidence', 'weak_evidence', 'low_consistency', 'execution_incomplete', 'requested_action_incomplete',
  ]);
});

test('sanitizer removes control characters and normalizes excessive blank lines', () => {
  assert.equal(sanitizeResponse(' hi\u0000\r\n\r\n\r\n\r\nthere '), 'hi\n\n\nthere');
});
