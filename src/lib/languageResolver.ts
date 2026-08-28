import { AgentSettings } from '../types';
import { GLOBAL_VOICES } from './voiceEngine';

/**
 * Detects host device / operating system primary language with full fallback chain
 * (Windows, macOS, Linux, Android, iOS, iPadOS, Browser).
 */
export function resolveSystemLanguage(): string {
  if (typeof navigator === 'undefined') return 'ar';

  const candidates: string[] = [];

  // 1. Check navigator.languages list
  if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
    candidates.push(...navigator.languages);
  }

  // 2. Check standard navigator properties
  if (navigator.language) candidates.push(navigator.language);
  if ((navigator as any).userLanguage) candidates.push((navigator as any).userLanguage);
  if ((navigator as any).browserLanguage) candidates.push((navigator as any).browserLanguage);
  if ((navigator as any).systemLanguage) candidates.push((navigator as any).systemLanguage);

  // 3. Check Intl API
  try {
    const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (intlLocale) candidates.push(intlLocale);
  } catch {}

  // Standard supported languages
  const supported = ['ar', 'en', 'fr', 'es', 'de', 'tr', 'it', 'pt', 'ru', 'zh', 'ja'];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'string') continue;
    const clean = candidate.trim().toLowerCase();
    const prefix = clean.substring(0, 2);
    if (supported.includes(prefix)) {
      return prefix;
    }
  }

  // Default fallback if unknown
  return 'en';
}

/**
 * Resolves the active application interface & core system language.
 * When set to 'auto', it strictly follows the host device / OS language.
 */
export function resolveAppLanguage(settings?: AgentSettings | null): string {
  if (!settings || !settings.language || settings.language === 'auto') {
    return resolveSystemLanguage();
  }
  return settings.language;
}

/**
 * Fast & accurate natural language classifier for individual chat messages.
 * Detects whether a message is written in Arabic, French, English, Spanish, German, Turkish, Russian, Chinese, Japanese, etc.
 */
export function detectMessageLanguage(text: string): string {
  if (!text || typeof text !== 'string') return 'ar';
  const clean = text.trim();
  if (!clean) return 'ar';

  // 1. Arabic & Arabic-script languages (Highest precision check)
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(clean)) {
    return 'ar';
  }

  // 2. Russian / Cyrillic
  if (/[\u0400-\u04FF]/.test(clean)) {
    return 'ru';
  }

  // 3. Chinese
  if (/[\u4e00-\u9fa5]/.test(clean)) {
    return 'zh';
  }

  // 4. Japanese (Hiragana / Katakana)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(clean)) {
    return 'ja';
  }

  const lower = clean.toLowerCase();

  // 5. French specific diacritics & common vocabulary
  if (
    /[àâäéèêëîïôöùûüçœæ]/i.test(clean) ||
    /\b(bonjour|salut|merci|comment|pourquoi|avec|vous|nous|c'est|est|dans|pour|faire|oui|non|mon|ma|mes|ton|ta|tes|notre|votre|suis|sommes|aide|question|besoin|quel|quelle|très|bien|aussi)\b/i.test(
      lower
    )
  ) {
    return 'fr';
  }

  // 6. Spanish specific diacritics & common vocabulary
  if (
    /[ñ¿¡]/i.test(clean) ||
    /\b(hola|gracias|como|estas|buenos|dias|noches|por|para|con|amigo|usted|hacer|bien|que|puedes|ayuda|por favor|donde|cuando|quien|necesito)\b/i.test(
      lower
    )
  ) {
    return 'es';
  }

  // 7. German specific characters & common vocabulary
  if (
    /[äöüß]/i.test(clean) ||
    /\b(hallo|guten|tag|danke|bitte|wie|geht|nicht|und|ist|ich|wir|sie|haben|machen|kannst|hilfe|warum|wo|wer|wann)\b/i.test(
      lower
    )
  ) {
    return 'de';
  }

  // 8. Turkish specific characters & vocabulary
  if (
    /[ğışçöüĞİŞÇÖÜ]/i.test(clean) ||
    /\b(merhaba|nasılsın|teşekkürler|evet|hayır|lütfen|yardım|nasıl|neden|nerede)\b/i.test(lower)
  ) {
    return 'tr';
  }

  // 9. Italian specific vocabulary
  if (
    /\b(ciao|grazie|come|stai|buongiorno|perche|con|fare|bene|aiuto|prego|dove|quando|chi|posso)\b/i.test(lower)
  ) {
    return 'it';
  }

  // 10. Portuguese specific diacritics & vocabulary
  if (
    /[ãõ]/i.test(clean) ||
    /\b(ola|obrigado|como|esta|bom|dia|voce|ajuda|por favor|onde|quando|quem)\b/i.test(lower)
  ) {
    return 'pt';
  }

  // 11. Latin alphabet fallback -> English
  if (/[a-zA-Z]/.test(clean)) {
    return 'en';
  }

  return 'ar';
}

/**
 * Returns human-readable label for language code
 */
export function getLanguageName(langCode: string, inArabic = true): string {
  const map: Record<string, { ar: string; en: string; native: string }> = {
    ar: { ar: 'العربية', en: 'Arabic', native: 'العربية' },
    en: { ar: 'الإنجليزية', en: 'English', native: 'English' },
    fr: { ar: 'الفرنسية', en: 'French', native: 'Français' },
    es: { ar: 'الإسبانية', en: 'Spanish', native: 'Español' },
    de: { ar: 'الألمانية', en: 'German', native: 'Deutsch' },
    tr: { ar: 'التركية', en: 'Turkish', native: 'Türkçe' },
    it: { ar: 'الإيطالية', en: 'Italian', native: 'Italiano' },
    pt: { ar: 'البرتغالية', en: 'Portuguese', native: 'Português' },
    ru: { ar: 'الروسية', en: 'Russian', native: 'Русский' },
    zh: { ar: 'الصينية', en: 'Chinese', native: '中文' },
    ja: { ar: 'اليابانية', en: 'Japanese', native: '日本語' },
  };

  const entry = map[langCode] || map.en;
  return inArabic ? entry.ar : entry.en;
}

/**
 * Synchronizes and returns the optimal voice for the active/spoken language.
 */
export function syncVoiceEngineLanguage(settings?: AgentSettings | null, targetLang?: string): string {
  const lang = targetLang || resolveAppLanguage(settings);
  // Find a matching voice for the resolved language
  const matchingVoice = GLOBAL_VOICES.find((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
  return matchingVoice ? matchingVoice.id : 'adam-neural';
}
