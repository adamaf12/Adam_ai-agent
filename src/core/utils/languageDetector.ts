/**
 * Comprehensive Language Detection Utility
 * Accurately detects whether a given user message is Arabic, English, French, Spanish, German, or other languages
 */

export type DetectedLanguage = 'ar' | 'en' | 'fr' | 'es' | 'de' | 'it' | 'ru' | 'tr' | 'zh' | 'ja' | 'ko' | string;

export function detectMessageLanguage(text: string, fallback: string = 'ar'): DetectedLanguage {
  if (!text || typeof text !== 'string') return fallback;
  const clean = text.trim();
  if (!clean) return fallback;

  // 1. Arabic Character Range (Arabic, Persian, Urdu, Darija)
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  if (arabicRegex.test(clean)) {
    return 'ar';
  }

  // 2. East Asian Scripts
  if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(clean)) {
    if (/[\u3040-\u30ff]/.test(clean)) return 'ja';
    return 'zh';
  }
  if (/[\uac00-\ud7af]/.test(clean)) return 'ko';

  // 3. Cyrillic (Russian, etc.)
  if (/[\u0400-\u04FF]/.test(clean)) return 'ru';

  const lower = clean.toLowerCase();

  // 4. French detection
  const frenchAccents = /[éèêëàâùûôîïçœæ]/i;
  const frenchWords = /\b(bonjour|salut|merci|comment|pourquoi|qui|est-ce|s'il vous|svp|faire|traduire|qu'est-ce|français|avec|pour|dans|votre|notre|c'est|j'ai|nous|vous|ils|elles|mon|ma|mes|ce|cette)\b/i;
  if (frenchAccents.test(lower) || frenchWords.test(lower)) {
    return 'fr';
  }

  // 5. Spanish detection
  const spanishAccents = /[áéíóúñ¿¡]/i;
  const spanishWords = /\b(hola|gracias|cómo|como|por qué|porque|qué|que|buenos|días|tardes|amigo|español|hacer|para|con|por|este|esta|todo|bien|puedes|ayuda)\b/i;
  if (spanishAccents.test(lower) || spanishWords.test(lower)) {
    return 'es';
  }

  // 6. German detection
  const germanAccents = /[äöüß]/i;
  const germanWords = /\b(hallo|danke|bitte|wie|warum|deutsch|guten|tag|morgen|abend|nicht|mit|und|oder|kannst|können|hilfe|machen|ich|du|wir|sie)\b/i;
  if (germanAccents.test(lower) || germanWords.test(lower)) {
    return 'de';
  }

  // 7. Italian detection
  const italianWords = /\b(ciao|grazie|come|perché|italiano|buongiorno|buonasera|fare|cosa|dove|quando|molto|tutto|bene)\b/i;
  if (italianWords.test(lower)) {
    return 'it';
  }

  // 8. Turkish detection
  const turkishAccents = /[ğışçöü]/i;
  const turkishWords = /\b(merhaba|teşekkürler|nasıl|neden|türkçe|evet|hayır|lütfen|yap|neler|güzel|günaydın)\b/i;
  if (turkishAccents.test(lower) || turkishWords.test(lower)) {
    return 'tr';
  }

  // 9. English keywords and standard Latin text
  const englishWords = /\b(the|is|are|you|your|what|how|why|can|could|would|should|explain|write|code|hello|hi|hey|build|create|fix|run|tell|test|please|which|where|when|who|whose|give|show|implement|debug|problem|question|task|project)\b/i;
  if (englishWords.test(lower)) {
    return 'en';
  }

  // 10. Default fallback for Latin script is 'en', otherwise fallback
  if (/^[a-zA-Z0-9\s.,!?'"()\-+/*=_:;@#$%^&<>]+$/.test(clean)) {
    return 'en';
  }

  return fallback;
}
