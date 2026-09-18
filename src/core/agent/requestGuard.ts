import { autonomousSecurityEngine } from '../security/autonomousSecurityEngine';

const MAX_PROMPT_CHARS = 12_000;

export function sanitizePrompt(input: string): string {
  const stripped = input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, MAX_PROMPT_CHARS);

  // Run through ADEM Autonomous Background Security Engine
  return autonomousSecurityEngine.inspectAndNeutralize(stripped, 'chat-prompt');
}

export function hasUsablePrompt(input: string): boolean {
  return sanitizePrompt(input).length > 0;
}
