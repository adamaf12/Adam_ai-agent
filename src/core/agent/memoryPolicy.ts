import type { Memory, MemoryCategory } from '../domain';

export type MemoryDecision = 'store' | 'skip' | 'replace';

const VOLATILE = /^(?:today|now|currently|this session|for this chat)\b/i;
const SECRET = /(?:password|passwd|secret|api[_ -]?key|token|private key|access[_ -]?key)\s*[:=]/i;
const BEARER = /\bBearer\s+[A-Za-z0-9._-]{16,}\b/i;
const LONG_TOKEN = /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}\b/i;
const MAX_MEMORY_CHARS = 2_000;

export function containsSensitiveMaterial(content: string): boolean {
  return SECRET.test(content) || BEARER.test(content) || LONG_TOKEN.test(content);
}

export function sanitizeMemory(content: string): string | null {
  const value = content.trim();
  if (!value || containsSensitiveMaterial(value)) return null;
  return value.length > MAX_MEMORY_CHARS ? `${value.slice(0, MAX_MEMORY_CHARS)}…` : value;
}

export function decideMemory(content: string, category: MemoryCategory): MemoryDecision {
  const value = content.trim();
  if (!sanitizeMemory(value) || VOLATILE.test(value)) return 'skip';
  if (category === 'instruction' || category === 'preference' || category === 'goal') return 'store';
  return value.length >= 12 ? 'store' : 'skip';
}

export function rankMemories(memories: Memory[], query: string): Memory[] {
  const terms = [...new Set(query.toLowerCase().split(/\s+/).filter(Boolean))];
  return memories
    .map((memory) => {
      const content = memory.content.toLowerCase();
      const hits = terms.reduce((score, term) => score + (content.includes(term) ? 1 : 0), 0);
      return { memory, score: hits };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.memory.updatedAt - a.memory.updatedAt)
    .map((item) => item.memory);
}
