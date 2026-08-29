import test from 'node:test';
import assert from 'node:assert/strict';
import { appendRunEvent, createRunSummary, getRunDurationMs } from '../src/core/agent/runTelemetry.ts';

test('run telemetry records lifecycle and duration', () => {
  let run = createRunSummary('run_1', 1000);
  run = appendRunEvent(run, { phase: 'planning', at: 1100 });
  run = appendRunEvent(run, { phase: 'completed', at: 1450 });
  assert.equal(run.status, 'completed');
  assert.equal(run.events.length, 3);
  assert.equal(getRunDurationMs(run), 450);
});

test('terminal telemetry cannot be mutated by later events', () => {
  let run = createRunSummary('run_2', 1000);
  run = appendRunEvent(run, { phase: 'failed', at: 1200, detail: 'provider' });
  const after = appendRunEvent(run, { phase: 'completed', at: 1300 });
  assert.equal(after.status, 'failed');
  assert.equal(after.events.length, 2);
});
