import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractMemoryInsights,
  recordInteractionEpisode,
  retrieveAssociativeMemories,
  getInitialCognitiveState,
  saveCognitiveState,
} from '../src/core/agent/cognitiveMemory.ts';
import {
  detectUserCorrection,
  registerLearnedRule,
  generateDynamicDirectives,
  recordSelfCorrection,
  getInitialLedger,
  saveKnowledgeLedger,
} from '../src/core/agent/onlineLearning.ts';
import {
  verifyArithmeticStatements,
  verifyTemporalLogic,
  verifyCodeBlocks,
  verifyAndCorrectResponse,
} from '../src/core/agent/deterministicVerifier.ts';
import { proactiveEngine } from '../src/core/agent/proactiveEngine.ts';

test('Capability 1: extracts user preferences and facts automatically', () => {
  saveCognitiveState(getInitialCognitiveState());
  const textAr = 'أنا أفضل دائماً استخدام TypeScript في كل مشروعاتي';
  const insightsAr = extractMemoryInsights(textAr);
  assert.ok(insightsAr.length > 0);
  assert.equal(insightsAr[0].category, 'preference');
  assert.ok(insightsAr[0].value.includes('TypeScript'));

  const textEn = 'I always prefer clean minimalist interfaces';
  const insightsEn = extractMemoryInsights(textEn);
  assert.ok(insightsEn.length > 0);
  assert.equal(insightsEn[0].category, 'preference');
});

test('Capability 1: consolidates interaction episode and retrieves relevant associative memories', () => {
  saveCognitiveState(getInitialCognitiveState());
  recordInteractionEpisode(
    'أنا أفضل دائماً الردود باللغة العربية الفصحى',
    'حسناً سأجيبك دائماً بالعربية الفصحى.'
  );

  const retrieved = retrieveAssociativeMemories('ما هي لغتي المفضلة؟');
  assert.ok(retrieved.semantic.length > 0);
  assert.ok(retrieved.contextString.includes('العربية الفصحى'));
});

test('Capability 2: detects user correction statements in real-time', () => {
  saveKnowledgeLedger(getInitialLedger());
  const correctionAr = 'لا، هذا خطأ، الصواب هو أن عاصمة كندا هي أوتاوا وليست تورونتو';
  const detectedAr = detectUserCorrection(correctionAr);
  assert.ok(detectedAr !== null);
  assert.equal(detectedAr.category, 'error_correction');
  assert.ok(detectedAr.correction.includes('أوتاوا'));

  const correctionEn = 'No, that is incorrect. Use port 3000 instead.';
  const detectedEn = detectUserCorrection(correctionEn);
  assert.ok(detectedEn !== null);
  assert.ok(detectedEn.correction.includes('port 3000'));
});

test('Capability 2: dynamically injects learned directives into upcoming requests', () => {
  saveKnowledgeLedger(getInitialLedger());
  registerLearnedRule({
    trigger: 'database connection',
    correction: 'Always check SSL certificate before connecting',
    category: 'negative_constraint',
    source: 'user_feedback',
    confidence: 0.95,
  });

  const directives = generateDynamicDirectives('database queries');
  assert.ok(directives.rules.length > 0);
  assert.ok(directives.directivesString.includes('SSL certificate'));
});

test('Capability 2: records self-correction after deterministic verifier catches a mistake', () => {
  const rule = recordSelfCorrection('2 + 2 = 5', '2 + 2 = 4', 'Mathematical precision');
  assert.equal(rule.confidence, 0.98);
  assert.equal(rule.source, 'self_reflection');
});

test('Capability 3: manages proactive autonomous execution lifecycle and alerts', () => {
  let capturedEvents = [];
  const unsub = proactiveEngine.subscribe((events) => {
    capturedEvents = events;
  });

  proactiveEngine.emitProactiveEvent({
    id: 'test-event-1',
    type: 'goal_check',
    title: 'فحص استباقي',
    description: 'مراقبة حالة المشروع ومواعيد المهام',
    severity: 'info',
    timestamp: Date.now(),
    dismissed: false,
  });

  assert.ok(capturedEvents.some((e) => e.id === 'test-event-1'));

  proactiveEngine.dismissEvent('test-event-1');
  assert.ok(capturedEvents.some((e) => e.id === 'test-event-1' && !e.dismissed) === false);

  unsub();
});

test('Capability 4: detects and deterministically corrects arithmetic hallucinations in text', () => {
  const hallucinatedText = 'النتيجة هي 25 * 14 = 340 بالتأكيد.';
  const result = verifyArithmeticStatements(hallucinatedText);

  assert.equal(result.corrections.length, 1);
  assert.ok(result.text.includes('25 * 14 = 350'));
});

test('Capability 4: detects and corrects percentage arithmetic errors', () => {
  const text = 'نسبة 15% من 200 يساوي 45';
  const result = verifyArithmeticStatements(text);
  assert.equal(result.corrections.length, 1);
  assert.ok(result.text.includes('30'));
});

test('Capability 4: flags impossible Gregorian calendar dates', () => {
  const impossible = 'الموعد القادم سيكون في 30 فبراير.';
  const result = verifyTemporalLogic(impossible);
  assert.equal(result.corrections.length, 1);
  assert.ok(result.text.includes('تنبيه منطقي'));
});

test('Capability 4: verifies and auto-closes unclosed code blocks', () => {
  const brokenCode = '```typescript\nfunction test() {\n  console.log("hello");\n```';
  const result = verifyCodeBlocks(brokenCode);
  assert.equal(result.corrections.length, 1);
  assert.ok(result.text.includes('}'));
});

test('Capability 4: passes cleanly through verifyAndCorrectResponse pipeline', () => {
  const soundText = 'حاصل ضرب 5 * 5 = 25 وهو رقم صحيح.';
  const result = verifyAndCorrectResponse(soundText);
  assert.equal(result.passed, true);
  assert.equal(result.isModified, false);
});
