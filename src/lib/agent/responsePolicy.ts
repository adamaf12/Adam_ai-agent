import type { AgentIntent } from './intentRouter';

export interface ResponsePolicy {
  stream: boolean;
  verify: boolean;
  maxLatencyMs: number;
  intent: AgentIntent;
}

export function getResponsePolicy(intent: AgentIntent, input: string): ResponsePolicy {
  const complex = input.trim().split(/\s+/).length > 35;
  const verify = complex || intent === 'reasoning' || intent === 'web_search' || intent === 'code';
  return {
    intent,
    stream: intent !== 'image_generate' && intent !== 'image_edit' && intent !== 'video_generate',
    verify,
    maxLatencyMs: verify ? 30000 : 12000,
  };
}
