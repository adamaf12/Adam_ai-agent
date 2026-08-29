import test from 'node:test';
import assert from 'node:assert/strict';
const model = await import('../src/features/onboarding/onboardingModel.ts');

test('onboarding progresses through exactly four ordered steps', () => {
  assert.equal(model.nextStep('welcome'), 'language');
  assert.equal(model.nextStep('language'), 'workspace');
  assert.equal(model.nextStep('workspace'), 'ready');
  assert.equal(model.nextStep('ready'), 'ready');
  assert.equal(model.previousStep('ready'), 'workspace');
  assert.equal(model.previousStep('welcome'), 'welcome');
});

test('onboarding requires a meaningful agent name on the welcome step', () => {
  assert.equal(model.canContinue({ agentName: 'A', language: 'ar', connected: [], step: 'welcome' }), false);
  assert.equal(model.canContinue({ agentName: 'Adam', language: 'ar', connected: [], step: 'welcome' }), true);
  assert.equal(model.canContinue({ agentName: '', language: 'ar', connected: [], step: 'language' }), true);
});
