import { routeIntent, needsPlanning, type AgentIntent } from './intentRouter';
import { getResponsePolicy, type ResponsePolicy } from './responsePolicy';

export interface AgentPlan {
  intent: AgentIntent;
  policy: ResponsePolicy;
  steps: string[];
}

export function createAgentPlan(input: string): AgentPlan {
  const intent = routeIntent(input);
  const policy = getResponsePolicy(intent, input);
  const steps = needsPlanning(intent, input)
    ? ['understand-goal', 'select-tools', 'execute', ...(policy.verify ? ['verify'] : []), 'respond']
    : ['understand-goal', ...(policy.verify ? ['verify'] : []), 'respond'];
  return { intent, policy, steps };
}
