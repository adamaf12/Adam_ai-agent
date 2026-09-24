import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {
  estimateTokenCount,
  SPEED_TEST_PRESETS,
} from '../server/diagnostics/speedTestRoutes.ts';

process.env.NODE_ENV = 'test';
const { app } = await import('../server.ts');

test('estimateTokenCount computes accurate token bounds for English and Arabic text', () => {
  assert.equal(estimateTokenCount(''), 0);

  // English: ~40 chars ~10 tokens
  const englishSample = 'Hello world, this is an LLM speed test benchmark for ADEM AI.';
  const englishTokens = estimateTokenCount(englishSample);
  assert.ok(englishTokens >= 12 && englishTokens <= 20);

  // Arabic: ~50 chars ~25 tokens
  const arabicSample = 'السلام عليكم ورحمة الله وبركاته، فحص سرعة تدفق الرموز في الثانية.';
  const arabicTokens = estimateTokenCount(arabicSample);
  assert.ok(arabicTokens >= 20 && arabicTokens <= 35);
});

test('SPEED_TEST_PRESETS includes pulse, standard, reasoning, and arabic test suites', () => {
  const ids = SPEED_TEST_PRESETS.map((p) => p.id);
  assert.ok(ids.includes('pulse'));
  assert.ok(ids.includes('standard'));
  assert.ok(ids.includes('reasoning'));
  assert.ok(ids.includes('arabic'));

  for (const preset of SPEED_TEST_PRESETS) {
    assert.equal(typeof preset.prompt, 'string');
    assert.ok(preset.prompt.length > 20);
    assert.ok(preset.expectedTokens > 20);
  }
});

test('GET /api/diagnostics/speed-test/info returns active model and presets', async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/diagnostics/speed-test/info`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.provider, 'ADEM-G');
    assert.ok(body.activeModel.includes('ADEM-G'));
    assert.ok(Array.isArray(body.presets));
    assert.ok(body.presets.length >= 4);
  } finally {
    server.close();
  }
});

test('POST /api/diagnostics/speed-test/run executes benchmark and returns TPS metrics', async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/diagnostics/speed-test/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presetId: 'pulse' }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(typeof body.averageTps, 'number');
    assert.ok(body.averageTps > 0);
    assert.equal(typeof body.ttftMs, 'number');
    assert.equal(typeof body.totalTokens, 'number');
    assert.ok(body.totalTokens > 0);
  } finally {
    server.close();
  }
});

test('POST /api/diagnostics/speed-test/stream yields real-time streaming ndjson events', async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/diagnostics/speed-test/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
      body: JSON.stringify({ presetId: 'pulse' }),
    });

    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('ndjson'));

    const text = await res.text();
    const lines = text.trim().split('\n');
    const events = lines.map((l) => JSON.parse(l));

    const eventTypes = events.map((e) => e.type);
    assert.ok(eventTypes.includes('init'));
    assert.ok(eventTypes.includes('first_token'));
    assert.ok(eventTypes.includes('chunk'));
    assert.ok(eventTypes.includes('complete'));

    const completeEvent = events.find((e) => e.type === 'complete');
    assert.ok(completeEvent?.summary);
    assert.ok(completeEvent.summary.averageTps > 0);
    assert.ok(completeEvent.summary.totalTokens > 0);
  } finally {
    server.close();
  }
});
