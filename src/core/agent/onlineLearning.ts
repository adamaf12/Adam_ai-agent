import { createId } from '../storage.ts';

export type LearnedRuleCategory =
  | 'error_correction'
  | 'user_guideline'
  | 'fact_update'
  | 'negative_constraint';

export type LearnedRuleSource = 'user_feedback' | 'self_reflection' | 'verification_failure';

export interface LearnedRule {
  id: string;
  trigger: string;
  correction: string;
  category: LearnedRuleCategory;
  source: LearnedRuleSource;
  confidence: number; // 0.0 to 1.0
  createdAt: number;
  appliedCount: number;
}

export interface LiveKnowledgeLedger {
  version: number;
  rules: LearnedRule[];
  verifiedFacts: Record<string, { value: string; updatedAt: number }>;
  antiPatterns: string[];
  updatedAt: number;
}

const STORAGE_KEY = 'adam:online:learning:ledger:v1';
const MAX_RULES = 250;

let ledgerCache: LiveKnowledgeLedger | null = null;

export function getInitialLedger(): LiveKnowledgeLedger {
  return {
    version: 1,
    rules: [],
    verifiedFacts: {},
    antiPatterns: [],
    updatedAt: Date.now(),
  };
}

export function loadKnowledgeLedger(): LiveKnowledgeLedger {
  if (ledgerCache) return ledgerCache;
  if (typeof localStorage === 'undefined') {
    ledgerCache = getInitialLedger();
    return ledgerCache;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      ledgerCache = getInitialLedger();
      return ledgerCache;
    }
    const parsed = JSON.parse(raw) as Partial<LiveKnowledgeLedger>;
    ledgerCache = {
      version: parsed.version ?? 1,
      rules: Array.isArray(parsed.rules) ? parsed.rules.slice(-MAX_RULES) : [],
      verifiedFacts: parsed.verifiedFacts && typeof parsed.verifiedFacts === 'object' ? parsed.verifiedFacts : {},
      antiPatterns: Array.isArray(parsed.antiPatterns) ? parsed.antiPatterns.slice(-100) : [],
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    };
    return ledgerCache;
  } catch {
    ledgerCache = getInitialLedger();
    return ledgerCache;
  }
}

export function saveKnowledgeLedger(ledger: LiveKnowledgeLedger): void {
  ledgerCache = ledger;
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ledger));
  } catch (err) {
    console.warn('[OnlineLearning] Failed to persist ledger:', err);
  }
}

/**
 * Detects whether the user's prompt is explicitly or implicitly correcting
 * a previous output or establishing a strict directive.
 */
export function detectUserCorrection(
  prompt: string,
  _lastAssistantText?: string
): LearnedRule | null {
  const clean = prompt.trim();
  if (clean.length < 6) return null;

  // Patterns for corrections (Arabic & English)
  const correctionPatterns: Array<{
    regex: RegExp;
    category: LearnedRuleCategory;
    triggerPrefix?: string;
  }> = [
    {
      regex: /(?:لا، هذا خطأ|هذا غير صحيح|الإجابة خاطئة|ليس صحيحاً|الصواب هو|التصحيح هو)\s*[:،,-]?\s*(.+)/i,
      category: 'error_correction',
    },
    {
      regex: /(?:no, that(?:'s| is) (?:wrong|incorrect|false)|that is not right|the correct (?:answer|way) is)\s*[:,-]?\s*(.+)/i,
      category: 'error_correction',
    },
    {
      regex: /(?:لا تفعل ذلك مجدداً|لا تعد لـ|إياك أن|لا تستخدم أبداً)\s+(.+)/i,
      category: 'negative_constraint',
    },
    {
      regex: /(?:never (?:do that again|use|say|output)|don't ever)\s+(.+)/i,
      category: 'negative_constraint',
    },
    {
      regex: /(?:القاعدة الجديدة هي|من الآن فصاعداً|اعتمد دائماً)\s+(.+)/i,
      category: 'user_guideline',
    },
    {
      regex: /(?:from now on|new rule:|always ensure that)\s+(.+)/i,
      category: 'user_guideline',
    },
  ];

  for (const { regex, category } of correctionPatterns) {
    const match = regex.exec(clean);
    if (match && match[1]?.trim()) {
      const correctionText = match[1].trim();
      if (correctionText.length > 3 && correctionText.length < 300) {
        return {
          id: createId('rule'),
          trigger: clean.slice(0, 100),
          correction: correctionText,
          category,
          source: 'user_feedback',
          confidence: 0.95,
          createdAt: Date.now(),
          appliedCount: 0,
        };
      }
    }
  }

  return null;
}

/**
 * Registers a learned rule into the live ledger in real time
 */
export function registerLearnedRule(rule: Omit<LearnedRule, 'id' | 'createdAt' | 'appliedCount'>): LearnedRule {
  const ledger = loadKnowledgeLedger();
  const newRule: LearnedRule = {
    ...rule,
    id: createId('rule'),
    createdAt: Date.now(),
    appliedCount: 0,
  };

  // Avoid duplicate rules
  const existingIdx = ledger.rules.findIndex(
    (r) => r.category === rule.category && r.correction.toLowerCase() === rule.correction.toLowerCase()
  );

  if (existingIdx >= 0) {
    ledger.rules[existingIdx].confidence = Math.min(1.0, ledger.rules[existingIdx].confidence + 0.1);
    ledger.rules[existingIdx].trigger = rule.trigger;
    saveKnowledgeLedger(ledger);
    return ledger.rules[existingIdx];
  }

  ledger.rules.push(newRule);
  if (rule.category === 'negative_constraint') {
    ledger.antiPatterns.push(rule.correction);
  }
  ledger.updatedAt = Date.now();

  saveKnowledgeLedger(ledger);
  return newRule;
}

/**
 * Self-Correction Recorder: records a self-corrected mistake so the model never repeats it
 */
export function recordSelfCorrection(
  faultyOutput: string,
  correctedOutput: string,
  reason: string
): LearnedRule {
  return registerLearnedRule({
    trigger: faultyOutput.slice(0, 120),
    correction: `Avoid pattern: "${faultyOutput.slice(0, 80)}". Required: "${correctedOutput.slice(0, 80)}" (${reason})`,
    category: 'error_correction',
    source: 'self_reflection',
    confidence: 0.98,
  });
}

/**
 * Dynamic Directives Generator:
 * Formulates real-time weights and constraints to prepend or append to system instructions.
 */
export function generateDynamicDirectives(
  query: string,
  options?: { maxRules?: number; maxChars?: number }
): { rules: LearnedRule[]; directivesString: string } {
  const ledger = loadKnowledgeLedger();
  const maxRules = options?.maxRules ?? 6;
  const maxChars = options?.maxChars ?? 1000;

  if (!ledger.rules.length && !ledger.antiPatterns.length) {
    return { rules: [], directivesString: '' };
  }

  const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

  // Score rules by relevance to current query + confidence
  const scored = ledger.rules.map((rule) => {
    const text = `${rule.trigger} ${rule.correction}`.toLowerCase();
    let hits = 0;
    for (const term of queryTerms) {
      if (text.includes(term)) hits += 1;
    }
    // Universal negative constraints always get a high baseline score
    const isUniversal = rule.category === 'negative_constraint' || rule.category === 'user_guideline';
    const score = (hits * 1.5) + (isUniversal ? 1.0 : 0.2) + rule.confidence;
    return { rule, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, maxRules).map((item) => {
    item.rule.appliedCount += 1;
    return item.rule;
  });

  saveKnowledgeLedger(ledger);

  const lines: string[] = [];
  let currentChars = 0;

  if (selected.length > 0) {
    lines.push('[Real-Time Learned Directives / أوزان وقواعد التعلّم الفوري المستمر]:');
    for (const r of selected) {
      const line = `• [${r.category}] ${r.correction}`;
      if (currentChars + line.length > maxChars) break;
      lines.push(line);
      currentChars += line.length;
    }
  }

  return {
    rules: selected,
    directivesString: lines.join('\n'),
  };
}
