import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGuardianReport } from '../server/guardian.ts';

test('guardian detects AI configuration unavailable to runtime', () => {
  const report = buildGuardianReport({
    geminiConfigured: false,
    sessionSecretConfigured: true,
    vercel: true,
    production: true,
    model: 'gemini-3.8-flash',
  });
  assert.equal(report.status, 'critical');
  assert.equal(report.findings[0].code, 'AI_RUNTIME_NOT_CONFIGURED');
  assert.equal(report.findings[0].autoRepairable, false);
});

test('guardian reports healthy runtime without exposing secrets', () => {
  const report = buildGuardianReport({
    geminiConfigured: true,
    sessionSecretConfigured: true,
    vercel: true,
    production: true,
    model: 'gemini-3.8-flash',
  });
  assert.equal(report.status, 'healthy');
  assert.deepEqual(report.findings, []);
});
