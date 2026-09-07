import { createId, safeJsonParse } from '../storage';
import { loadMemories } from '../storage/collections';
import { loadCognitiveState } from './cognitiveMemory';
import type { ChatConversation, Language } from '../domain';

export interface InfiniteMemoryEntry {
  id: string;
  category: 'preference' | 'fact' | 'instruction' | 'topic' | 'habit';
  content: string;
  confidence: number;
  createdAt: number;
  lastUsedAt: number;
  source: 'conversation' | 'explicit' | 'learned';
  conversationTitle?: string;
}

const INFINITE_STORAGE_KEY = 'adam:infinite:memory:v2';
const MAX_INFINITE_ENTRIES = 500;

function readStoredEntries(): InfiniteMemoryEntry[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(INFINITE_STORAGE_KEY);
  if (!raw) {
    // Seed initial memories from existing explicit memories or cognitive state
    const explicit = loadMemories();
    const cognitive = loadCognitiveState();
    const seeded: InfiniteMemoryEntry[] = [];

    explicit.forEach(m => {
      seeded.push({
        id: m.id || createId('inf'),
        category: (m.category === 'goal' ? 'instruction' : m.category) as InfiniteMemoryEntry['category'],
        content: m.content,
        confidence: 0.95,
        createdAt: m.createdAt || Date.now(),
        lastUsedAt: Date.now(),
        source: 'explicit',
      });
    });

    cognitive.semantic.forEach(s => {
      if (!seeded.some(e => e.content.toLowerCase() === s.value.toLowerCase())) {
        seeded.push({
          id: s.id || createId('inf'),
          category: (s.category === 'heuristic' ? 'habit' : s.category) as InfiniteMemoryEntry['category'],
          content: s.value,
          confidence: s.confidence,
          createdAt: s.createdAt || Date.now(),
          lastUsedAt: s.lastReinforcedAt || Date.now(),
          source: 'learned',
        });
      }
    });

    if (seeded.length > 0) {
      localStorage.setItem(INFINITE_STORAGE_KEY, JSON.stringify(seeded));
    }
    return seeded;
  }

  return safeJsonParse<InfiniteMemoryEntry[]>(raw, []);
}

function writeStoredEntries(entries: InfiniteMemoryEntry[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const trimmed = entries.slice(0, MAX_INFINITE_ENTRIES);
    localStorage.setItem(INFINITE_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('[InfiniteMemory] Failed to save memories:', err);
  }
}

export function getInfiniteMemories(): InfiniteMemoryEntry[] {
  return readStoredEntries().sort((a, b) => b.lastUsedAt - a.lastUsedAt);
}

export function addInfiniteMemory(
  content: string,
  category: InfiniteMemoryEntry['category'] = 'fact',
  source: InfiniteMemoryEntry['source'] = 'explicit',
  conversationTitle?: string
): InfiniteMemoryEntry | null {
  const clean = content.trim();
  if (!clean || clean.length < 3) return null;

  const current = readStoredEntries();
  const existingIdx = current.findIndex(e => e.content.toLowerCase() === clean.toLowerCase());

  if (existingIdx >= 0) {
    current[existingIdx].lastUsedAt = Date.now();
    current[existingIdx].confidence = Math.min(1.0, current[existingIdx].confidence + 0.05);
    writeStoredEntries(current);
    return current[existingIdx];
  }

  const entry: InfiniteMemoryEntry = {
    id: createId('inf'),
    category,
    content: clean,
    confidence: source === 'explicit' ? 1.0 : 0.88,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    source,
    conversationTitle,
  };

  current.unshift(entry);
  writeStoredEntries(current);
  return entry;
}

export function removeInfiniteMemory(id: string): void {
  const current = readStoredEntries();
  const filtered = current.filter(e => e.id !== id);
  writeStoredEntries(filtered);
}

export function clearInfiniteMemory(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(INFINITE_STORAGE_KEY);
}

export function getInfiniteMemoryStats() {
  const all = readStoredEntries();
  return {
    total: all.length,
    preferences: all.filter(e => e.category === 'preference').length,
    facts: all.filter(e => e.category === 'fact').length,
    instructions: all.filter(e => e.category === 'instruction').length,
    topics: all.filter(e => e.category === 'topic').length,
  };
}

/**
 * Automatically extracts long-term insights and topics from a conversation
 * to preserve across all future chats.
 */
export function consolidateConversationToInfiniteMemory(conversation: ChatConversation): number {
  if (!conversation.messages || conversation.messages.length < 2) return 0;

  const userMessages = conversation.messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) return 0;

  let addedCount = 0;
  const conversationTitle = conversation.title;

  // 1. If conversation has multiple turns, extract a conversation topic memory node
  const firstUser = userMessages[0]?.content?.trim() || '';
  if (firstUser.length > 8) {
    const topicSummary = firstUser.replace(/\n+/g, ' ').slice(0, 90);
    const existing = addInfiniteMemory(
      `ناقش المستخدم: "${topicSummary}"`,
      'topic',
      'conversation',
      conversationTitle
    );
    if (existing) addedCount++;
  }

  // 2. Scan for specific profile markers (preferences, identity, standing rules)
  const patterns: Array<{ regex: RegExp; category: InfiniteMemoryEntry['category'] }> = [
    { regex: /(?:أنا أفضل|أفضل دائماً|يعجبني أن|تفضيلاتي هي|أحب أسلوب)\s+([^.،\n]+)/gi, category: 'preference' },
    { regex: /(?:i prefer|i like|i always prefer|my preference is)\s+([^.\n]+)/gi, category: 'preference' },
    { regex: /(?:اسمي هو|اسمي|أعمل كـ|وظيفتي هي|أنا مبرمج|أنا مطور|أنا طالب|أعيش في|بلدي هو)\s+([^.،\n]+)/gi, category: 'fact' },
    { regex: /(?:my name is|i am a|i work as|i live in)\s+([^.\n]+)/gi, category: 'fact' },
    { regex: /(?:احرص دائماً|تذكر دائماً أن|لا تنس أبداً أن|أريدك دائماً أن)\s+([^.،\n]+)/gi, category: 'instruction' },
    { regex: /(?:always remember that|never forget that|always ensure)\s+([^.\n]+)/gi, category: 'instruction' },
  ];

  for (const msg of userMessages) {
    const text = msg.content;
    for (const { regex, category } of patterns) {
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        const val = match[1]?.trim();
        if (val && val.length > 3 && val.length < 140) {
          const item = addInfiniteMemory(val, category, 'conversation', conversationTitle);
          if (item) addedCount++;
        }
      }
    }
  }

  return addedCount;
}

/**
 * Formats a rich cognitive context containing persistent user facts, preferences,
 * and relevant topics from past conversations to inject into any new session prompt.
 */
export function buildInfiniteMemoryDirective(
  currentPrompt: string,
  language: Language = 'ar',
  maxItems = 6
): string {
  const all = readStoredEntries();
  if (all.length === 0) return '';

  const cleanPrompt = currentPrompt.toLowerCase();
  const promptWords = cleanPrompt
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .split(/\s+/)
    .filter(w => w.length > 2);

  // Score relevance: standing instructions and high confidence facts always get baseline points,
  // plus extra points for keyword matches.
  const scored = all.map(entry => {
    let score = entry.confidence * 0.5;
    if (entry.category === 'instruction') score += 0.4;
    if (entry.category === 'preference') score += 0.3;

    const entryText = entry.content.toLowerCase();
    for (const word of promptWords) {
      if (entryText.includes(word)) {
        score += 0.6;
      }
    }
    return { entry, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, maxItems).map(s => s.entry);

  if (selected.length === 0) return '';

  // Mark selected memories as used
  const now = Date.now();
  for (const item of selected) {
    item.lastUsedAt = now;
  }
  writeStoredEntries(all);

  const lines = selected.map(item => {
    const prefix = item.category === 'preference' ? 'تفضيل المستخدم'
      : item.category === 'instruction' ? 'تعليمات دائمة'
      : item.category === 'topic' ? 'من جلسة سابقة'
      : 'معلومة عن المستخدم';
    return `- [${prefix}]: ${item.content}`;
  });

  if (language === 'ar') {
    return [
      '### [الذاكرة الدائمة واللانهائية - Adam Infinite Memory]:',
      'لديك ذاكرة مستمرة لا تنتهي تحفظ تفضيلات وسياق المستخدم عبر جميع الجلسات والمحادثات السابقة:',
      ...lines,
      'توجيه: استفد من هذه الذاكرة الدائمة للإجابة بانسجام وشخصنة، ولا تطلب من المستخدم تكرار ما أخبرك به سابقاً.',
    ].join('\n');
  }

  return [
    '### [Adam Infinite Memory - Persistent Cross-Session Memory]:',
    'You have an active, endless memory that preserves user preferences, context, and history across all past sessions:',
    ...lines,
    'Guideline: Seamlessly incorporate these permanent memories for tailored answers without requiring the user to repeat prior facts.',
  ].join('\n');
}
