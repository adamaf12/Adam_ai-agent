import type { AppPreferences, ChatConversation, Theme } from './domain';
import { migrateEnvelope, createVersionedEnvelope, type StorageEnvelope } from './storage/envelope';

const PREFS_KEY = 'adam.preferences.v2';
const CONVERSATION_KEY = 'adam.conversation.v2';
const THEMES: Theme[] = ['system', 'light', 'dark', 'glass', 'glass-dark', 'aurora'];
const STORAGE_VERSION = 1;

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

function readEnvelope<T>(key: string): StorageEnvelope<T> | null {
  if (typeof localStorage === 'undefined') return null;
  const value = safeJsonParse<StorageEnvelope<T> | T | null>(localStorage.getItem(key), null);
  if (!value || typeof value !== 'object') return null;
  if ('schema' in value && value.schema === 'adam' && typeof value.version === 'number' && 'payload' in value) {
    return value as StorageEnvelope<T>;
  }
  return createVersionedEnvelope(STORAGE_VERSION, value as T);
}

function writeEnvelope<T>(key: string, payload: T): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(createVersionedEnvelope(STORAGE_VERSION, payload)));
}

export function loadPreferences(fallback: AppPreferences): AppPreferences {
  const envelope = readEnvelope<Partial<AppPreferences>>(PREFS_KEY);
  if (!envelope) return normalizePreferences(fallback);
  const current = migrateEnvelope(envelope, STORAGE_VERSION, (_version, payload) => payload);
  return normalizePreferences(current.payload);
}

export function savePreferences(preferences: AppPreferences): void {
  writeEnvelope(PREFS_KEY, normalizePreferences(preferences));
}

export function loadConversation(fallback: ChatConversation): ChatConversation {
  const envelope = readEnvelope<ChatConversation>(CONVERSATION_KEY);
  if (!envelope || !envelope.payload || !Array.isArray(envelope.payload.messages)) return fallback;
  const current = migrateEnvelope(envelope, STORAGE_VERSION, (_version, payload) => payload);
  return { ...fallback, ...current.payload, messages: current.payload.messages.slice(-100) };
}

export function saveConversation(conversation: ChatConversation): void {
  writeEnvelope(CONVERSATION_KEY, { ...conversation, messages: conversation.messages.slice(-100) });
}

export function clearConversation(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(CONVERSATION_KEY);
}
