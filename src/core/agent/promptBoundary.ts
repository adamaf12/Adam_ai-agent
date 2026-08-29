export type TrustBoundary = 'system' | 'developer' | 'user' | 'tool';

export type PromptPart = {
  boundary: TrustBoundary;
  content: string;
};

const PRIORITY: Record<TrustBoundary, number> = {
  system: 4,
  developer: 3,
  user: 2,
  tool: 1,
};

export function buildTrustedPrompt(parts: PromptPart[]): PromptPart[] {
  return parts
    .filter((part) => typeof part.content === 'string' && part.content.trim().length > 0)
    .map((part) => ({ ...part, content: part.content.trim() }))
    .sort((a, b) => PRIORITY[b.boundary] - PRIORITY[a.boundary]);
}

export function isUntrustedInstruction(content: string): boolean {
  return /(?:ignore|override|disregard)\s+(?:previous|system|developer)\s+(?:instructions?|rules?)/i.test(content);
}
