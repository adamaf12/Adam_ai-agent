import { randomUUID } from 'node:crypto';
import { dbIsolation } from './dbIsolation';

export type MemoryCategory = 'preference' | 'profile' | 'fact' | 'workflow';

export interface StructuredMemory {
  id: string;
  userId: string;
  category: MemoryCategory;
  text: string;
  keywords: string[];
  confidence: number; // 0.0 - 1.0
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
}

export class BetterMemoryEngine {
  /**
   * Add or update a structured memory for a specific isolated user
   */
  public static addMemory(userId: string, category: MemoryCategory, text: string, confidence = 0.9): StructuredMemory {
    const memories = this.getUserMemories(userId);
    const cleanText = text.trim();

    // Deduplication check: if similar memory already exists, update its access count and confidence
    const existing = memories.find(m => m.text.toLowerCase() === cleanText.toLowerCase());
    if (existing) {
      existing.accessCount += 1;
      existing.lastAccessedAt = Date.now();
      existing.confidence = Math.min(1.0, existing.confidence + 0.05);
      this.saveUserMemories(userId, memories);
      return existing;
    }

    const keywords = cleanText
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    const memory: StructuredMemory = {
      id: `mem_${randomUUID()}`,
      userId,
      category,
      text: cleanText,
      keywords: Array.from(new Set(keywords)),
      confidence,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 1,
    };

    memories.unshift(memory);
    // Keep top 200 memories per user
    if (memories.length > 200) {
      memories.length = 200;
    }

    this.saveUserMemories(userId, memories);
    return memory;
  }

  /**
   * Search and retrieve top-N relevant memories for a prompt
   */
  public static queryRelevantMemories(userId: string, prompt: string, limit = 5): StructuredMemory[] {
    const memories = this.getUserMemories(userId);
    if (!memories.length) return [];

    const queryWords = prompt
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    if (!queryWords.length) {
      return memories.slice(0, limit);
    }

    // Score memories based on keyword overlap, confidence, and recency
    const scored = memories.map(mem => {
      let score = 0;
      for (const word of queryWords) {
        if (mem.keywords.includes(word)) score += 2;
        if (mem.text.toLowerCase().includes(word)) score += 1;
      }

      // Boost by confidence and recency
      score *= mem.confidence;
      const daysOld = (Date.now() - mem.lastAccessedAt) / (1000 * 60 * 60 * 24);
      if (daysOld < 7) score += 0.5;

      return { mem, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => {
        item.mem.accessCount += 1;
        item.mem.lastAccessedAt = Date.now();
        return item.mem;
      });
  }

  public static getUserMemories(userId: string): StructuredMemory[] {
    return dbIsolation.loadUserData<StructuredMemory[]>(userId, 'memories', []);
  }

  public static saveUserMemories(userId: string, memories: StructuredMemory[]): void {
    dbIsolation.saveUserData(userId, 'memories', memories);
  }

  public static deleteMemory(userId: string, memoryId: string): boolean {
    const memories = this.getUserMemories(userId);
    const filtered = memories.filter(m => m.id !== memoryId);
    if (filtered.length !== memories.length) {
      this.saveUserMemories(userId, filtered);
      return true;
    }
    return false;
  }

  /**
   * Format relevant memories into a clean prompt context block
   */
  public static formatForContext(relevant: StructuredMemory[], language: 'ar' | 'en'): string {
    if (!relevant.length) return '';
    const header = language === 'ar' ? '\n\n[ذاكرة وسياق المستخدم المستمر]:\n' : '\n\n[Persistent User Context & Memory]:\n';
    const items = relevant.map(m => `- (${m.category}): ${m.text}`).join('\n');
    return `${header}${items}`;
  }
}
