import type { AppPreferences, ChatConversation, Theme } from './domain';

const PREFS_KEY = 'adam.preferences.v2';
const CONVERSATION_KEY = 'adam.conversation.v2';
const THEMES: Theme[] = ['system', 'light', 'dark', 'glass', 'glass-dark', 'aurora'];

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
  const theme = THEMES.includes(source.theme as Theme) ? source.theme as Theme : 'system';
  return {
    agentName: typeof source.agentName === 'string' && source.agentName.trim() ? source.agentName.trim().slice(0, 40) : 'Adam',
    language: source.language === 'en' ? 'en' : 'ar',
    theme,
    onboardingComplete: source.onboardingComplete === true,
  };
}

export function loadPreferences(fallback: AppPreferences): AppPreferences {
  if (typeof localStorage === 'undefined') return normalizePreferences(fallback);
  return normalizePreferences(safeJsonParse(localStorage.getItem(PREFS_KEY), fallback));
}

export function savePreferences(preferences: AppPreferences): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(normalizePreferences(preferences)));
}

export function loadConversation(fallback: ChatConversation): ChatConversation {
  if (typeof localStorage === 'undefined') return fallback;
  const value = safeJsonParse<ChatConversation | null>(localStorage.getItem(CONVERSATION_KEY), null);
  if (!value || !Array.isArray(value.messages)) return fallback;
  return { ...fallback, ...value, messages: value.messages.slice(-100) };
}

export function saveConversation(conversation: ChatConversation): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(CONVERSATION_KEY, JSON.stringify({ ...conversation, messages: conversation.messages.slice(-100) }));
}

export function clearConversation(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(CONVERSATION_KEY);
}
