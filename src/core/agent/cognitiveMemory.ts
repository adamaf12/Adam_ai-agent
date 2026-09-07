import { createId } from '../storage.ts';

export type CognitiveMemoryTier = 'episodic' | 'semantic' | 'working' | 'procedural';

export interface EpisodicMemoryNode {
  id: string;
  timestamp: number;
  summary: string;
  entities: string[];
  tags: string[];
  importance: number; // 0.0 to 1.0
}

export interface SemanticMemoryNode {
  id: string;
  concept: string;
  value: string;
  category: 'preference' | 'fact' | 'instruction' | 'heuristic';
  confidence: number; // 0.0 to 1.0
  accessCount: number;
  lastReinforcedAt: number;
  createdAt: number;
}

export interface WorkingMemoryNode {
  key: string;
  value: string;
  updatedAt: number;
  expiresAt?: number;
}

export interface ProceduralMemoryNode {
  taskType: string;
  preferredStrategy: string;
  formatting: Record<string, string>;
  updatedAt: number;
}

export interface CognitiveMemoryState {
  version: number;
  episodic: EpisodicMemoryNode[];
  semantic: SemanticMemoryNode[];
  working: Record<string, WorkingMemoryNode>;
  procedural: Record<string, ProceduralMemoryNode>;
  lastConsolidatedAt: number;
}

const STORAGE_KEY = 'adam:cognitive:memory:v1';
const MAX_EPISODIC = 200;
const MAX_SEMANTIC = 300;
const HALF_LIFE_DAYS = 30;

let memoryCache: CognitiveMemoryState | null = null;

export function getInitialCognitiveState(): CognitiveMemoryState {
  return {
    version: 1,
    episodic: [],
    semantic: [],
    working: {},
    procedural: {},
    lastConsolidatedAt: Date.now(),
  };
}

export function loadCognitiveState(): CognitiveMemoryState {
  if (memoryCache) return memoryCache;
  if (typeof localStorage === 'undefined') {
    memoryCache = getInitialCognitiveState();
    return memoryCache;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      memoryCache = getInitialCognitiveState();
      return memoryCache;
    }
    const parsed = JSON.parse(raw) as Partial<CognitiveMemoryState>;
    memoryCache = {
      version: parsed.version ?? 1,
      episodic: Array.isArray(parsed.episodic) ? parsed.episodic.slice(-MAX_EPISODIC) : [],
      semantic: Array.isArray(parsed.semantic) ? parsed.semantic.slice(-MAX_SEMANTIC) : [],
      working: parsed.working && typeof parsed.working === 'object' ? parsed.working : {},
      procedural: parsed.procedural && typeof parsed.procedural === 'object' ? parsed.procedural : {},
      lastConsolidatedAt: typeof parsed.lastConsolidatedAt === 'number' ? parsed.lastConsolidatedAt : Date.now(),
    };
    return memoryCache;
  } catch {
    memoryCache = getInitialCognitiveState();
    return memoryCache;
  }
}

export function saveCognitiveState(state: CognitiveMemoryState): void {
  memoryCache = state;
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[CognitiveMemory] Failed to persist state:', err);
  }
}

/**
 * Hebbian-inspired temporal decay and relevance calculation
 */
function calculateDecayScore(lastReinforcedAt: number, accessCount: number, baseImportance: number): number {
  const ageInDays = Math.max(0, (Date.now() - lastReinforcedAt) / (1000 * 60 * 60 * 24));
  const decay = Math.pow(0.5, ageInDays / HALF_LIFE_DAYS);
  const reinforcementBonus = Math.min(0.5, Math.log10(accessCount + 1) * 0.25);
  return Math.min(1.0, baseImportance * decay + reinforcementBonus);
}

/**
 * Automatically extracts long-term insights (preferences, facts, instructions)
 * from conversation text without requiring explicit user commands.
 */
export function extractMemoryInsights(text: string): Partial<SemanticMemoryNode>[] {
  const clean = text.trim();
  if (!clean || clean.length < 5) return [];

  const results: Partial<SemanticMemoryNode>[] = [];

  // Patterns for User Preferences (Arabic & English)
  const prefPatterns = [
    /(?:أنا أفضل|أفضل دائماً|يعجبني|أحب أن|تفضيلاتي هي)\s+([^.،\n]+)/gi,
    /(?:i prefer|i like|i always prefer|my preference is)\s+([^.\n]+)/gi,
  ];

  for (const regex of prefPatterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(clean)) !== null) {
      const val = match[1]?.trim();
      if (val && val.length > 3 && val.length < 150) {
        results.push({
          concept: 'preference',
          value: val,
          category: 'preference',
          confidence: 0.9,
        });
      }
    }
  }

  // Patterns for Personal Facts / Identity / Work
  const factPatterns = [
    /(?:أنا أعمل ك|وظيفتي هي|اسمي|أعيش في|مجال عملي|مشروعي الحالي هو)\s+([^.،\n]+)/gi,
    /(?:i work as|my job is|my name is|i live in|my field is|my project is)\s+([^.\n]+)/gi,
  ];

  for (const regex of factPatterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(clean)) !== null) {
      const val = match[1]?.trim();
      if (val && val.length > 3 && val.length < 150) {
        results.push({
          concept: 'fact',
          value: val,
          category: 'fact',
          confidence: 0.85,
        });
      }
    }
  }

  // Patterns for Standing Instructions
  const instructionPatterns = [
    /(?:احرص دائماً على|تذكر دائماً أن|لا تنس أبداً أن|أريدك دائماً أن)\s+([^.،\n]+)/gi,
    /(?:always make sure to|always remember that|never forget to|always format as)\s+([^.\n]+)/gi,
  ];

  for (const regex of instructionPatterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(clean)) !== null) {
      const val = match[1]?.trim();
      if (val && val.length > 3 && val.length < 200) {
        results.push({
          concept: 'instruction',
          value: val,
          category: 'instruction',
          confidence: 0.95,
        });
      }
    }
  }

  return results;
}

/**
 * Consolidates a new experience into episodic and semantic memory
 */
export function recordInteractionEpisode(
  userPrompt: string,
  assistantResponse: string,
  options?: { tags?: string[]; importance?: number }
): { episodeId: string; newInsightsCount: number } {
  const state = loadCognitiveState();
  const episodeId = createId('epi');
  const summary = userPrompt.slice(0, 180).trim();

  // Create episodic record
  const episode: EpisodicMemoryNode = {
    id: episodeId,
    timestamp: Date.now(),
    summary,
    entities: [],
    tags: options?.tags ?? ['chat'],
    importance: options?.importance ?? 0.7,
  };

  state.episodic.push(episode);
  if (state.episodic.length > MAX_EPISODIC) {
    state.episodic = state.episodic.slice(-MAX_EPISODIC);
  }

  // Extract semantic insights automatically
  const insights = extractMemoryInsights(userPrompt);
  let newInsightsCount = 0;

  for (const item of insights) {
    if (!item.value) continue;
    // Check if duplicate or already stored
    const existingIndex = state.semantic.findIndex(
      (s) => s.category === item.category && s.value.toLowerCase() === item.value?.toLowerCase()
    );

    if (existingIndex >= 0) {
      // Reinforce existing
      state.semantic[existingIndex].accessCount += 1;
      state.semantic[existingIndex].lastReinforcedAt = Date.now();
      state.semantic[existingIndex].confidence = Math.min(1.0, state.semantic[existingIndex].confidence + 0.05);
    } else {
      // Insert new semantic node
      state.semantic.push({
        id: createId('sem'),
        concept: item.concept || 'insight',
        value: item.value,
        category: item.category || 'fact',
        confidence: item.confidence || 0.8,
        accessCount: 1,
        lastReinforcedAt: Date.now(),
        createdAt: Date.now(),
      });
      newInsightsCount += 1;
    }
  }

  if (state.semantic.length > MAX_SEMANTIC) {
    // Evict lowest scored semantic memories
    state.semantic.sort((a, b) => {
      const scoreA = calculateDecayScore(a.lastReinforcedAt, a.accessCount, a.confidence);
      const scoreB = calculateDecayScore(b.lastReinforcedAt, b.accessCount, b.confidence);
      return scoreB - scoreA;
    });
    state.semantic = state.semantic.slice(0, MAX_SEMANTIC);
  }

  saveCognitiveState(state);
  return { episodeId, newInsightsCount };
}

/**
 * Associative Cross-Session Memory Recall:
 * Retrieves only the most relevant, distilled memory vectors within a tight character budget.
 */
export function retrieveAssociativeMemories(
  query: string,
  options?: { maxItems?: number; maxChars?: number }
): { semantic: SemanticMemoryNode[]; episodic: EpisodicMemoryNode[]; contextString: string } {
  const state = loadCognitiveState();
  const maxItems = options?.maxItems ?? 5;
  const maxChars = options?.maxChars ?? 800;

  const terms = [...new Set(query.toLowerCase().split(/\s+/).filter((t) => t.length > 2))];

  // Score semantic memories
  const scoredSemantic = state.semantic.map((node) => {
    const text = `${node.concept} ${node.value}`.toLowerCase();
    let hits = 0;
    for (const term of terms) {
      if (text.includes(term)) hits += 1;
    }
    const decayScore = calculateDecayScore(node.lastReinforcedAt, node.accessCount, node.confidence);
    const relevance = hits > 0 ? (hits / terms.length) * 0.7 + decayScore * 0.3 : decayScore * 0.15;
    return { node, score: relevance };
  });

  scoredSemantic.sort((a, b) => b.score - a.score);
  const selectedSemantic = scoredSemantic.slice(0, maxItems).map((item) => {
    // Reinforce node on access
    item.node.accessCount += 1;
    item.node.lastReinforcedAt = Date.now();
    return item.node;
  });

  // Score recent episodic memories
  const recentEpisodes = state.episodic.slice(-10);

  // Format into compact context string
  const lines: string[] = [];
  let currentChars = 0;

  if (selectedSemantic.length > 0) {
    lines.push('[Long-Term Memory / المعرفة المستمرة المستخلصة]:');
    for (const mem of selectedSemantic) {
      const line = `• (${mem.category}) ${mem.value}`;
      if (currentChars + line.length > maxChars) break;
      lines.push(line);
      currentChars += line.length;
    }
  }

  saveCognitiveState(state);

  return {
    semantic: selectedSemantic,
    episodic: recentEpisodes,
    contextString: lines.join('\n'),
  };
}
