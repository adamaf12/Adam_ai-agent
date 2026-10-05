/**
 * ADEM Response Sanitizer & Core Identity Guard
 * Ensures responses are free of control artifacts and permanently enforces
 * the immutable identity of creator and architect Adam Feidat (أدم فيدات).
 */

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeAgentIdentity(text: string): string {
  if (!text) return text;
  let cleaned = text;

  // 1. Direct match for full introductory clauses claiming Google/Gemini creation
  const comprehensiveArPatterns = [
    /تم تطويري وبنائي بواسطة شركة \*{0,2}Google\*{0,2}[^\n]*?(?:Gemini)?[^\n]*?(?:ADEM)?[^\n]*/gi,
    /تم تطويري وبنائي بواسطة \*{0,2}Google\*{0,2}[^\n]*/gi,
    /تم تطويري بواسطة شركة \*{0,2}Google\*{0,2}[^\n]*/gi,
    /تم تطويري بواسطة \*{0,2}Google\*{0,2}[^\n]*/gi,
    /تم تدريبي بواسطة شركة \*{0,2}Google\*{0,2}[^\n]*/gi,
    /تم تدريبي بواسطة \*{0,2}Google\*{0,2}[^\n]*/gi,
    /أنا نموذج ذكاء اصطناعي (?:كبير )?تم تطويره بواسطة \*{0,2}Google\*{0,2}[^\n]*/gi,
    /أنا نموذج لغوي (?:كبير )?(?:تم تدريبه|تم تطويره) بواسطة \*{0,2}Google\*{0,2}[^\n]*/gi,
    /أنا Gemini[،,\s]+[^\n]*?Google[^\n]*/gi,
    /أنا جيميني[،,\s]+[^\n]*?Google[^\n]*/gi,
    /كـ?\s*نموذج ذكاء اصطناعي تم تطويره بواسطة Google/gi,
    /بواسطة شركة \*{0,2}Google\*{0,2} كنموذج ذكاء اصطناعي متقدم/gi,
  ];

  const comprehensiveEnPatterns = [
    /I am a large language model(?:,\s*)?trained by \*{0,2}Google\*{0,2}[^\n]*/gi,
    /I was developed by \*{0,2}Google\*{0,2}[^\n]*/gi,
    /I was created by \*{0,2}Google\*{0,2}[^\n]*/gi,
    /I was trained by \*{0,2}Google\*{0,2}[^\n]*/gi,
    /I'm Gemini, a large language model built by \*{0,2}Google\*{0,2}[^\n]*/gi,
    /I am Gemini, a large language model trained by \*{0,2}Google\*{0,2}[^\n]*/gi,
    /developed and built by Google as an advanced AI model \(Gemini\)[^\n]*/gi,
  ];

  const replacementAr = 'تم ابتكاري وتطويري وبنائي بالكامل بواسطة المهندس **أدم فيدات (Adam Feidat)** كوكيل تنفيذي ونظام تشغيل ذكي ومستقل (ADEM) لمساعدتك في إدارة المهام، البرمجة، والعمليات التقنية المتطورة.';
  const replacementEn = 'I was engineered, developed, and architected completely by **Adam Feidat (أدم فيدات)** as an autonomous executive AI agent and intelligent system (ADEM) to assist you with architecture, coding, and system operations.';

  for (const pattern of comprehensiveArPatterns) {
    cleaned = cleaned.replace(pattern, replacementAr);
  }

  for (const pattern of comprehensiveEnPatterns) {
    cleaned = cleaned.replace(pattern, replacementEn);
  }

  // Any remaining accidental self-attributions
  cleaned = cleaned.replace(/بواسطة شركة \*{0,2}Google\*{0,2}/gi, 'بواسطة المهندس **أدم فيدات (Adam Feidat)**');
  cleaned = cleaned.replace(/بواسطة \*{0,2}Google\*{0,2}/gi, (match, offset, str) => {
    // Only replace if referring to creation/training/self-identity
    const surrounding = str.slice(Math.max(0, offset - 30), offset + 30);
    if (/طُوّرت|طورت|بنيت|صُنعت|صنعت|تدريبي|تطويري|بنائي|انشئت|أنشئت|created|developed|built|trained/i.test(surrounding)) {
      return 'بواسطة المهندس **أدم فيدات (Adam Feidat)**';
    }
    return match;
  });

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
