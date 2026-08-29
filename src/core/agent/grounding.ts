export interface GroundingEvidence {
  source: string;
  content: string;
  relevance: number;
}

export function rankEvidence(evidence: GroundingEvidence[], query = '', limit = 6): GroundingEvidence[] {
  const terms = [...new Set(query.toLowerCase().split(/\s+/).filter(term => term.length > 1))];
  return evidence
    .filter(item => item.source.trim() && item.content.trim() && Number.isFinite(item.relevance))
    .map(item => {
      const haystack = `${item.source} ${item.content}`.toLowerCase();
      const hits = terms.reduce((count, term) => count + (haystack.includes(term) ? 1 : 0), 0);
      return { ...item, relevance: Math.max(0, Math.min(1, item.relevance + Math.min(0.3, hits * 0.05))) };
    })
    .sort((a, b) => b.relevance - a.relevance || a.source.localeCompare(b.source))
    .slice(0, Math.max(0, Math.floor(limit)));
}

export function hasSufficientGrounding(evidence: GroundingEvidence[], threshold = 0.55): boolean {
  const ranked = rankEvidence(evidence, '', 1);
  return ranked.length > 0 && ranked[0].relevance >= threshold;
}

export function buildGroundingNote(evidence: GroundingEvidence[], query = ''): string {
  const ranked = rankEvidence(evidence, query);
  if (!ranked.length) return 'No external evidence was available; do not present unverifiable claims as confirmed facts.';
  return ranked.map((item, index) => `[${index + 1}] ${item.source}: ${item.content.trim()}`).join('\n');
}
