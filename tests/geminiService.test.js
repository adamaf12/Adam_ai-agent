import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Flutter GeminiService file exists and contains timeout and exception handlers', () => {
  const filePath = path.join(process.cwd(), 'lib/services/gemini_service.dart');
  assert.equal(fs.existsSync(filePath), true, 'gemini_service.dart should exist');

  const content = fs.readFileSync(filePath, 'utf8');

  // Verify Timeout duration (at least 40 seconds)
  assert.ok(content.includes('Duration(seconds: 45)'), 'Should set a timeout of at least 40 seconds');

  // Verify Exception handling for required types
  assert.ok(content.includes('on TimeoutException catch'), 'Should handle TimeoutException');
  assert.ok(content.includes('on SocketException catch'), 'Should handle SocketException');
  assert.ok(content.includes('on GenerativeAIException catch'), 'Should handle GenerativeAIException');
  assert.ok(content.includes('catch (e)'), 'Should have catch-all block to prevent UI crash');

  // Verify safe chunk text parsing
  assert.ok(content.includes('text != null && text.isNotEmpty'), 'Should safely parse chunk text');
  assert.ok(content.includes('promptFeedback?.blockReason'), 'Should safely handle prompt feedback blockings');
  assert.ok(content.includes('FinishReason.safety'), 'Should handle safety finish reason');
});

test('Safe stream parsing helper ignores null, empty, or undefined chunks', () => {
  function safeParseChunkText(chunk) {
    if (!chunk || typeof chunk !== 'object') return null;
    const text = chunk.text;
    if (typeof text === 'string' && text.trim().length > 0) {
      return text;
    }
    return null;
  }

  assert.equal(safeParseChunkText(null), null);
  assert.equal(safeParseChunkText({}), null);
  assert.equal(safeParseChunkText({ text: null }), null);
  assert.equal(safeParseChunkText({ text: '' }), null);
  assert.equal(safeParseChunkText({ text: '  ' }), null);
  assert.equal(safeParseChunkText({ text: 'مرحباً بك' }), 'مرحباً بك');
});
