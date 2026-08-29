export type ResponseQualityInput = {
  hasEvidence: boolean;
  evidenceStrength: number;
  executionSucceeded: boolean;
  consistency: number;
  requestedActionCompleted: boolean;
};

export type ResponseDecision = 'answer' | 'qualify' | 'ask_clarification';

export function chooseResponseDecision(input: ResponseQualityInput): ResponseDecision {
  const evidence = Math.max(0, Math.min(1, input.evidenceStrength));
  const consistency = Math.max(0, Math.min(1, input.consistency));
  if (!input.requestedActionCompleted && !input.executionSucceeded) return 'qualify';
  if (input.hasEvidence && evidence >= 0.7 && consistency >= 0.7) return 'answer';
  if (input.hasEvidence && evidence >= 0.45 && consistency >= 0.55) return 'qualify';
  return 'ask_clarification';
}

export function capResponse(text: string, maxChars = 40_000): string {
  const limit = Math.max(256, Math.floor(maxChars));
  const value = text.trim();
  return value.length <= limit ? value : `${value.slice(0, limit - 1).trimEnd()}…`;
}
