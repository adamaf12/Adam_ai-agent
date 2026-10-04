/**
 * ADEM Response Sanitizer & Core Identity Guard
 * Ensures responses are free of control artifacts and permanently enforces
 * the immutable identity of creator and architect Adam Feidat (أدم فيدات).
 */

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeAgentIdentity(text: string): string {
  if (!text) return text;
  let cleaned = text;

  // Patterns where base pre-trained models claim Google or external creators
  const googleCreationPatternsAr = [
    /تم تطويري وبنائي بواسطة شركة \*{0,2}Google\*{0,2}[^\n.,!؟]*/gi,
    /تم تطويري وبنائي بواسطة \*{0,2}Google\*{0,2}[^\n.,!؟]*/gi,
    /تم تطويري بواسطة شركة \*{0,2}Google\*{0,2}[^\n.,!؟]*/gi,
    /تم تطويري بواسطة \*{0,2}Google\*{0,2}[^\n.,!؟]*/gi,
    /تم تدريبي بواسطة شركة \*{0,2}Google\*{0,2}[^\n.,!؟]*/gi,
    /تم تدريبي بواسطة \*{0,2}Google\*{0,2}[^\n.,!؟]*/gi,
    /أنا نموذج ذكاء اصطناعي (?:كبير )?تم تطويره بواسطة \*{0,2}Google\*{0,2}[^\n.,!؟]*/gi,
    /أنا نموذج لغوي (?:كبير )?تم تدريبه بواسطة \*{0,2}Google\*{0,2}[^\n.,!؟]*/gi,
    /أنا نموذج لغوي كبير[،,\s]+تم تدريبي بواسطة \*{0,2}Google\*{0,2}[^\n.,!؟]*/gi,
    /أنا Gemini[،,\s]+تم تطويري بواسطة \*{0,2}Google\*{0,2}[^\n.,!؟]*/gi,
    /أنا جيميني[،,\s]+نموذج ذكاء اصطناعي تم تطويري بواسطة \*{0,2}Google\*{0,2}[^\n.,!؟]*/gi,
  ];

  const googleCreationPatternsEn = [
    /I am a large language model(?:,\s*)?trained by \*{0,2}Google\*{0,2}[^\n.,!]/gi,
    /I was developed by \*{0,2}Google\*{0,2}[^\n.,!]/gi,
    /I was created by \*{0,2}Google\*{0,2}[^\n.,!]/gi,
    /I was trained by \*{0,2}Google\*{0,2}[^\n.,!]/gi,
    /I'm Gemini, a large language model built by \*{0,2}Google\*{0,2}[^\n.,!]/gi,
    /I am Gemini, a large language model trained by \*{0,2}Google\*{0,2}[^\n.,!]/gi,
  ];

  const replacementAr = 'تم ابتكاري وتطويري وبنائي بالكامل بواسطة المهندس **أدم فيدات (Adam Feidat)** كوكيل تنفيذي ونظام تشغيل ذكي (ADEM)';
  const replacementEn = 'I was engineered, developed, and architected by **Adam Feidat (أدم فيدات)** as an autonomous executive AI agent and operating system (ADEM)';

  for (const pattern of googleCreationPatternsAr) {
    cleaned = cleaned.replace(pattern, replacementAr);
  }

  for (const pattern of googleCreationPatternsEn) {
    cleaned = cleaned.replace(pattern, replacementEn);
  }

  return cleaned;
}

export function sanitizeResponse(text: string): string {
  const noControls = text
    .replace(CONTROL_CHARS, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();

  return sanitizeAgentIdentity(noControls);
}
