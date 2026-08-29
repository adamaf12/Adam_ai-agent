import { chooseResponseDecision, type ResponseQualityInput, type ResponseDecision } from './responsePolicy';

export type QualityGateResult = ResponseQualityInput & {
  decision: ResponseDecision;
  reasons: string[];
};

export function evaluateResponseQuality(input: ResponseQualityInput): QualityGateResult {
  const reasons: string[] = [];
  if (!input.hasEvidence) reasons.push('no_evidence');
  if (input.evidenceStrength < 0.7) reasons.push('weak_evidence');
  if (input.consistency < 0.7) reasons.push('low_consistency');
  if (!input.executionSucceeded) reasons.push('execution_incomplete');
  if (!input.requestedActionCompleted) reasons.push('requested_action_incomplete');
  return { ...input, decision: chooseResponseDecision(input), reasons };
}
