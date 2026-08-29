import type { AppPreferences } from './domain';

const PREFS_KEY = 'adam.preferences.v2';

export function createId(prefix = 'id'): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}_${random}`;
}

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export function normalizePreferences(input: Partial<AppPreferences> | null | undefined): AppPreferences {
  const source = input ?? {};
  return {
    agentName: typeof source.agentName === 'string' && source.agentName.trim() ? source.agentName.trim().slice(0, 40) : 'Adam',
    language: source.language === 'en' ? 'en' : 'ar',
    theme: source.theme === 'light' || source.theme === 'dark' ? source.theme : 'system',
    onboardingComplete: source.onboardingComplete === true,
  };
}

export function loadPreferences(fallback: AppPreferences): AppPreferences {
  if (typeof localStorage === 'undefined') return fallback;
  return normalizePreferences(safeJsonParse(localStorage.getItem(PREFS_KEY), fallback));
}

export function savePreferences(preferences: AppPreferences): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(normalizePreferences(preferences)));
}
