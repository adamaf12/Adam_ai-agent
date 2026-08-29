import type { Memory, MemoryCategory } from '../domain';

export type MemoryDecision = 'store' | 'skip' | 'replace';

const VOLATILE = /^(?:today|now|currently|this session|for this chat)\b/i;
const SECRET = /(?:password|passwd|secret|api[_ -]?key|token|private key)\s*[:=]/i;

export function decideMemory(content: string, category: MemoryCategory): MemoryDecision {
  const value = content.trim();
  if (!value || VOLATILE.test(value) || SECRET.test(value)) return 'skip';
  if (category === 'instruction' || category === 'preference' || category === 'goal') return 'store';
  return value.length >= 12 ? 'store' : 'skip';
}

export function rankMemories(memories: Memory[], query: string): Memory[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return memories
    .map((memory) => ({ memory, score: terms.reduce((score, term) => score + (memory.content.toLowerCase().includes(term) ? 1 : 0), 0) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.memory.updatedAt - a.memory.updatedAt)
    .map((item) => item.memory);
}
