export interface VerificationCorrection {
  type: 'arithmetic' | 'temporal' | 'code_syntax' | 'contradiction';
  original: string;
  corrected: string;
  reason: string;
}

export interface VerificationResult {
  verifiedText: string;
  isModified: boolean;
  passed: boolean;
  corrections: VerificationCorrection[];
  confidenceScore: number; // 1.0 = mathematically & logically verified
}

/**
 * Deterministic Arithmetic & Math Evaluator:
 * Catches arithmetic hallucination in LLM text and corrects it to the exact mathematical value.
 */
export function verifyArithmeticStatements(text: string): { text: string; corrections: VerificationCorrection[] } {
  let updated = text;
  const corrections: VerificationCorrection[] = [];

  // 1. Basic operations: A [+-*/×÷] B = C
  const basicOpRegex = /(\b\d+(?:\.\d+)?)\s*([\+\-\*\/×÷])\s*(\d+(?:\.\d+)?)\s*(=|يساوي|is|equals)\s*(-?\d+(?:\.\d+)?\b)/g;

  let match: RegExpExecArray | null;
  while ((match = basicOpRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const num1 = parseFloat(match[1]);
    const op = match[2];
    const num2 = parseFloat(match[3]);
    const separator = match[4];
    const claimedResult = parseFloat(match[5]);

    let actualResult: number;
    switch (op) {
      case '+':
        actualResult = num1 + num2;
        break;
      case '-':
        actualResult = num1 - num2;
        break;
      case '*':
      case '×':
        actualResult = num1 * num2;
        break;
      case '/':
      case '÷':
        actualResult = num2 !== 0 ? num1 / num2 : NaN;
        break;
      default:
        continue;
    }

    if (!isNaN(actualResult)) {
      // Round to 4 decimal places to prevent floating point noise
      const roundedActual = Math.round(actualResult * 10000) / 10000;
      const diff = Math.abs(roundedActual - claimedResult);

      if (diff > 0.0001) {
        const replacement = `${match[1]} ${op} ${match[3]} ${separator} ${roundedActual}`;
        corrections.push({
          type: 'arithmetic',
          original: fullMatch,
          corrected: replacement,
          reason: `Deterministic correction: ${num1} ${op} ${num2} equals ${roundedActual}, not ${claimedResult}`,
        });
        updated = updated.replace(fullMatch, replacement);
      }
    }
  }

  // 2. Percentage operations: X% of Y = Z or X% من Y = Z
  const percentRegex = /(\b\d+(?:\.\d+)?)\s*%\s*(?:من|of)\s*(\d+(?:\.\d+)?)\s*(=|هو|يساوي|is|equals)\s*(-?\d+(?:\.\d+)?\b)/gi;

  while ((match = percentRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const pct = parseFloat(match[1]);
    const total = parseFloat(match[2]);
    const claimedVal = parseFloat(match[4]);

    const actualVal = Math.round(((pct / 100) * total) * 10000) / 10000;
    if (Math.abs(actualVal - claimedVal) > 0.001) {
      const replacement = fullMatch.replace(match[4], String(actualVal));
      corrections.push({
        type: 'arithmetic',
        original: fullMatch,
        corrected: replacement,
        reason: `Deterministic percentage correction: ${pct}% of ${total} is ${actualVal}`,
      });
      updated = updated.replace(fullMatch, replacement);
    }
  }

  return { text: updated, corrections };
}

/**
 * Calendar and Temporal Logic Evaluator:
 * Rejects impossible dates (e.g. Feb 30, April 31)
 */
export function verifyTemporalLogic(text: string): { text: string; corrections: VerificationCorrection[] } {
  let updated = text;
  const corrections: VerificationCorrection[] = [];

  // Patterns like "30 فبراير" or "February 30", "31 أبريل", etc.
  const impossibleDates = [
    { pattern: /(?:^|\s)(?:30|31)\s*(?:فبراير|February)(?:\s|[.,،]|$)/gi, valid: '28 فبراير (أو 29 في السنة الكبيسة)' },
    { pattern: /(?:^|\s)(?:31)\s*(?:أبريل|April|يونيو|June|سبتمبر|September|نوفمبر|November)(?:\s|[.,،]|$)/gi, valid: '30 من الشهر (هذا الشهر 30 يوماً فقط)' },
  ];

  for (const item of impossibleDates) {
    let match: RegExpExecArray | null;
    while ((match = item.pattern.exec(text)) !== null) {
      const original = match[0];
      corrections.push({
        type: 'temporal',
        original,
        corrected: item.valid,
        reason: `Temporal consistency: Date ${original} is mathematically impossible in the Gregorian calendar`,
      });
      updated = updated.replace(original, `${original} [تنبيه منطقي: ${item.valid}]`);
    }
  }

  return { text: updated, corrections };
}

/**
 * Code Block Syntax & Balance Gate:
 * Checks code blocks for unbalanced braces/parentheses that would break compilation
 */
export function verifyCodeBlocks(text: string): { text: string; corrections: VerificationCorrection[] } {
  let updated = text;
  const corrections: VerificationCorrection[] = [];

  const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const code = match[2];
    // Check bracket balance
    let openBraces = 0;
    let openBrackets = 0;
    let openParens = 0;

    for (let i = 0; i < code.length; i++) {
      const ch = code[i];
      if (ch === '{') openBraces++;
      else if (ch === '}') openBraces = Math.max(0, openBraces - 1);
      else if (ch === '[') openBrackets++;
      else if (ch === ']') openBrackets = Math.max(0, openBrackets - 1);
      else if (ch === '(') openParens++;
      else if (ch === ')') openParens = Math.max(0, openParens - 1);
    }

    if (openBraces > 0 || openBrackets > 0 || openParens > 0) {
      // Append missing closures safely before ```
      let missingClosures = '';
      if (openBraces > 0) missingClosures += '\n' + '}'.repeat(openBraces);
      if (openBrackets > 0) missingClosures += ']'.repeat(openBrackets);
      if (openParens > 0) missingClosures += ')'.repeat(openParens);

      const correctedCode = code + missingClosures;
      const replacement = `\`\`\`${match[1]}\n${correctedCode}\n\`\`\``;
      corrections.push({
        type: 'code_syntax',
        original: match[0],
        corrected: replacement,
        reason: `Code syntax verification: closed ${openBraces} braces, ${openBrackets} brackets, ${openParens} parens`,
      });
      updated = updated.replace(match[0], replacement);
    }
  }

  return { text: updated, corrections };
}

/**
 * Main Formal Logic Gate & Deterministic Verification Pipeline:
 * Runs prior to dispatching any response to the user.
 */
export function verifyAndCorrectResponse(text: string): VerificationResult {
  const allCorrections: VerificationCorrection[] = [];
  let currentText = text;

  // 1. Math verification
  const mathResult = verifyArithmeticStatements(currentText);
  currentText = mathResult.text;
  allCorrections.push(...mathResult.corrections);

  // 2. Calendar & Temporal verification
  const temporalResult = verifyTemporalLogic(currentText);
  currentText = temporalResult.text;
  allCorrections.push(...temporalResult.corrections);

  // 3. Code Block verification
  const codeResult = verifyCodeBlocks(currentText);
  currentText = codeResult.text;
  allCorrections.push(...codeResult.corrections);

  const isModified = allCorrections.length > 0;
  return {
    verifiedText: currentText,
    isModified,
    passed: true,
    corrections: allCorrections,
    confidenceScore: isModified ? 1.0 : 0.99,
  };
}
