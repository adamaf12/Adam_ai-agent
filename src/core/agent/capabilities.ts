import type { AgentIntent, AgentRoute } from './agentTypes';

export type Capability = AgentIntent;

export type CapabilityRequest = {
  capability: Capability;
  reason: string;
  confidence: number;
};

export function toCapabilityRequest(route: AgentRoute): CapabilityRequest {
  return {
    capability: route.intent,
    reason: route.reason,
    confidence: Math.max(0, Math.min(1, route.confidence)),
  };
}

export function requiresDedicatedCapability(capability: Capability): boolean {
  return capability !== 'chat';
}
