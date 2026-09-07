import type { AppPreferences, ChatConversation, Theme } from './domain';
import { migrateEnvelope, createVersionedEnvelope, type StorageEnvelope } from './storage/envelope';
import { normalizeMessage } from './domain';

const PREFS_KEY = 'adam.preferences.v2';
const CONVERSATION_KEY = 'adam.conversation.v2';
const SESSIONS_LIST_KEY = 'adam.conversations.list.v1';
const ACTIVE_SESSION_KEY = 'adam.conversation.active_id.v1';
const THEMES: Theme[] = ['system', 'light', 'dark', 'glass', 'glass-dark', 'aurora'];
const STORAGE_VERSION = 1;
const MAX_MESSAGES = 100;
const MAX_SAVED_SESSIONS = 50;

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
  if ('schema' in value && value.schema === 'adam' && typeof value.version === 'number' && 'payload' in value) return value as StorageEnvelope<T>;
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
  return normalizePreferences({ ...fallback, ...current.payload });
}

export function savePreferences(preferences: AppPreferences): void {
  writeEnvelope(PREFS_KEY, normalizePreferences(preferences));
}

function cleanMessages(rawMessages: unknown[]): ChatConversation['messages'] {
  if (!Array.isArray(rawMessages)) return [];
  return rawMessages
    .map(message => {
      try { return normalizeMessage(message); } catch { return null; }
    })
    .filter((message): message is NonNullable<typeof message> => message !== null)
    .slice(-MAX_MESSAGES);
}

export function isGenericTitle(title?: string | null): boolean {
  if (!title) return true;
  const t = title.trim().toLowerCase();
  return (
    t === '' ||
    t === 'adam' ||
    t === 'محادثة جديدة' ||
    t === 'new chat' ||
    t === 'new conversation' ||
    t === 'محادثة' ||
    t === 'المحادثة' ||
    t === 'untitled' ||
    t === 'chat' ||
    t.startsWith('new chat') ||
    t.startsWith('محادثة جديدة')
  );
}

export function generateConversationTitle(conversation: ChatConversation): string {
  const firstUserMessage = conversation.messages.find(m => m.role === 'user');
  if (firstUserMessage && firstUserMessage.content) {
    const raw = firstUserMessage.content.trim().replace(/[\n\r]+/g, ' ');
    return raw.slice(0, 42) + (raw.length > 42 ? '…' : '');
  }
  return conversation.title || 'محادثة';
}

export function loadAllConversations(): ChatConversation[] {
  if (typeof localStorage === 'undefined') {
    return [{
      id: 'default',
      title: 'محادثة جديدة',
      messages: [],
      updatedAt: Date.now(),
      createdAt: Date.now(),
    }];
  }

  const envelope = readEnvelope<ChatConversation[]>(SESSIONS_LIST_KEY);
  if (envelope && Array.isArray(envelope.payload) && envelope.payload.length > 0) {
    const validSessions = envelope.payload.map(item => ({
      id: typeof item.id === 'string' && item.id ? item.id : createId('conv'),
      title: typeof item.title === 'string' && item.title ? item.title : 'محادثة',
      messages: cleanMessages(item.messages),
      updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now(),
      createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
    }));
    return validSessions.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  // Backward-compatibility: Check if single legacy conversation exists
  const legacyEnvelope = readEnvelope<ChatConversation>(CONVERSATION_KEY);
  if (legacyEnvelope && legacyEnvelope.payload && Array.isArray(legacyEnvelope.payload.messages)) {
    const legacyMessages = cleanMessages(legacyEnvelope.payload.messages);
    const legacyConv: ChatConversation = {
      id: legacyEnvelope.payload.id || createId('conv'),
      title: legacyEnvelope.payload.title || (legacyMessages.length > 0 ? generateConversationTitle({ ...legacyEnvelope.payload, messages: legacyMessages }) : 'محادثة سابقة'),
      messages: legacyMessages,
      updatedAt: legacyEnvelope.payload.updatedAt || Date.now(),
      createdAt: Date.now(),
    };
    saveAllConversations([legacyConv]);
    return [legacyConv];
  }

  const initialConv: ChatConversation = {
    id: createId('conv'),
    title: 'محادثة جديدة',
    messages: [],
    updatedAt: Date.now(),
    createdAt: Date.now(),
  };
  saveAllConversations([initialConv]);
  return [initialConv];
}

export function saveAllConversations(conversations: ChatConversation[]): void {
  if (typeof localStorage === 'undefined') return;
  const pruned = conversations.slice(0, MAX_SAVED_SESSIONS);
  writeEnvelope(SESSIONS_LIST_KEY, pruned);
}

export function getActiveConversationId(): string {
  if (typeof localStorage === 'undefined') return 'default';
  const stored = localStorage.getItem(ACTIVE_SESSION_KEY);
  if (stored) return stored;
  const all = loadAllConversations();
  const firstId = all[0]?.id || 'default';
  localStorage.setItem(ACTIVE_SESSION_KEY, firstId);
  return firstId;
}

export function setActiveConversationId(id: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(ACTIVE_SESSION_KEY, id);
}

export function loadConversation(fallback?: ChatConversation, specificId?: string): ChatConversation {
  const all = loadAllConversations();
  const targetId = specificId || getActiveConversationId();
  const found = all.find(c => c.id === targetId);
  if (found) {
    return { ...found, messages: cleanMessages(found.messages) };
  }
  if (all.length > 0 && all[0]) {
    setActiveConversationId(all[0].id);
    return { ...all[0], messages: cleanMessages(all[0].messages) };
  }
  const empty: ChatConversation = fallback || {
    id: createId('conv'),
    title: 'محادثة جديدة',
    messages: [],
    updatedAt: Date.now(),
    createdAt: Date.now(),
  };
  saveConversation(empty);
  return empty;
}

export function saveConversation(conversation: ChatConversation): void {
  const messages = cleanMessages(conversation.messages);
  const isDefault = isGenericTitle(conversation.title);
  const autoTitle = isDefault && messages.length > 0
    ? generateConversationTitle({ ...conversation, messages })
    : conversation.title || 'محادثة';

  const updated: ChatConversation = {
    ...conversation,
    title: autoTitle,
    messages,
    updatedAt: Date.now(),
    createdAt: conversation.createdAt || Date.now(),
  };

  const all = loadAllConversations();
  const existingIdx = all.findIndex(c => c.id === updated.id);
  if (existingIdx >= 0) {
    all[existingIdx] = updated;
  } else {
    all.unshift(updated);
  }

  // Sort so most recently updated is first
  all.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  saveAllConversations(all);
  setActiveConversationId(updated.id);

  // Sync to legacy key for compatibility with any external reader
  writeEnvelope(CONVERSATION_KEY, updated);
}

export function createNewConversation(initialTitle?: string, language: 'ar' | 'en' = 'ar'): ChatConversation {
  const all = loadAllConversations();
  // Reuse existing empty conversation if active or first
  const existingEmpty = all.find(c => c.messages.length === 0);
  if (existingEmpty) {
    setActiveConversationId(existingEmpty.id);
    writeEnvelope(CONVERSATION_KEY, existingEmpty);
    return existingEmpty;
  }

  const newConv: ChatConversation = {
    id: createId('conv'),
    title: initialTitle || (language === 'ar' ? 'محادثة جديدة' : 'New Chat'),
    messages: [],
    updatedAt: Date.now(),
    createdAt: Date.now(),
  };

  const updatedList = [newConv, ...all];
  saveAllConversations(updatedList);
  setActiveConversationId(newConv.id);
  writeEnvelope(CONVERSATION_KEY, newConv);
  return newConv;
}

export function deleteConversation(id: string): { remaining: ChatConversation[]; nextActiveId: string } {
  const all = loadAllConversations();
  const filtered = all.filter(c => c.id !== id);
  if (filtered.length === 0) {
    const fresh = createNewConversation();
    return { remaining: [fresh], nextActiveId: fresh.id };
  }
  saveAllConversations(filtered);
  const currentActive = getActiveConversationId();
  let nextActiveId = currentActive;
  if (currentActive === id) {
    nextActiveId = filtered[0].id;
    setActiveConversationId(nextActiveId);
  }
  return { remaining: filtered, nextActiveId };
}

export function renameConversation(id: string, newTitle: string): void {
  const clean = newTitle.trim().slice(0, 60);
  if (!clean) return;
  const all = loadAllConversations();
  const found = all.find(c => c.id === id);
  if (found) {
    found.title = clean;
    found.updatedAt = Date.now();
    saveAllConversations(all);
  }
}

export function clearConversation(): void {
  // Clear messages of the active conversation while keeping it in the list
  const activeId = getActiveConversationId();
  const all = loadAllConversations();
  const current = all.find(c => c.id === activeId);
  if (current) {
    current.messages = [];
    current.updatedAt = Date.now();
    saveAllConversations(all);
    writeEnvelope(CONVERSATION_KEY, current);
  }
}

export function clearAllConversations(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(SESSIONS_LIST_KEY);
  localStorage.removeItem(ACTIVE_SESSION_KEY);
  localStorage.removeItem(CONVERSATION_KEY);
  createNewConversation();
}
